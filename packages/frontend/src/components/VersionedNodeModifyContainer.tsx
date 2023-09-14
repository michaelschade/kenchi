import { ApolloError } from '@apollo/client';
import { css, useTheme } from '@emotion/react';
import {
  faArchive,
  faArrowLeft,
  faSpinner,
  faTasks,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import capitalize from 'lodash/capitalize';
import { DateTime } from 'luxon';
import { useHistory } from 'react-router-dom';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';
import {
  HeaderBar,
  HeaderIconLink,
  SectionHeader,
} from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import Loading from '@kenchi/ui/lib/Loading';
import { Link } from '@kenchi/ui/lib/Text';

import { errorFromMutation, ModifyResult } from '../graphql/errorFromMutation';
import { BranchTypeEnum, KenchiErrorFragment } from '../graphql/generated';
import { useSimpleQueryParams } from '../utils/useQueryParams';
import { BranchBadge } from './BranchStatus';
import ErrorAlert from './ErrorAlert';

const iconStyle = css`
  font-size: 0.8rem;
`;

export function ExistingSuggestionAlert({ createdAt }: { createdAt: string }) {
  const { colors } = useTheme();
  return (
    <Alert
      title="Editing an existing suggestion"
      description={`You already have changes you proposed ${DateTime.fromISO(
        createdAt
      ).toRelative()}. You can only have one suggestion in review, but you can still make any additional changes below.`}
      primaryColor={colors.blue[11]}
      icon={<FontAwesomeIcon icon={faTasks} css={iconStyle} />}
      containerStyle={css({ marginBottom: '10px' })}
    />
  );
}

type VersionedNodeItem = {
  branches: {
    edges: {
      node: { staticId: string; branchId: string | null; createdAt: string };
    }[];
  };
  branchId: string | null;
  staticId: string;
  createdAt: string;
  createdByUser: { name: string | null; email: string | null };
  isArchived: boolean;
  archiveReason: string | null;
  branchType: BranchTypeEnum;
};

type VersionedNodeEditorProps = {
  item: VersionedNodeItem | null;
  itemName: 'playbook' | 'snippet' | 'suggestion';
  itemPath: 'playbooks' | 'snippets';
  topLevel: boolean;
  onBack: () => void;
  submitError: KenchiErrorFragment | ApolloError | null | undefined;
  onClickArchive?: () => void;
  deleteStatus?: ModifyResult;
  children: React.ReactNode;
};
export default function VersionedNodeModifyContainer({
  item,
  itemName,
  itemPath,
  topLevel,
  onBack,
  submitError,
  onClickArchive,
  deleteStatus,
  children,
}: VersionedNodeEditorProps) {
  const history = useHistory();
  const [{ fromPublished }] = useSimpleQueryParams();

  const branchByUser = item?.branches.edges[0]?.node;
  if (branchByUser && item?.branchId !== branchByUser.branchId) {
    const url = `/${itemPath}/${branchByUser.staticId}/edit/${branchByUser.branchId}?fromPublished=true`;
    if (topLevel) {
      history.replace(url);
      return <Loading name="versioned node modify container redirect" />;
    } else {
      // TODO: this link causes people to leave their edit playbook flow...
      return (
        <Alert
          title={`${capitalize(itemName)} has an existing suggestion`}
          description={
            <>
              You already have changes you proposed{' '}
              {DateTime.fromISO(branchByUser.createdAt).toRelative()}. You can
              only have one suggestion in review, which you can edit{' '}
              <Link onClick={() => history.push(url)}>here</Link>.
            </>
          }
          primaryColor={BaseColors.secondary}
          icon={<FontAwesomeIcon icon={faTasks} css={iconStyle} />}
          containerStyle={css({ marginBottom: '15px' })}
        />
      );
    }
  }

  return (
    <>
      <HeaderBar>
        <HeaderIconLink onClick={onBack} icon={faArrowLeft} />

        <SectionHeader>
          {item ? 'Edit' : 'New'} {itemName}
        </SectionHeader>

        {item && <BranchBadge item={item} itemName={itemName} />}

        {onClickArchive && (
          <HeaderIconLink
            onClick={onClickArchive}
            icon={deleteStatus?.loading ? faSpinner : faArchive}
            title={`Archive ${itemName}`}
          />
        )}
      </HeaderBar>

      <ContentContainer>
        <ErrorAlert
          title={`Error deleting ${itemName}`}
          error={deleteStatus && errorFromMutation(deleteStatus)}
        />
        {item && fromPublished && (
          <ExistingSuggestionAlert createdAt={item.createdAt} />
        )}
        {children}
        <ErrorAlert
          title={`Error ${item ? 'updating' : 'creating'} ${itemName}`}
          error={submitError}
          style={css({ marginTop: '10px' })}
        />
      </ContentContainer>
    </>
  );
}
