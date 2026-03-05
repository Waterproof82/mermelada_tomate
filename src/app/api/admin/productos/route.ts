import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { productUseCase } from '@/core/infrastructure/database';
import { createProductSchema, updateProductSchema, productIdSchema } from '@/core/application/dtos/product.dto';

function getEmpresaId(request: NextRequest): string | null {
  return request.headers.get('x-empresa-id');
}

export async function GET(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const products = await productUseCase.getAll(empresaId);
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProductSchema.safeParse({ ...body, empresaId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const product = await productUseCase.create(parsed.data);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');

  const idParsed = productIdSchema.safeParse({ id: idParam });
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await request.json();
  // Remove id from body if present (it's in the query string)
  const { id: _bodyId, ...updateData } = body;
  const parsed = updateProductSchema.safeParse(updateData);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const product = await productUseCase.update(idParsed.data.id, empresaId, parsed.data);
    return NextResponse.json(product);
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar producto' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');

  const idParsed = productIdSchema.safeParse({ id: idParam });
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await productUseCase.delete(idParsed.data.id, empresaId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 });
  }
}
