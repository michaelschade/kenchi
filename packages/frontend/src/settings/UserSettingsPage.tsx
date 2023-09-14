import { useHistory } from 'react-router-dom';

import UserSettings from './UserSettings';

export default function UserSettingsPage() {
  const history = useHistory();
  return <UserSettings onBack={() => history.goBack()} />;
}
