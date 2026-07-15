import { runBoundedHealthCheck, type HealthCheck } from '../types';

const unavailableDetails = {
  credentialsProviderConfigured: false,
  googleProviderConfigured: false,
  jwtSessionStrategy: false,
};

export async function checkAuthHealth(): Promise<HealthCheck<typeof unavailableDetails>> {
  return runBoundedHealthCheck(
    'auth',
    async () => ({
      state: 'ready',
      details: {
        credentialsProviderConfigured: true,
        googleProviderConfigured: Boolean(
          process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
        ),
        jwtSessionStrategy: true,
      },
    }),
    unavailableDetails
  );
}
