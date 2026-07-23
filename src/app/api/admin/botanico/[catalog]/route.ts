import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/current-user';
import { saveOilCatalogEntry, savePlantCatalogEntry } from '@/lib/admin/botanico/catalog';
import { connectToDatabase } from '@/lib/db/connect';
import { createOilRepository } from '@/lib/db/repository/oil';
import { createPlantRepository } from '@/lib/db/repository/plant';
import { isAllowedMutationOriginRequest } from '@/lib/auth/request-security';

interface RouteContext {
  params: { catalog: string };
}

export async function POST(request: Request, { params }: RouteContext) {
  if (!isAllowedMutationOriginRequest(request)) {
    return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });
  }

  const user = await getCurrentUser();

  if (!user || user.role !== 'admin') {
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
