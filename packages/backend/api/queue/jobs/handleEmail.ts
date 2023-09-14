import { APIClient, SendEmailRequest } from 'customerio-node';

import getConfig from '../../config';
import { getDB } from '../../db';
import { isProduction } from '../../utils';

const db = getDB();
const client = new APIClient(process.env.CUSTOMERIO_APP_API_KEY);

type NewSuggestionEmail = {
  type: 'newSuggestion';
  data: {
    suggestionLink: string;
    suggestionName: string;
    suggestedBy: string | null;
    itemType: 'automation' | 'workflow';
    isNewItem: boolean;
  };
};

type NewUserInviteEmail = {
  type: 'newUserInvite';
  data: {
    invitedBy: string | null;
    invitedByEmail: string | null;
    orgName: string | null;
  };
};

export type Email = NewSuggestionEmail | NewUserInviteEmail;

// Transaction message IDs from Customer.io
const messageTypes: Record<Email['type'], string> = {
  newSuggestion: '2',
  newUserInvite: '3',
};

export const handleEmail = async (userId: number, email: Email) => {
  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    // TODO: better error?
    throw new Error('No user found for userId');
  }

  let to = user.email;
  if (!to) {
    // TODO: log/error?
    return;
  }

  // If we're not in production and not sending to ourselves,
  // send it out to the Kenchi debug list.
  if (!isProduction() && !/@kenchi.com$/.test(to)) {
    to = `debug+${to.replace('@', '+')}@kenchi.com`;
  }

  const request = new SendEmailRequest({
    to,
    transactional_message_id: messageTypes[email.type],
    message_data: {
      ...email.data,
      appHost: getConfig().appHost,
    },
    identifiers: {
      id: userId,
    },
  });

  await client.sendEmail(request);
  // TODO: test that the redis worker is gonna retry on fail?
};
