import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/options';
import { NextResponse } from 'next/server';
import { createArticleRepository } from '@/lib/db/repository/article';
import { connectToDatabase } from '@/lib/db/connect';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
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
