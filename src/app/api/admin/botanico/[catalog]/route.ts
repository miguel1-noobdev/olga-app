import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth/options';
import { saveOilCatalogEntry, savePlantCatalogEntry } from '@/lib/admin/botanico/catalog';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { createPlantRepository } from '@/lib/db/repository/plant';

interface RouteContext {
  params: { catalog: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (params.catalog !== 'plants' && params.catalog !== 'oils') {
    return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
  }

  await connectToDatabase();
  const body = await request.json();
  const dependencies = {
    plants: createPlantRepository(),
    oils: createOilRepository(),
  };
  const result =
    params.catalog === 'plants'
      ? await savePlantCatalogEntry(dependencies, body)
      : await saveOilCatalogEntry(dependencies, body);

  if (!result.success) {
    return NextResponse.json({ errors: result.errors }, { status: 400 });
  }

  return NextResponse.json({ id: result.id }, { status: body.id ? 200 : 201 });
}
