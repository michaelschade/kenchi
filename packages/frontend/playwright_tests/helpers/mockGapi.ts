const mockGapi = (accessToken: string): void => {
  const mockUser = {
    getAuthResponse() {
      return { access_token: accessToken };
    },
  };

  const mockAuthInstance = {
    signIn() {
      return new Promise((resolve) => {
        resolve(mockUser);
      });
    },
  };
  const mockAuth = {
    getAuthInstance() {
      return mockAuthInstance;
    },
  };

  // Getting the mock auth to match the GoogleAuth interface will require
  // a pretty extensive set of mocked classes/objects. Taking the ignore shortcut until
  // we have a good reason to really make this match.
  // @ts-ignore
  window.gapi = { auth2: mockAuth };
};

export default mockGapi;
