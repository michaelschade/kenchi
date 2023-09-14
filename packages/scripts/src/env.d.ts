declare var process: {
  env: {
    APP_ENV: 'development' | 'staging' | 'production';
    APP_HOST: string;
    EXTENSION_ID: string;
    SENTRY_VERSION?: string;
    SCRIPTS_HOST?: string;
  };
};
