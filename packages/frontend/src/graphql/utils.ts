type ViewerSubset = { organization: { shadowRecord: boolean } | null };
type ViewerWithOrg<TViewer extends ViewerSubset> = TViewer & {
  organization: NonNullable<TViewer['organization']>;
};
export function hasVisibleOrg<TViewer extends ViewerSubset>(
  viewer: TViewer | null | undefined
): viewer is ViewerWithOrg<TViewer> {
  return !!(viewer?.organization && !viewer.organization.shadowRecord);
}
