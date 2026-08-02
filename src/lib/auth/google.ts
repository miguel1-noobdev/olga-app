export const GOOGLE_RELEASE_FLAG = 'GOOGLE_OAUTH_ENABLED';

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
}

export interface GoogleProfile {
  email?: string | null;
  email_verified?: boolean;
}

function nonBlank(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function getGoogleOAuthConfig(
  env: Record<string, string | undefined> = process.env,
): GoogleOAuthConfig | null {
  if (env[GOOGLE_RELEASE_FLAG] !== 'true') {
    return null;
  }

  const clientId = nonBlank(env.GOOGLE_CLIENT_ID);
  const clientSecret = nonBlank(env.GOOGLE_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return null;
  }

  return { clientId, clientSecret };
}

export function isVerifiedGoogleProfile(
  profile: GoogleProfile | undefined,
): profile is GoogleProfile & { email: string; email_verified: true } {
  return profile?.email_verified === true && Boolean(nonBlank(profile.email ?? undefined));
}

export function normalizeGoogleEmail(email: string): string {
  return email.trim().toLowerCase();
}
