import { checkApplicationHealth } from './probes/application';
import { checkAuthHealth } from './probes/auth';
import { checkMongoHealth } from './probes/mongo';
import { unavailableCheck, type HealthReport } from './types';

const applicationUnavailable = {
  routeImportsResolved: false,
  adminLayoutResolved: false,
};
const mongoUnavailable = { pingReachedServer: false, authenticated: false };
const authUnavailable = {
  credentialsProviderConfigured: false,
  googleProviderConfigured: false,
  jwtSessionStrategy: false,
};

async function withUnavailableFallback<Details extends Record<string, boolean>>(
  check: () => Promise<{ state: 'ready' | 'degraded' | 'unavailable'; details: Details }>,
  unavailableDetails: Details
) {
  try {
    return await check();
  } catch {
    return unavailableCheck(unavailableDetails);
  }
}

export async function getHealthReport(): Promise<HealthReport> {
  const [application, mongo, auth] = await Promise.all([
    withUnavailableFallback(checkApplicationHealth, applicationUnavailable),
    withUnavailableFallback(checkMongoHealth, mongoUnavailable),
    withUnavailableFallback(checkAuthHealth, authUnavailable),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    application,
    mongo,
    auth,
  };
}
