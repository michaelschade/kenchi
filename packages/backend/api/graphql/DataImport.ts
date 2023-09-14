import { captureMessage } from '@sentry/node';
import {
  arg,
  booleanArg,
  enumType,
  extendType,
  idArg,
  nonNull,
  objectType,
} from 'nexus';
import { DataImport as Fields } from 'nexus-prisma';

import { loggedInUser } from '../auth/permissions';
import { decodeId, idResolver } from '../utils';
import {
  invalidValueError,
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';

export const DataImportTypeEnum = enumType({
  name: 'DataImportTypeEnum',
  members: ['intercom', 'textExpander', 'csv', 'zendesk'],
});

export const DataImport = objectType({
  name: 'DataImport',
  definition(t) {
    t.implements('Node');
    t.id('id', idResolver('impt'));
    t.field(Fields.createdAt);
    t.field(Fields.updatedAt);

    t.field(Fields.startedAt);
    t.field(Fields.completedAt);
    t.field(Fields.state);

    t.field('type', { type: DataImportTypeEnum });
    t.field(Fields.initialData);
  },
});

export const DataImportOutput = objectType({
  name: 'DataImportOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('dataImport', { type: 'DataImport' });
  },
});

export const DataImportMutatations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('createDataImport', {
      type: 'DataImportOutput',
      args: {
        type: nonNull('DataImportTypeEnum'),
        initialData: nonNull('Json'),
      },
      async resolve(_root, { type, initialData }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        const existingDataImport = await ctx.db.dataImport.findFirst({
          where: {
            OR: [
              { userId: user.id },
              { user: { organizationId: user.organizationId } },
            ],
          },
        });

        const dataImport = await ctx.db.dataImport.create({
          data: {
            userId: user.id,
            type,
            initialData,
          },
        });

        if (existingDataImport) {
          // We're allowing creating multiple imports for now, even though this
          // might cause duplicate entities to get created, to make the process
          // easier for users. We'll send a message to Sentry in the meantime so
          // we can track this.
          captureMessage('Multiple imports created for user/org', {
            extra: {
              existingDataImport: existingDataImport.id,
              newDataImport: dataImport.id,
            },
          });
        }

        return { dataImport };
      },
    });

    t.field('updateDataImport', {
      type: 'DataImportOutput',
      args: {
        id: nonNull(idArg()),
        state: arg({ type: 'Json' }),
        isComplete: nonNull(booleanArg()),
      },
      async resolve(_root, { id, state, isComplete }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        const [_, idNum] = decodeId(id);

        const dataImport = await ctx.db.dataImport.findUnique({
          where: { id: idNum },
          include: { user: true },
        });

        if (!dataImport) {
          return { error: notFoundError() };
        }

        if (
          dataImport.user.id !== user.id ||
          dataImport.user.organizationId !== user.organizationId
        ) {
          return { error: permissionError() };
        }

        if (dataImport.completedAt) {
          return {
            error: invalidValueError("Completed imports can't be updated"),
          };
        }

        const updatedDataImport = await ctx.db.dataImport.update({
          where: { id: idNum },
          data: {
            startedAt: !dataImport.startedAt ? new Date() : undefined,
            completedAt: isComplete ? new Date() : undefined,
            state: state,
          },
        });

        return { dataImport: updatedDataImport };
      },
    });
  },
});
