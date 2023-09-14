import { useEffect, useMemo, useState } from 'react';

import { MessageBlob } from '@michaelschade/kenchi-message-router';

import useSettings from '../../graphql/useSettings';
import { usePageDataController } from './usePageDataController';

export const usePageVariables = () => {
  const [userVariables, setUserVariables] = useState<Record<string, string>>(
    {}
  );
  const [pageVariables, setPageVariables] = useState<Record<string, string>>(
    {}
  );
  const pageDataController = usePageDataController();
  const settings = useSettings();

  useEffect(() => {
    const callback = (activeVariables: MessageBlob) => {
      setPageVariables(activeVariables as Record<string, string>);
    };
    pageDataController.addListener(callback);
    return () => pageDataController.removeListener(callback);
  }, [pageDataController]);

  useEffect(() => {
    const user = settings?.viewer.user;
    if (user) {
      const userVariables: Record<string, string> = {};
      if (user.email) {
        userVariables.authorEmail = user.email;
        userVariables.authorDomain = user.email.split('@')[1];
      }
      if (user.name) {
        userVariables.authorName = user.name;
      }
      if (user.givenName) {
        userVariables.authorFirstName = user.givenName;
      }
      setUserVariables(userVariables);
    }
  }, [settings]);

  return useMemo(() => {
    // We prefix all of these with `page:` to differentiate between these and
    // non-page-fillable variables.

    const prefixedVariables: Record<string, string> = {};
    for (const key in userVariables) {
      if (userVariables[key]) {
        prefixedVariables[`page:${key}`] = userVariables[key];
      }
    }

    for (const key in pageVariables) {
      if (pageVariables[key]) {
        prefixedVariables[`page:${key}`] = pageVariables[key];
      }
    }

    return prefixedVariables;
  }, [userVariables, pageVariables]);
};
