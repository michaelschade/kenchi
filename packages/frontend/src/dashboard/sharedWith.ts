type ACL = {
  user?: { name: string | null } | null;
  userGroup?: { name: string } | null;
};

export const sharedWith = (acl: ACL[]) => {
  const sharedWithGroups = acl.filter((entry) => 'userGroup' in entry);
  const sharedWithUsers = acl.filter((entry) => 'user' in entry);

  const values = [];

  if (sharedWithGroups.length === 1 && sharedWithGroups[0].userGroup) {
    values.push(sharedWithGroups[0].userGroup.name);
  } else if (sharedWithGroups.length > 1) {
    values.push(`${sharedWithGroups.length} groups`);
  }

  if (sharedWithUsers.length === 1 && sharedWithUsers[0].user) {
    values.push(sharedWithUsers[0].user.name);
  } else if (sharedWithUsers.length > 1) {
    values.push(`${sharedWithUsers.length} users`);
  }

  return values.join(' and ');
};
