import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { createArticleRepository } from '@/lib/db/repository/article';
import { connectToDatabase } from '@/lib/db/connect';
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';

export async function POST(request: Request) {
  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  try {
    const user = await getCurrentUser();

    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    await connectToDatabase();
    const repo = createArticleRepository();

    const body = await request.json();
    const { title, category, excerpt, content, image, imageAlt } = body;

    if (!title || !category || !excerpt || !content || !image || !imageAlt) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 });
    }

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
    console.error('Error creating article:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error al crear artículo' },
      { status: 500 }
    );
  }
}
