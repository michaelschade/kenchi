const appEnvs = [
  'development' as const,
  'staging' as const,
  'production' as const,
  'testing' as const,
];
type AppEnv = typeof appEnvs[0];
function isAppEnv(value: string): value is AppEnv {
  return appEnvs.includes(value as AppEnv);
}

type Config = {
  adminHost: string;
  adminApiHost: string;
  appHost: string;
  siteHost: string;
  apiHost: string;
};

const CONFIG: Record<AppEnv, Config> = {
  development: {
    adminHost: 'https://admin.kenchi.dev',
    adminApiHost: 'https://admin-api.kenchi.dev',
    appHost: 'https://app.kenchi.dev',
    siteHost: 'https://www.kenchi.dev',
    apiHost: 'https://api.kenchi.dev',
  },
  staging: {
    adminHost: 'https://staging-admin.kenchi.team',
    adminApiHost: 'https://staging-admin-api.kenchi.team',
    appHost: 'https://app.staging.kenchi.dev',
    siteHost: 'https://staging.kenchi.dev',
    apiHost: 'https://api.staging.kenchi.dev',
  },
  production: {
    adminHost: 'https://admin.kenchi.team',
    adminApiHost: 'https://admin-api.kenchi.team',
    appHost: 'https://app.kenchi.com',
    siteHost: 'https://kenchi.com',
    apiHost: 'https://api.kenchi.com',
  },
  testing: {
    adminHost: 'https://admin.kenchi.dev',
    adminApiHost: 'https://admin-api.kenchi.dev',
    appHost: 'https://app.kenchi.dev',
    siteHost: 'https://www.kenchi.dev',
    apiHost: 'https://api.kenchi.dev',
  },
};

export default function getConfig() {
  const appEnv = process.env.APP_ENV;
  if (!isAppEnv(appEnv)) {
    throw new Error('Invalid APP_ENV env var');
  }
  return CONFIG[appEnv];
}
