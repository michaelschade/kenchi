import { useState } from 'react';

import { css } from '@emotion/react';

import { PrimaryButton } from '@kenchi/ui/lib/Button';
import { LoadingSpinner } from '@kenchi/ui/lib/Loading';

import EmailListFormGroup from './EmailListFormGroup';

const buttonStyle = css`
  gap: 0.5rem;
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
`;

type Props = {
  onBack: () => void;
  onSubmit: (emails: string[]) => void;
  loading: boolean;
};

export default function CreateOrgInviteStep({ onSubmit, loading }: Props) {
  const [emails, setEmails] = useState<string[]>([]);

  return (
    <>
      <EmailListFormGroup
        emails={emails}
        setEmails={setEmails}
        label="Emails to invite"
        autoFocus
      />
      <div css={buttonStyle}>
        <PrimaryButton
          disabled={emails.length === 0 || loading}
          onClick={() => onSubmit(emails)}
        >
          Invite{' '}
          {loading && (
            <>
              {' '}
              <LoadingSpinner name="create org invite step" />
            </>
          )}
        </PrimaryButton>
      </div>
    </>
  );
}
