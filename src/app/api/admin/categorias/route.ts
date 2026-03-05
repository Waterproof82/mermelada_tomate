import { NextRequest, NextResponse } from 'next/server';
import { categoryUseCase } from '@/core/infrastructure/database';
import { createCategorySchema, updateCategorySchema, categoryIdSchema } from '@/core/application/dtos/category.dto';

function getEmpresaId(request: NextRequest): string | null {
  return request.headers.get('x-empresa-id');
}

export async function GET(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const categories = await categoryUseCase.getAll(empresaId);
    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createCategorySchema.safeParse({ ...body, empresaId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const category = await categoryUseCase.create(parsed.data);
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');

  const idParsed = categoryIdSchema.safeParse({ id: idParam });
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await request.json();
  const { id: _bodyId, ...updateData } = body;
  const parsed = updateCategorySchema.safeParse(updateData);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const category = await categoryUseCase.update(idParsed.data.id, empresaId, parsed.data);
    return NextResponse.json(category);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar categoría' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');

  const idParsed = categoryIdSchema.safeParse({ id: idParam });
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await categoryUseCase.delete(idParsed.data.id, empresaId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 });
  }
}
