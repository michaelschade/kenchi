import { faExclamationTriangle } from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { MenuItemLink, MenuItemList, MenuSection } from '@kenchi/ui/lib/Menu';

import useDemoOrg from '../utils/useDemoOrg';
import useLoginAs from '../utils/useLoginAs';

export default function QuickLinks() {
  const [loginAs] = useLoginAs();
  const { data: demoOrg, loading: demoLoading } = useDemoOrg();
  const demoUser = demoOrg?.admin?.organization?.users.edges.find(
    (u) => u.node.email === 'michael@kenchi.team'
  )?.node;
  return (
    <MenuSection title="Login As">
      <MenuItemList>
        <MenuItemLink
          onClick={() => demoUser && loginAs({ userId: demoUser.id })}
        >
          Demo Account {demoLoading ? <LoadingSpinner /> : null}
          {!demoLoading && !demoUser && (
            <FontAwesomeIcon icon={faExclamationTriangle} />
          )}
        </MenuItemLink>
      </MenuItemList>
    </MenuSection>
  );
}
