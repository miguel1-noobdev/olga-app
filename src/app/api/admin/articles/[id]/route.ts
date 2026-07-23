import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { connectToDatabase } from '@/lib/db/connect';
import { createArticleRepository } from '@/lib/db/repository/article';
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';
import {
  assertAllowedKeys,
  enumValue,
  getSafeInputError,
  objectId,
  readJsonObject,
} from '@/lib/validation/runtime-input';

const actions = ['review', 'publish', 'unpublish'] as const;
type ContentAction = (typeof actions)[number];

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

  try {
    objectId(params.id, 'article id');
    const body = await readJsonObject(request);
    assertAllowedKeys(body, ['action']);
    enumValue(body.action, 'content action', actions);

    await connectToDatabase();
    const repository = createArticleRepository();
    await repository[body.action as ContentAction](params.id);
    return NextResponse.json({ status: body.action });
  } catch (error) {
    const failure = getSafeInputError(error, 'Content action failed');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
