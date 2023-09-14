import { css } from '@emotion/react';
import { parse } from 'qs';
import { useHistory, useLocation } from 'react-router-dom';

import { HeaderBar, SectionHeader } from '@kenchi/ui/lib/Headers';
import { ContentContainer } from '@kenchi/ui/lib/Layout';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Link } from '@kenchi/ui/lib/Text';

import { GoogleButton } from './GoogleButton';
import { LoginError } from './LoginError';
import { useLogin } from './useLogin';
import { defaultGetAuthToken, purgeAndRedirect } from './utils';

const wrapper = css`
  position: absolute;
  height: 100%;
  width: 100%;

  display: flex;
  flex-wrap: wrap;
  align-content: flex-start;
  justify-content: center;

  p {
    font-weight: 400;
    font-size: 0.95em;
    line-height: 1.7;
    color: #31373e;
  }
`;

const footer = css`
  position: absolute;
  bottom: 10px;
  color: #778494;
  text-align: center;
  font-size: 0.8em;
  line-height: 2;

  a,
  span {
    color: #778494;
  }
`;

function LoginPage({
  getAuthToken = defaultGetAuthToken,
}: {
  getAuthToken?: typeof defaultGetAuthToken;
}) {
  const history = useHistory();
  const location = useLocation();

  const onSuccess = () => {
    const query = parse(location.search.substring(1));
    const to =
      typeof query.to === 'string' && query.to.startsWith('/') ? query.to : '/';
    purgeAndRedirect(to);
  };

  const [doLogin, loginStatus] = useLogin({ getAuthToken, onSuccess });

  return (
    <div css={wrapper}>
      <HeaderBar>
        <SectionHeader>Welcome to Kenchi!</SectionHeader>
      </HeaderBar>

      <ContentContainer>
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
      </ContentContainer>

      <div css={footer}>
        &copy; Kenchi
        <br />
        <Link onClick={() => history.push('/privacy')}>Privacy Policy</Link>
      </div>
    </div>
  );
}

export default LoginPage;
