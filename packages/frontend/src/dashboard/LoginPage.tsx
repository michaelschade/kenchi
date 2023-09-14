import { parse } from 'qs';
import { useLocation } from 'react-router-dom';

import { Dialog, DialogContent, DialogHeader } from '@kenchi/ui/lib/Dialog';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { GoogleButton } from '../login/GoogleButton';
import { LoginError } from '../login/LoginError';
import { useLogin } from '../login/useLogin';
import { defaultGetAuthToken, purgeAndRedirect } from '../login/utils';

function LoginPage({
  getAuthToken = defaultGetAuthToken,
}: {
  getAuthToken?: typeof defaultGetAuthToken;
}) {
  const location = useLocation();

  const onSuccess = () => {
    const query = parse(location.search.substring(1));
    const to =
      typeof query.to === 'string' && query.to.startsWith('/')
        ? query.to
        : '/dashboard';
    purgeAndRedirect(to);
  };

  const [doLogin, loginStatus] = useLogin({ getAuthToken, onSuccess });

  return (
    <Dialog width="small" isOpen={true}>
      <DialogHeader>
        <h2>Welcome to Kenchi!</h2>
      </DialogHeader>
      <DialogContent>
        <p>
          Kenchi is a privacy-first Chrome extension that supercharges your
          support tools. As a single source of truth, Kenchi reduces cognitive
          load, fosters collaboration across your whole team, and generates
          precise insights about your support conversations.
        </p>
        <p>We're excited to show you around. Let's get started:</p>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          {loginStatus.loading || loginStatus.success ? (
            <LoadingSpinner />
          ) : (
            <GoogleButton onClick={doLogin} />
          )}
        </div>

        <LoginError error={loginStatus.error} />
      </DialogContent>
    </Dialog>
  );
}

export default LoginPage;
