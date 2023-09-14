declare var process: {
  env: {
    APP_ENV: 'development' | 'staging' | 'production';
    API_HOST: string;
    APP_HOST: string;
    SCRIPTS_HOST: string;
    EXTENSION_ID: string;
    SENTRY_VERSION?: string;
  };
};

declare interface Window {
  hasContentScript?: boolean;
}
