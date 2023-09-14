import { useEffect, useState } from 'react';

import { Redirect } from 'react-router-dom';

import { PageContainer } from '@kenchi/ui/lib/Dashboard/PageContainer';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';
import { Stack } from '@kenchi/ui/lib/Stack';

import ErrorAlert from '../../components/ErrorAlert';
import { usePreparedImport } from '../../settings/usePreparedImport';

export const PendingImportPage = () => {
  const [preparedImport] = usePreparedImport();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setTimedOut(true);
    }, 30_000);
  }, []);

  return (
    <PageContainer meta={{ title: 'Import' }} heading="Import">
      {preparedImport.state === 'pending' ? (
        <Stack gap={2}>
          <LoadingSpinner name="pending import" />
          <div>{preparedImport.message}</div>
          {timedOut ? (
            <div>
              This is taking longer than expected. Maybe something went wrong?
            </div>
          ) : null}
        </Stack>
      ) : null}

      {preparedImport.state === 'error' ? (
        <ErrorAlert error={<>{preparedImport.message}</>} />
      ) : null}

      {preparedImport.state === 'complete' ? (
        <Redirect to={preparedImport.url} />
      ) : null}
    </PageContainer>
  );
};

// Export default for lazy loading
export default PendingImportPage;
