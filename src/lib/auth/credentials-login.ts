type SignInFn = (
  provider: string,
  options: { email: string; password: string; callbackUrl: string; redirect: boolean },
) => Promise<{ ok: boolean; error?: string | null } | null | undefined>;

export type CredentialsLoginResult =
  | { ok: true; navigateTo: string }
  | { ok: false; error: string };

/**
 * Calls signIn with credentials and returns a result indicating whether
 * the caller should hard-navigate to the callbackUrl.
 *
 * Extracted from the login page for testability without a DOM.
 */
export async function performCredentialsLogin(
  signInFn: SignInFn,
  email: string,
  password: string,
  callbackUrl: string,
): Promise<CredentialsLoginResult> {
  const result = await signInFn('credentials', {
    email,
    password,
    callbackUrl,
    redirect: false,
  });

  if (result?.error) {
    return { ok: false, error: result.error };
  }

  if (result?.ok) {
    return { ok: true, navigateTo: callbackUrl };
  }

  return { ok: false, error: 'unknown' };
}
