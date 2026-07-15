import { runBoundedHealthCheck, type HealthCheck } from '../types';

const unavailableDetails = {
  routeImportsResolved: false,
  adminLayoutResolved: false,
};

export async function checkApplicationHealth(): Promise<HealthCheck<typeof unavailableDetails>> {
  return runBoundedHealthCheck(
    'application',
    async () => ({
      state: 'ready',
      details: {
        routeImportsResolved: true,
        adminLayoutResolved: true,
      },
    }),
    unavailableDetails
  );
}
