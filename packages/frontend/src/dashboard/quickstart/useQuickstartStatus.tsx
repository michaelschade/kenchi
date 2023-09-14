import { createContext, useContext, useMemo, useState } from 'react';

import { gql, useQuery } from '@apollo/client';

import { QuickstartQuery } from '../../graphql/generated';
import { hasVisibleOrg } from '../../graphql/utils';
import { useExtensionStatus } from './useExtensionStatus';

export enum StepsEnum {
  createPlaybook = 'createPlaybook',
  createSnippet = 'createSnippet',
  installExtension = 'installExtension',
  inviteTeam = 'inviteTeam',
  importContent = 'importContent',
  complete = 'complete',
}

const QUICKSTART_QUERY = gql`
  query QuickstartQuery {
    viewer {
      user {
        id
        hasWorkflow
        hasTool
      }
      organization {
        id
        shadowRecord
        users(first: 2) {
          edges {
            node {
              id
            }
          }
        }
      }
    }
  }
`;

type QuickstartStatus = {
  isLoggedIn: boolean;
  hasWorkflow: boolean;
  hasTool: boolean;
  hasExtension: boolean | null;
  hasInvitedUser: boolean;
  hasOrg: boolean;
  loading: boolean;
  refetch: () => void;
  firstIncompleteStep: StepsEnum | null;
  setSkippedInviteTeam: (skipped: boolean) => void;
  skippedInviteTeam: boolean;
};

const QuickstartStatusContext = createContext<QuickstartStatus | null>(null);

export const QuickstartStatusProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [skippedInviteTeam, setSkippedInviteTeam] = useState(false);
  const { hasExtension } = useExtensionStatus();

  const { data, loading, refetch } = useQuery<QuickstartQuery>(
    QUICKSTART_QUERY,
    { fetchPolicy: 'cache-and-network', nextFetchPolicy: 'cache-first' }
  );

  const user = data?.viewer.user;
  const org = data?.viewer.organization;

  const hasWorkflow = Boolean(user?.hasWorkflow);
  const hasTool = Boolean(user?.hasTool);
  const hasInvitedUser = Boolean(org && org.users.edges.length > 1);
  const hasOrg = hasVisibleOrg(data?.viewer);

  const firstIncompleteStep = useMemo(() => {
    const stepStatus = {
      [StepsEnum.createSnippet]: hasTool,
      [StepsEnum.createPlaybook]: hasWorkflow,
      [StepsEnum.installExtension]: hasExtension,
      [StepsEnum.inviteTeam]: skippedInviteTeam || hasInvitedUser,
    };
    const incompleteSteps = (Object.keys(stepStatus) as StepsEnum[]).filter(
      (step) => !stepStatus[step as keyof typeof stepStatus]
    );
    return incompleteSteps[0];
  }, [hasTool, hasWorkflow, hasExtension, skippedInviteTeam, hasInvitedUser]);

  return (
    <QuickstartStatusContext.Provider
      value={{
        hasExtension,
        hasInvitedUser,
        skippedInviteTeam,
        hasOrg,
        firstIncompleteStep,
        hasTool,
        hasWorkflow,
        isLoggedIn: !!user,
        loading,
        refetch,
        setSkippedInviteTeam,
      }}
    >
      {children}
    </QuickstartStatusContext.Provider>
  );
};

export const useQuickstartStatus = (): QuickstartStatus => {
  const quickstartStatusContext = useContext(QuickstartStatusContext);
  if (!quickstartStatusContext) {
    throw new Error(
      'useQuickstartStatus must be used within a QuickstartStatusProvider'
    );
  }
  return quickstartStatusContext;
};
