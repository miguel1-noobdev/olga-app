import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';

const actions = ['review', 'publish', 'unpublish'] as const;
type ContentAction = (typeof actions)[number];

function isContentAction(value: unknown): value is ContentAction {
  return typeof value === 'string' && actions.includes(value as ContentAction);
}

export async function PATCH(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let action: unknown;
  try {
    ({ action } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid content action' }, { status: 400 });
  }

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
