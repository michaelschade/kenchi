import { extendType, idArg, interfaceType, nonNull } from 'nexus';
import { PrismaClient, User } from 'prisma-client';

import { loggedInUser, userHasCollectionPermission } from '../auth/permissions';
import { decodeId } from '../utils';

export const Node = interfaceType({
  name: 'Node',
  resolveType: (item: any) => item.__typename,
  definition(t) {
    t.id('id');
  },
});

export const NodeQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nullable.field('node', {
      type: 'Node',
      args: {
        id: nonNull(idArg()),
      },
      async resolve(_root, { id }, ctx) {
        let type: string;
        let idNum: number;
        try {
          const decoded = decodeId(id);
          type = decoded[0];
          idNum = decoded[1];
        } catch (e) {
          return null;
        }

        const user = loggedInUser(ctx);
        switch (type) {
          case 'coll':
            if (!user) {
              return null;
            }
            return collectionNode(ctx.db, user, idNum);
          case 'wrev':
            if (!user) {
              return null;
            }
            return workflowNode(ctx.db, user, idNum);
          case 'ugrp':
            if (!user) {
              return null;
            }
            return userGroupNode(ctx.db, user, idNum);
          case 'impt':
            if (!user) {
              return null;
            }
            return dataImportNode(ctx.db, user, idNum);
          case 'chng':
            return productChangeNode(ctx.db, idNum);
        }

        return null;
      },
    });
  },
});

async function collectionNode(db: PrismaClient, user: User, id: number) {
  const collection = await db.collection.findUnique({ where: { id } });
  if (!collection) {
    return null;
  }
  if (await userHasCollectionPermission(user, id, 'see_collection')) {
    // TODO: Right now we have to add __typename whenever we're returning
    // a Node. Instead we should build a map from ID prefix to type.
    return {
      ...collection,
      __typename: 'Collection',
    };
  } else if (
    collection.organizationId &&
    collection.organizationId === user.organizationId
  ) {
    return {
      ...collection,
      __typename: 'LimitedCollection',
    };
  } else {
    return null;
  }
}

async function workflowNode(db: PrismaClient, user: User, id: number) {
  const workflow = await db.workflow.findUnique({
    include: { collection: true },
    where: { id },
  });
  if (workflow && workflow.collection.organizationId === user.organizationId) {
    // TODO: Right now we have to add __typename whenever we're returning
    // a Node. Instead we should build a map from ID prefix to type.
    return {
      ...workflow,
      __typename: 'WorkflowRevision',
    };
  }
  return null;
}

async function userGroupNode(db: PrismaClient, user: User, id: number) {
  const group = await db.userGroup.findUnique({
    include: { members: { where: { userId: user.id } } },
    where: { id },
  });
  if (
    group &&
    (group.organizationId === user.organizationId || group.members.length > 0)
  ) {
    // TODO: Right now we have to add __typename whenever we're returning
    // a Node. Instead we should build a map from ID prefix to type.
    return {
      ...group,
      __typename: 'UserGroup',
    };
  }
  return null;
}

async function dataImportNode(db: PrismaClient, user: User, id: number) {
  const dataImport = await db.dataImport.findUnique({
    include: {
      user: true,
    },
    where: { id },
  });
  if (user.organizationId === dataImport?.user.organizationId) {
    // TODO: Right now we have to add __typename whenever we're returning
    // a Node. Instead we should build a map from ID prefix to type.
    return {
      ...dataImport,
      __typename: 'DataImport',
    };
  }
  return null;
}

async function productChangeNode(db: PrismaClient, id: number) {
  const pc = await db.productChange.findUnique({ where: { id } });
  if (pc) {
    return {
      ...pc,
      __typename: 'ProductChange',
    };
  }
  return null;
}
