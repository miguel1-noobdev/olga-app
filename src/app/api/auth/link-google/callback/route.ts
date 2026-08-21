import { getServerSession } from 'next-auth';
import { getCurrentUser } from '@/lib/auth/current-user';
import {
  decryptGoogleLinkCodeVerifier,
  findActiveGoogleLinkIntent,
} from '@/lib/auth/google-link-intent';
import { completeVerifiedGoogleLink } from '@/lib/auth/google-linking';
import { exchangeAndVerifyGoogleIdToken } from '@/lib/auth/google-oidc';
import { getGoogleOAuthConfig } from '@/lib/auth/google';
import { authOptions } from '@/lib/auth/options';
import { ROLES } from '@/lib/auth/roles';
import { connectToDatabase } from '@/lib/db/connect';

function callbackRedirect(request: Request, verified: boolean): Response {
  const redirect = new URL('/login', request.url);
  redirect.searchParams.set(verified ? 'googleLink' : 'error', verified ? 'verified' : 'GOOGLE_LINK_DENIED');
  return Response.redirect(redirect, 303);
}

export async function GET(request: Request): Promise<Response> {
  const googleConfig = getGoogleOAuthConfig();
  const callbackUrl = new URL(request.url);
  const code = callbackUrl.searchParams.get('code');
  const state = callbackUrl.searchParams.get('state');
  if (!googleConfig || !code || !state) {
    return callbackRedirect(request, false);
  }

  await connectToDatabase();
  const intent = await findActiveGoogleLinkIntent(state);
  if (!intent) {
    return callbackRedirect(request, false);
  }

  const session = await getServerSession(authOptions);
  const account = await getCurrentUser();
  if (
    !session?.user?.id ||
    session.user.id !== intent.accountId ||
    session.user.securityVersion !== intent.securityVersion ||
    !account ||
    account.id !== intent.accountId ||
    account.role !== ROLES.SUSCRIPTORA ||
    account.securityVersion !== intent.securityVersion
  ) {
    return callbackRedirect(request, false);
  }

  try {
    const claims = await exchangeAndVerifyGoogleIdToken({
      code,
      codeVerifier: decryptGoogleLinkCodeVerifier(intent.encryptedCodeVerifier),
      redirectUri: callbackUrl.origin + callbackUrl.pathname,
      nonce: intent.nonce,
      clientId: googleConfig.clientId,
      clientSecret: googleConfig.clientSecret,
    });
    const completed = await completeVerifiedGoogleLink({
      intentId: intent.id,
      accountId: account.id,
      securityVersion: session.user.securityVersion,
      state,
      providerAccountId: claims.providerAccountId,
      email: claims.email,
    });

    return callbackRedirect(request, completed);
  } catch {
    return callbackRedirect(request, false);
  }
}
