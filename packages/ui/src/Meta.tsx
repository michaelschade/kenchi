import { MetaProps, useMeta } from './useMeta';

// This component acts as a "shim" for when you can't easily use a hook to set
// page meta. An example might include when you fetch data from GraphQL, do
// some checks to make sure we didn't get an error and the data we queried for
// exists, has the right type, etc. Ideally we'd set meta based on that
// returned (and typed) object. Doing that with a hook in a "no conditionals"
// environment gets clunky.

export const Meta = (meta: MetaProps) => {
  useMeta(meta);
  return null;
};
