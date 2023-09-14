export function isDemoUrl(url: URL) {
  return url.origin === process.env.REACT_APP_HOST && url.pathname === '/demo';
}
