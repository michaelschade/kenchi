import { useEffect } from 'react';

import { css } from '@emotion/react';

import { Commands } from '@kenchi/commands';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import { GoogleButton } from '../login/GoogleButton';
import { LoginError } from '../login/LoginError';
import { useLogin } from '../login/useLogin';
import useMessageRouter from '../utils/useMessageRouter';

const messageStyles = css`
  padding-top: 10px;
`;
const PromptForLogin = ({
  doLogin,
  loginStatus,
}: {
  doLogin: ReturnType<typeof useLogin>[0];
  loginStatus: ReturnType<typeof useLogin>[1];
}) => {
  const router = useMessageRouter<'hud'>();
  useEffect(() => {
    const handleKeyPress = ({ key }: Commands['hud']['keyPress']['args']) => {
      switch (key) {
        case 'Escape':
          router.sendCommand('pageScript', 'hud:hide');
          break;
      }
      return Promise.resolve();
    };
    router.addCommandHandler('pageScript', 'keyPress', handleKeyPress);
    return () => {
      router.removeCommandHandler('pageScript', 'keyPress', handleKeyPress);
    };
  }, [router]);

  return (
    <>
      <p className="text-muted" css={messageStyles}>
        Sign in to search your Kenchi snippets
      </p>
      <div
        style={{ textAlign: 'center', marginBottom: '10px', marginTop: '10px' }}
      >
        {loginStatus.loading || loginStatus.success ? (
          <LoadingSpinner />
        ) : (
          <GoogleButton onClick={doLogin} />
        )}
      </div>
      {/* Error message was animating every time the hud reopened. Disable as a workaround. */}
      <LoginError error={loginStatus.error} disableAnimation />
    </>
  );
};

export default PromptForLogin;
