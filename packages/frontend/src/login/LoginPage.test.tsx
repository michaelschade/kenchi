import { LoginMutation } from '../graphql/generated';
import { fireEvent, render, waitFor } from '../testUtils';
import LoginPage from './LoginPage';

const loginOutput: LoginMutation['modify'] = {
  __typename: 'ViewerOutput',
  error: null,
  viewer: {
    __typename: 'Viewer',
    user: {
      __typename: 'User',
      id: 'ABC',
      email: 'brian@brian.brian',
    },
  },
};

test('allows login', async () => {
  const { getByText, history } = render(
    <LoginPage getAuthToken={() => Promise.resolve('A_TOKEN')} />,
    {
      apolloMocks: {
        Json: () => ({}),
      },
      apolloResolvers: {
        Mutation: {
          login: (_, { token }) => {
            expect(token).toBe('A_TOKEN');
            return loginOutput;
          },
        },
      },
      initialPath: '/login',
    }
  );

  expect(history.location.pathname).toBe('/login');
  const linkElement = getByText(/Sign in with Google/i);

  expect(linkElement).toBeInTheDocument();
  fireEvent.click(linkElement);

  await waitFor(() => expect(window.location.pathname).toBe('/'));
});
