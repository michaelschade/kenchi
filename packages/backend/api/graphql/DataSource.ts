import { mapValues } from 'lodash';
import {
  extendType,
  idArg,
  inputObjectType,
  list,
  nonNull,
  objectType,
} from 'nexus';
import { DataSource as Fields } from 'nexus-prisma';

import { hasOrgPermission, loggedInUser } from '../auth/permissions';
import { generateStaticId } from '../utils';
import {
  notFoundError,
  permissionError,
  unauthenticatedError,
} from './KenchiError';

export const DataSource = objectType({
  name: 'DataSource',
  definition(t) {
    t.field({ ...Fields.id, type: 'ID' });
    t.field(Fields.organization);
    t.field(Fields.name);
    t.field(Fields.requests);
    t.field(Fields.outputs);
    t.field(Fields.isArchived);
  },
});

export const DataSourceCreateInput = inputObjectType({
  name: 'DataSourceCreateInput',
  definition(t) {
    t.nonNull.string('id');
    t.nonNull.string('name');
    t.nonNull.field('requests', { type: list(nonNull('DataSourceRequest')) });
    t.nonNull.field('outputs', { type: list(nonNull('DataSourceOutput')) });
  },
});

export const DataSourceUpdateInput = inputObjectType({
  name: 'DataSourceUpdateInput',
  definition(t) {
    t.nullable.string('name');
    t.nullable.field('requests', { type: list(nonNull('DataSourceRequest')) });
    t.nullable.field('outputs', { type: list(nonNull('DataSourceOutput')) });
  },
});

export const DataSourceGraphqlOutput = objectType({
  name: 'DataSourceGraphqlOutput',
  definition(t) {
    t.nullable.field('error', { type: 'KenchiError' });
    t.nullable.field('dataSource', {
      type: 'DataSource',
    });
  },
});

export const DataSourceMutations = extendType({
  type: 'Mutation',
  definition(t) {
    t.field('updateDataSource', {
      type: 'DataSourceGraphqlOutput',
      args: {
        id: nonNull(idArg()),
        data: nonNull('DataSourceUpdateInput'),
      },
      async resolve(_root, { id, data }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (
          'requests' in data &&
          !hasOrgPermission(user, 'manage_data_sources', user.organizationId)
        ) {
          return { error: permissionError() };
        }

        let dataSource = await ctx.db.dataSource.findUnique({
          where: { id },
        });
        if (!dataSource || dataSource.organizationId !== user.organizationId) {
          return { error: notFoundError() };
        }

        dataSource = await ctx.db.dataSource.update({
          where: { id },
          data: mapValues(data, (value: string) => value ?? undefined),
        });

        return { dataSource };
      },
    });

    t.field('createDataSource', {
      type: 'DataSourceGraphqlOutput',
      args: {
        data: nonNull('DataSourceCreateInput'),
      },
      async resolve(_root, { data }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }
        if (
          !hasOrgPermission(user, 'manage_data_sources', user.organizationId)
        ) {
          return { error: permissionError() };
        }

        const dataSource = ctx.db.dataSource.create({
          data: {
            ...data,
            id: generateStaticId('ds'),
            organizationId: user.organizationId,
          },
        });

        return { dataSource };
      },
    });

    t.field('archiveDataSource', {
      type: 'DataSourceGraphqlOutput',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        const user = loggedInUser(ctx);
        if (!user) {
          return { error: unauthenticatedError() };
        }

        let dataSource = await ctx.db.dataSource.findUnique({
          where: { id },
        });
        if (!dataSource || dataSource.organizationId !== user.organizationId) {
          return { error: notFoundError() };
        }

        dataSource = await ctx.db.dataSource.update({
          where: { id },
          data: { isArchived: true },
        });
        return { dataSource };
      },
    });
  },
});
