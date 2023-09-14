import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  clearMockMessageRouter,
  expectAddedCommandHandler,
  expectSentCommand,
  sendCommand,
} from '../test/helpers/messageRouter';
import { render } from '../testUtils';
import PromptForLogin from './PromptForLogin';

beforeEach(() => clearMockMessageRouter());
it('closes the HUD on escape', async () => {
  render(
    <PromptForLogin
      doLogin={jest.fn()}
      loginStatus={{ success: false, loading: false, error: null }}
    />,
    { providerStack: 'hud' }
  );

  await waitFor(() => {
    expectAddedCommandHandler('pageScript', 'keyPress');
  });

  sendCommand('pageScript', 'keyPress', { key: 'Escape' });
  await waitFor(() => {
    expectSentCommand({
      destination: 'pageScript',
      command: 'hud:hide',
    });
  });
});

it('calls login callback on click', async () => {
  const loginCallback = jest.fn();
  const { findByText } = render(
    <PromptForLogin
      doLogin={loginCallback}
      loginStatus={{ success: false, loading: false, error: null }}
    />,
    { providerStack: 'hud' }
  );

  userEvent.click(await findByText(/Sign in with Google/));
  await waitFor(() => {
    expect(loginCallback).toBeCalled();
  });
});
