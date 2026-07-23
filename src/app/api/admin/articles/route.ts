import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createArticleRepository } from '@/lib/db/repository/article';
import { connectToDatabase } from '@/lib/db/connect';
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';
import {
  assertAllowedKeys,
  boundedString,
  getSafeInputError,
  imageUrl,
  readJsonObject,
} from '@/lib/validation/runtime-input';

export async function POST(request: Request) {
  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await readJsonObject(request);
    assertAllowedKeys(body, ['title', 'category', 'excerpt', 'content', 'image', 'imageAlt']);
    body = {
      title: boundedString(body.title, 'title', { maxLength: 200 }),
      category: boundedString(body.category, 'category', { maxLength: 80 }),
      excerpt: boundedString(body.excerpt, 'excerpt', { maxLength: 500 }),
      content: boundedString(body.content, 'content', { maxLength: 100_000 }),
      image: imageUrl(body.image),
      imageAlt: boundedString(body.imageAlt, 'imageAlt', { maxLength: 200 }),
    };
  } catch (error) {
    const failure = getSafeInputError(error, 'Invalid request');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }

  try {
    await connectToDatabase();
    const repo = createArticleRepository();
    const { title, category, excerpt, content, image, imageAlt } = body as {
      title: string; category: string; excerpt: string; content: string; image: string; imageAlt: string;
    };

    // Calcular tiempo de lectura estimado (aproximadamente 200 palabras por minuto)
    const wordCount = content.split(/\s+/).length;
    const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));
    const readingTime = `${readingTimeMinutes} min de lectura`;

    const article = await repo.create({
      title,
      slug: '', // Se generará automáticamente del título
      category,
      excerpt,
      content,
      image,
      imageAlt,
      readingTime,
    });

    return NextResponse.json({ article }, { status: 201 });
  } catch (error) {
    const failure = getSafeInputError(error, 'Error al crear artículo');
    return NextResponse.json({ error: failure.message }, { status: failure.status });
  }
}
