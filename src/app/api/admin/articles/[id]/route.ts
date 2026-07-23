import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';

const actions = ['review', 'publish', 'unpublish'] as const;
type ContentAction = (typeof actions)[number];

function isContentAction(value: unknown): value is ContentAction {
  return typeof value === 'string' && actions.includes(value as ContentAction);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { action } = await request.json();

  if (!isContentAction(action)) {
    return NextResponse.json({ error: 'Invalid content action' }, { status: 400 });
  }

  try {
    await connectToDatabase();
    const repository = createArticleRepository();
    await repository[action](params.id);
    return NextResponse.json({ status: action });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Content action failed' },
      { status: 400 }
    );
  }
}
