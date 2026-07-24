export const HEALTH_STATES = ['ready', 'degraded', 'unavailable'] as const;

export type HealthState = (typeof HEALTH_STATES)[number];

export interface HealthCheck<Details extends Record<string, boolean>> {
  state: HealthState;
  details: Details;
}

export interface HealthReport {
  generatedAt: string;
  application: HealthCheck<{
    routeImportsResolved: boolean;
    adminLayoutResolved: boolean;
  }>;
  mongo: HealthCheck<{
    pingReachedServer: boolean;
    authenticated: boolean;
  }>;
  auth: HealthCheck<{
    credentialsProviderConfigured: boolean;
    googleProviderConfigured: boolean;
    jwtSessionStrategy: boolean;
  }>;
}

export const HEALTH_TIMEOUT_MS = 1000;

export function unavailableCheck<Details extends Record<string, boolean>>(
  details: Details
): HealthCheck<Details> {
  return {
    state: 'unavailable',
    details,
  };
}

export async function runBoundedHealthCheck<Details extends Record<string, boolean>>(
  probe: string,
  check: () => Promise<HealthCheck<Details>>,
  unavailableDetails: Details,
  timeoutMs = HEALTH_TIMEOUT_MS,
  onTimeout?: () => void
): Promise<HealthCheck<Details>> {
  const startedAt = Date.now();
  let timeout: ReturnType<typeof setTimeout> | undefined;

  try {
    const result = await Promise.race([
      check(),
      new Promise<HealthCheck<Details>>((resolve) => {
        timeout = setTimeout(() => {
          onTimeout?.();
          resolve(unavailableCheck(unavailableDetails));
        }, timeoutMs);
      }),
    ]);

    if (result.state === 'unavailable') {
      logUnavailableProbe(probe, startedAt);
    }

    return result;
  } catch {
    logUnavailableProbe(probe, startedAt);
    return unavailableCheck(unavailableDetails);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function logUnavailableProbe(probe: string, startedAt: number) {
  console.warn('Admin health probe unavailable', {
    probe,
    state: 'unavailable',
    elapsedMs: Date.now() - startedAt,
  });
}
