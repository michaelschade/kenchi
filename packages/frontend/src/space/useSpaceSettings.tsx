import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { gql, useApolloClient, useMutation } from '@apollo/client';
import { captureMessage } from '@sentry/react';
import updateObj from 'immutability-helper';
import sortBy from 'lodash/sortBy';
import { useDebouncedCallback } from 'use-debounce';

import { KenchiErrorFragment } from '../graphql/fragments';
import {
  CollectionListItemFragment,
  PageSettingsMutation,
  PageSettingsMutationVariables,
  UserItemSettingsFragment,
} from '../graphql/generated';

/**
 * `SpaceSettings` is the JSON blob we'll get and store server-side. Right now
 * it only contains `sections`, a mapping from `collectionId` or a special ID
 * (prefixed with __) to a config blob of two possible types (see
 * `UserSectionConfig`):
 *   - {
 *       type: 'special',
 *       sort: 'alphabetical',
 *       limit: 10,
 *     }
 *   - {
 *       type: 'collection',
 *       first: 'tools' | 'workflows',
 *       tools: {
 *         sort: 'alphabetical',
 *         limit: 10,
 *       },
 *       workflows:
 *         sort: 'alphabetical',
 *         limit: 10,
 *       },
 *     }
 */

export type SortType = 'alphabetical' | 'topUsed';

// User*SectionConfig is what gets stored in the DB

export type UserBaseSectionConfig = {
  sort?: SortType;
  hidden?: boolean;
  collapsed?: boolean;
  limit?: number;
};

export type UserSpecialSectionConfig = {
  type: 'special';
} & UserBaseSectionConfig;
export type UserCollectionSectionConfig = {
  type: 'collection';
  first?: 'tools' | 'workflows';
  workflows?: UserBaseSectionConfig;
  tools?: UserBaseSectionConfig;
};

export type UserSectionConfig =
  | UserSpecialSectionConfig
  | UserCollectionSectionConfig;

type UserSpaceSettings = {
  sections?: Record<string, UserSectionConfig>;
};

// Full*SectionConfig is what we generate to pass into rendering

export type FullSpecialSectionConfig = {
  type: 'special';
  key: string;
  userConfig: UserSpecialSectionConfig;
};

export type FullCollectionSectionConfig = {
  type: 'collection';
  key: string;
  collection: CollectionListItemFragment;
  userConfig: UserCollectionSectionConfig;
};

export type FullSectionConfig =
  | FullSpecialSectionConfig
  | FullCollectionSectionConfig;

export const DEFAULT_SECTION_FIRST: 'tools' | 'workflows' = 'workflows';
export const DEFAULT_SECTION_SORT: SortType = 'alphabetical';
export const DEFAULT_SECTION_LIMIT = 5;

export const DEFAULT_BASE_SECTION_CONFIG: UserBaseSectionConfig = {
  sort: DEFAULT_SECTION_SORT,
  limit: DEFAULT_SECTION_LIMIT,
};

export const DEFAULT_USER_COLLECTION_CONFIG: UserCollectionSectionConfig = {
  type: 'collection',
  tools: {
    ...DEFAULT_BASE_SECTION_CONFIG,
  },
  workflows: {
    ...DEFAULT_BASE_SECTION_CONFIG,
  },
};

const PAGE_SETTINGS_MUTATION = gql`
  mutation PageSettingsMutation($staticId: String!, $data: Json!) {
    setUserItemSettings(data: $data, staticId: $staticId) {
      error {
        ...KenchiErrorFragment
      }
      userItemSettings {
        staticId
        data
      }
    }
  }
  ${KenchiErrorFragment}
`;

const USER_ITEM_SETTINGS_FRAGMENT = gql`
  fragment UserItemSettingsFragment on UserItemSettings {
    staticId
    data
  }
`;

type SettingsContextProps = {
  data: UserSpaceSettings | null;
  staticId: string;
  collectionIds: string[] | null;
};

const SettingsContext = createContext<SettingsContextProps | null>(null);

