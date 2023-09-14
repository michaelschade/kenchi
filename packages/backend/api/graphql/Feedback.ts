import { DateTime } from 'luxon';
import { extendType, idArg, nonNull, stringArg } from 'nexus';
import { Client as PostmarkClient } from 'postmark';
import { User } from 'prisma-client';

import { loggedInUser } from '../auth/permissions';
import { decodeId, encodeId } from '../utils';

let _postmark: PostmarkClient | null = null;
function postmark() {
  if (!_postmark) {
    if (!process.env.POSTMARK_API_KEY) {
      throw new Error('Missing env var POSTMARK_API_KEY');
    }
    _postmark = new PostmarkClient(process.env.POSTMARK_API_KEY);
  }
  return _postmark;
}

function sendAdminEmail(user: User | null, type: string, body: string) {
  let replyTo = 'support@kenchi.com';
  let name = 'unknown user';
  if (user?.email) {
    if (user.name) {
      name = `${user.name} (${user.email})`;
      replyTo = `${user.name} <${user.email}>`;
    } else {
      name = user.email;
      replyTo = user.email;
    }
  } else if (user?.name) {
    name = user.name;
  }
  const time = DateTime.now().toFormat('h:mm a');
  const subject = `New ${type} from ${name} at ${time}`;

  const payload = {
    From: 'Kenchi <support@kenchi.com>',
    To: 'Kenchi <support@kenchi.com>',
    Subject: subject,
    TextBody: body,
    ReplyTo: replyTo,
  };
  if (process.env.APP_ENV === 'development') {
    console.log('Would send email if not in development: ', payload);
  } else {
    return postmark().sendEmail(payload);
  }
}

export const sendUserFeedback = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('sendUserFeedback', {
      type: 'Boolean',
      args: {
        path: nonNull(stringArg()),
        prompt: nonNull(stringArg()),
        feedback: nonNull(stringArg()),
      },
      async resolve(_root, args, ctx) {
        const user = loggedInUser(ctx);
        await ctx.db.feedback.create({
          data: {
            ...args,
            userId: user?.id,
          },
        });

        const body = `
Page: ${args.path}
Prompt: ${args.prompt}
Feedback: ${args.feedback}
`;
        await sendAdminEmail(user, 'feedback', body);

        return true;
      },
    });

    t.field('sendToolRunLog', {
      type: 'Boolean',
      args: {
        toolId: nonNull(idArg()),
        log: nonNull('Json'),
      },
      async resolve(_root, { toolId, log }, ctx) {
        const user = loggedInUser(ctx);
        const [, decodedToolId] = decodeId(toolId);
        const runLog = await ctx.db.toolRunLog.create({
          include: {
            tool: true,
          },
          data: {
            log,
            toolId: decodedToolId,
            userId: user?.id,
          },
        });

        const body = `
Tool: ${runLog.tool?.name || decodedToolId}
Details: https://admin.kenchi.team/tool-run-logs/${encodeId('A-trl', runLog.id)}
        `;

        await sendAdminEmail(user, 'automation failure', body);

        return true;
      },
    });

    t.field('sendPageSnapshot', {
      type: 'Boolean',
      args: {
        snapshot: nonNull('Json'),
      },
      async resolve(_root, { snapshot }, ctx) {
        const user = loggedInUser(ctx);
        const pageSnapshot = await ctx.db.pageSnapshot.create({
          data: {
            snapshot,
            userId: user?.id,
          },
        });

        const body = `
Details: https://admin.kenchi.team/page-snapshots/${encodeId(
          'A-ps',
          pageSnapshot.id
        )}
        `;

        await sendAdminEmail(user, 'page snapshot', body);

        return true;
      },
    });
  },
});
