import { NextRequest, NextResponse } from 'next/server';
import { adminRepository } from '@/core/infrastructure/database/SupabaseAdminRepository';
import { z } from 'zod';

function getEmpresaId(request: NextRequest): string | null {
  return request.headers.get('x-empresa-id');
}

const coloresSchema = z.object({
  primary: z.string(),
  primaryForeground: z.string(),
  secondary: z.string(),
  secondaryForeground: z.string(),
  accent: z.string(),
  accentForeground: z.string(),
  background: z.string(),
  foreground: z.string(),
});

const updateColoresSchema = z.object({
  colores: coloresSchema,
});

export async function POST(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateColoresSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const success = await adminRepository.updateColores(empresaId, parsed.data.colores);

    if (!success) {
      return NextResponse.json({ error: 'Error al guardar' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error en update-colores:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
