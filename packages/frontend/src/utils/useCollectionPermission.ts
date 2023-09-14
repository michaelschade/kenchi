import { CollectionFragment } from '../graphql/generated';
import { pluralize } from '.';

export enum CollectionPermission {
  EVERYONE = 'EVERYONE',
  SOME = 'SOME',
  PRIVATE = 'PRIVATE',
}

export function useCollectionPermission(
  collection: CollectionFragment | undefined,
  userId: string | undefined
) {
  if (!collection || !userId) {
    return [undefined, undefined] as const;
  }

  let permission: CollectionPermission;

  if (collection.organization && collection.defaultPermissions.length) {
    permission = CollectionPermission.EVERYONE;
  } else if (
    collection.acl.length === 1 &&
    collection.acl[0].user?.id === userId
  ) {
    permission = CollectionPermission.PRIVATE;
  } else {
    permission = CollectionPermission.SOME;
  }

  let string;
  switch (permission) {
    case CollectionPermission.EVERYONE:
      string = `Everyone at ${collection.organization!.name || 'organization'}`;
      break;
    case CollectionPermission.PRIVATE:
      string = `Private to me`;
      break;
    case CollectionPermission.SOME:
      let groups = 0;
      let users = 0;
      collection.acl.forEach((acl) => {
        if (acl.user) {
          users++;
        } else {
          groups++;
        }
      });
      string = [
        groups && pluralize(groups, 'group'),
        users && pluralize(users, 'user'),
      ]
        .filter((x) => x)
        .join(', ');
  }

  return [permission, string] as const;
}
