import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getGoogleOAuthConfig } from '@/lib/auth/google';
import { issueGoogleLinkIntent } from '@/lib/auth/google-link-intent';
import { ROLES } from '@/lib/auth/roles';
import { connectToDatabase } from '@/lib/db/connect';

function denied(status: 400 | 409): Response {
  return Response.json({ error: 'google_link_denied' }, { status });
}

export async function POST(request: Request): Promise<Response> {
  const googleConfig = getGoogleOAuthConfig();
  if (!googleConfig) {
    return Response.json({ error: 'google_unavailable' }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return denied(400);
  }

  if (typeof session.user.securityVersion !== 'number') {
    return denied(400);
  }

  const account = await getCurrentUser();
  if (!account || account.id !== session.user.id || account.role !== ROLES.SUSCRIPTORA) {
    return denied(400);
  }

  let body: { action?: unknown };

  try {
    body = await request.json();
  } catch {
    return denied(400);
  }

  await connectToDatabase();

  if (body.action !== 'start') {
    return denied(400);
  }

  try {
    const callbackUrl = new URL('/api/auth/link-google/callback', request.url).toString();
    const intent = await issueGoogleLinkIntent({
      accountId: account.id,
      securityVersion: account.securityVersion,
      clientId: googleConfig.clientId,
      callbackUrl,
    });

    return Response.json(
      { authorizationUrl: intent.authorizationUrl, expiresAt: intent.expiresAt.toISOString() },
      { status: 201 },
    );
  } catch {
    return Response.json({ error: 'google_unavailable' }, { status: 503 });
  }
}
