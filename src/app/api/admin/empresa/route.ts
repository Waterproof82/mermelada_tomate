import { NextRequest, NextResponse } from 'next/server';
import { empresaRepository } from '@/core/infrastructure/database';
import { updateEmpresaSchema } from '@/core/application/dtos/empresa.dto';

function getEmpresaId(request: NextRequest): string | null {
  return request.headers.get('x-empresa-id');
}

export async function GET(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const empresa = await empresaRepository.getById(empresaId);
    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 });
    }
    
    return NextResponse.json({
      email_notification: empresa.emailNotification || '',
      telefono_whatsapp: '',
      nombre: empresa.nombre || '',
      logo_url: empresa.logoUrl || null,
      fb: '',
      instagram: '',
      url_mapa: '',
      direccion: '',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener empresa' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = updateEmpresaSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  try {
    await empresaRepository.update(empresaId, parsed.data);
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar empresa' }, { status: 500 });
  }
}
