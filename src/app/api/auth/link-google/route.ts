import { randomBytes } from 'node:crypto';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { getCurrentUser } from '@/lib/auth/current-user';
import { getGoogleOAuthConfig } from '@/lib/auth/google';
import { linkGoogleIdentity } from '@/lib/auth/google-linking';
import { connectToDatabase } from '@/lib/db/connect';
import {
  AuthTokenModel,
  consumeAuthToken,
  hashAuthToken,
} from '@/lib/db/models/auth-token';

const LINK_TOKEN_TTL_MS = 10 * 60 * 1000;

function denied(status: 400 | 409): Response {
  return Response.json({ error: 'google_link_denied' }, { status });
}

export async function POST(request: Request): Promise<Response> {
  if (!getGoogleOAuthConfig()) {
    return Response.json({ error: 'google_unavailable' }, { status: 503 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return denied(400);
  }

  const account = await getCurrentUser();
  if (!account || account.id !== session.user.id) {
    return denied(400);
  }

  let body: {
    action?: string;
    token?: string;
    providerAccountId?: string;
    email?: string;
    emailVerified?: boolean;
  };

  try {
    body = await request.json();
  } catch {
    return denied(400);
  }

  await connectToDatabase();

  if (body.action === 'start') {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + LINK_TOKEN_TTL_MS);

    await AuthTokenModel.deleteMany({ accountId: account.id, purpose: 'google_link' });
    await AuthTokenModel.create({
      accountId: account.id,
      purpose: 'google_link',
      tokenHash: hashAuthToken(token),
      expiresAt,
      securityVersion: account.securityVersion,
    });

    const proofUrl = new URL(request.url);
    proofUrl.searchParams.set('token', token);

    return Response.json(
      { proofUrl: proofUrl.toString(), expiresAt: expiresAt.toISOString() },
      { status: 201 },
    );
  }

  if (
    body.action !== 'complete' ||
    !body.token ||
    !body.providerAccountId ||
    !body.email ||
    body.emailVerified !== true
  ) {
    return denied(400);
  }

  const consumed = await consumeAuthToken({
    accountId: account.id,
    purpose: 'google_link',
    rawToken: body.token,
    securityVersion: account.securityVersion,
  });

  if (!consumed) {
    return denied(400);
  }

  const result = await linkGoogleIdentity({
    accountId: account.id,
    providerAccountId: body.providerAccountId,
    email: body.email,
    emailVerified: body.emailVerified,
  });

  if (result === 'conflict') {
    return denied(409);
  }

  return Response.json({ linked: true });
}
