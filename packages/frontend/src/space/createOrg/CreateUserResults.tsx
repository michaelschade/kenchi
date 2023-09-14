import { css } from '@emotion/react';
import {
  faCheckCircle,
  faExclamationTriangle,
} from '@fortawesome/pro-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { captureMessage } from '@sentry/react';
import { partition } from 'lodash';

import Alert from '@kenchi/ui/lib/Alert';
import { BaseColors } from '@kenchi/ui/lib/Colors';

import { isExtension, pluralize } from '../../utils';
import { CreateUserResult } from './useInviteTeam';

export default function CreateUserResults({
  data,
}: {
  data: Record<string, CreateUserResult>;
}) {
  const [success, failure] = partition(
    Object.entries(data),
    ([_email, { success }]) => success
  );

  if (success.length === 0 && failure.length === 0) {
    return null;
  }

  if (failure.length === 0) {
    return (
      <Alert
        title={`Successfully invited ${pluralize(
          success.length,
          'person',
          'people'
        )}`}
        description="If you want you can setup more details for your organization"
        icon={<FontAwesomeIcon icon={faCheckCircle} />}
        primaryColor={BaseColors.success}
        containerStyle={css({ marginBottom: '10px' })}
      />
    );
  }

  const description = [];
  if (success.length > 0) {
    description.push(
      <>
        We successfully invited {pluralize(success.length, 'person', 'people')},
        but we were unable to invite{' '}
        {failure.map(([email]) => email).join(', ')}.
      </>
    );
  } else {
    description.push(
      <>
        We were unable to invite {failure.map(([email]) => email).join(', ')}.
      </>
    );
  }

  description.push(
    <>
      {' '}
      You can{' '}
      <a target={isExtension() ? '_blank' : undefined} href="/dashboard/users">
        try again
      </a>{' '}
      or <a href="mailto:support@kenchi.com">contact us</a> and we'll manually
      invite them for you.
    </>
  );
  captureMessage('User invite issue', {
    extra: {
      errors: failure.map(([email, { error }]) => ({
        email,
        message: error?.message,
      })),
    },
  });

  return (
    <Alert
      title={`Issues with ${pluralize(failure.length, 'invitation')}`}
      description={description}
      icon={<FontAwesomeIcon icon={faExclamationTriangle} />}
      primaryColor={BaseColors.warning}
      containerStyle={css({ marginBottom: '10px' })}
    />
  );
}