export function SpaceSettingsProvider({
  data,
  staticId,
  children,
  collectionIds,
}: SettingsContextProps & { children: React.ReactNode }) {
  return (
    <SettingsContext.Provider value={{ data, staticId, collectionIds }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useListSections(
  allCollections: Record<string, CollectionListItemFragment>
) {
  const settings = useRawSpaceSettings();

  return useMemo(() => {
    const sectionConfig = settings?.data?.sections || {};
    const explicitCollectionIds = new Set(settings?.collectionIds || []);

    const implicitSections: FullCollectionSectionConfig[] = [];
    const addToImplicitSections = (collection: CollectionListItemFragment) => {
      if (explicitCollectionIds.has(collection.id)) {
        return;
      }
      const userConfig =
        sectionConfig[collection.id] || DEFAULT_USER_COLLECTION_CONFIG;
      if (userConfig.type === 'special') {
        captureMessage('Got special config for collection');
        return;
      }
      implicitSections.push({
        type: 'collection',
        key: collection.id,
        userConfig,
        collection,
      });
    };
    Object.values(allCollections).forEach((collection) => {
      addToImplicitSections(collection);
    });

    // TODO: not sure why name is sometimes null...partial results fetch?
    return sortBy(implicitSections, (section) =>
      section.collection.name?.toLowerCase()
    );
  }, [settings, allCollections]);
}

// We don't want to have to pass all of UserSpaceSettings into each section that
// just wants to update a subset (and can't just pass a callback since the
// callback would need to change everytime PageSettings changes). Instead, we're
// hijacking useState's callback functionality so we can have sections update
// just a subset, and then we listen/do the mutation up here.
export type UpdateSpaceSettings = (sectionConfig: FullSectionConfig) => void;
export function useSpaceSettings(): [
  UserSpaceSettings | null,
  UpdateSpaceSettings
] {
  const [settings, setSettings] = useState<UserSpaceSettings | null>(null);
  const ps = useRawSpaceSettings();
  if (!ps) {
    throw new Error('Expected SpaceSettingsProvider');
  }
  const { data, staticId } = ps;

  // TODO: we run the risk of out of order deliveries because there's no
  // mechanism to cancel mutations, and Apollo only dedupes when the same
  // variables are used. We should potentially use a request timestamp mechanism
  // to make sure only the latest setting it saved.
  //
  // See https://github.com/apollographql/apollo-client/issues/4150#issuecomment-500127694
  const client = useApolloClient();
  const [mutate] = useMutation<
    PageSettingsMutation,
    PageSettingsMutationVariables
  >(PAGE_SETTINGS_MUTATION, {
    context: {
      queryDeduplication: false,
      noBatch: true, // Don't batch since we might cancel
    },
    // This is probably bad for perf: https://github.com/apollographql/apollo-client/issues/4141
    // Instead we need to proactively mutate the cache without using optimisticResponse.
    // optimisticResponse: vars => ({
    //   __typename: 'Mutation',
    //   setUserItemSettings: {
    //     __typename: 'UserItemSettingsOutput',
    //     error: null,
    //     userItemSettings: {
    //       __typename: 'UserItemSettings',
    //       ...vars,
    //     }
    //   }
    // })
  });
  const abortControllerRef = useRef<AbortController>();

  const debouncedMutate = useDebouncedCallback(
    (data: UserSpaceSettings, staticId: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;
      mutate({
        fetchPolicy: 'no-cache',
        variables: {
          data,
          staticId,
        },
        context: {
          fetchOptions: {
            signal: abortController.signal,
          },
        },
      });
    },
    500
  );

  // Any extenral data fetch overrides
  useEffect(() => {
    if (data) {
      setSettings(data);
    }
  }, [data]);

  const updateSettings = useCallback(
    (sectionConfig: FullSectionConfig) => {
      setSettings((dataOrNull) => {
        let sections = dataOrNull?.sections || {};
        sections = updateObj(sections, {
          [sectionConfig.key]: {
            $set: sectionConfig.userConfig,
          },
        });
        const settings = { sections };

        // Immediately presume success and update. It may be weird to do this
        // inside of the set callback, but it seems to work.
        client.writeFragment<UserItemSettingsFragment>({
          fragment: USER_ITEM_SETTINGS_FRAGMENT,
          data: {
            __typename: 'UserItemSettings',
            data: settings,
            staticId,
          },
        });

        debouncedMutate(settings, staticId);

        return settings;
      });
    },
    [client, debouncedMutate, staticId]
  );

  return [settings, updateSettings];
}

export function useRawSpaceSettings() {
  return useContext(SettingsContext);
}
