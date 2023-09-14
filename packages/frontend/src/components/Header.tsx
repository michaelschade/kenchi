import { useServiceWorker } from '../serviceWorker/useServiceWorker';
import NeedsUpdate from './NeedsUpdate';

export default function Header() {
  const serviceWorker = useServiceWorker();
  if (serviceWorker.needsUpdate) {
    return <NeedsUpdate />;
  }
}
