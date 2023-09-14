export function listFormat(item: string[]): string {
  return new Intl.ListFormat('en-US', {
    style: 'long',
    type: 'conjunction',
  }).format(item);
}
