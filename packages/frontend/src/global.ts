import { InsertionPath as BackingInsertionPath } from '@kenchi/commands';
import type { ToolInput as ToolInputType } from '@kenchi/slate-tools/lib/tool/types';
import type { SlateNode } from '@kenchi/slate-tools/lib/types';

declare global {
  interface Window {
    didHitErrorBoundary?: boolean;
    needsUpdate?: boolean;
    gapiCookieError?: boolean;
    gapiOnClientLoad?: () => void;
    // TODO: make these kenchi-specific, e.g. window.kenchiNavigateToPathname or window.kenchi.navigateToPathname
    // Injected via scripts/walkthrough
    navigateToPathname?: (pathname: string) => Promise<void>;
  }

  interface WindowEventMap {
    // TODO: figure out how to share these event types with scripts
    // Used only in scripts/walkthrough
    'kenchi:app:location': CustomEvent<{ pathname: string }>;
    'kenchi:app:rect': CustomEvent<{ name: string; rect: DOMRect }>;
  }

  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_ENV: 'development' | 'staging' | 'production' | 'test';
      REACT_APP_HOST: string;
      REACT_APP_EXTENSION_ID: string;
      REACT_APP_API_HOST: string;
      REACT_APP_GOOGLE_CLIENT_ID: string;
      REACT_APP_SENTRY_DSN: string;
      REACT_APP_INTERCOM_CLIENT_ID: string;
    }
  }

  namespace KenchiGQL {
    type DateTime = string;
    type Json = any;
    type InsertionPath = BackingInsertionPath;
    type SlateNodeArray = SlateNode[];
    type ToolInput = ToolInputType;
    // TODO: clean up typing for ToolConfiguration, it's messy right now
    type ToolConfiguration = any;
    type WidgetInput = { dataSourceVariableId: string; placeholder: string };
    type Upload = File;
  }
}

// Needs an export
const __globalNoop = {};
export default __globalNoop;
