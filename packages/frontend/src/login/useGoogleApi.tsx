import { useEffect } from 'react';

const useGoogleAPI = () => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/client.js';
    script.onload = () => {
      window.gapi.load('client', () => {
        window.gapi.client
          .init({
            // This is different from the one in the extension manifest
            clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID,
            scope: 'email',
          })
          .then(() => {
            window.gapiOnClientLoad?.();
          })
          .catch((e: any) => {
            if (
              'details' in e &&
              e.details === 'Cookies are not enabled in current environment.'
            ) {
              console.log(
                'Third party cookies are disabled: unable to use Google Auth implicitly'
              );
              window.gapiCookieError = true;
              window.gapiOnClientLoad?.();
            } else {
              throw e;
            }
          });
      });
    };

    document.body.appendChild(script);
  }, []);
};

export default useGoogleAPI;
