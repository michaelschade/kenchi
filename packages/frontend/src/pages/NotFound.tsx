import { captureMessage } from '@sentry/react';
import { useLocation } from 'react-router-dom';

import { NotFoundAlert } from '../components/ErrorAlert';

export default function NotFound() {
  const location = useLocation();
  captureMessage(`Page not found ${location.pathname}`);
  return <NotFoundAlert title="Page not found" />;
}
