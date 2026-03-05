import { NextRequest, NextResponse } from 'next/server';
import { clienteUseCase } from '@/core/infrastructure/database';
import { createClienteSchema, updateClienteSchema, clienteIdSchema } from '@/core/application/dtos/cliente.dto';

function getEmpresaId(request: NextRequest): string | null {
  return request.headers.get('x-empresa-id');
}

export async function GET(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const clientes = await clienteUseCase.getAll(empresaId);
    return NextResponse.json({ clientes });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createClienteSchema.safeParse({ ...body, empresaId });

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  if (!parsed.data.nombre && !parsed.data.email && !parsed.data.telefono) {
    return NextResponse.json({ error: 'Al menos un campo es requerido' }, { status: 400 });
  }

  try {
    const cliente = await clienteUseCase.create(parsed.data);
    return NextResponse.json({ cliente });
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateClienteSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    const { id, ...updateData } = parsed.data;
    await clienteUseCase.update(id, empresaId, updateData);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = clienteIdSchema.safeParse({ id: body.id });

  if (!parsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  try {
    await clienteUseCase.delete(parsed.data.id, empresaId);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 });
  }
}
