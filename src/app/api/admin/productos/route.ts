import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const queryIdSchema = z.object({
  id: z.string().uuid(),
});

const createProductBodySchema = z.object({
  titulo_es: z.string().min(1, "El título es requerido"),
  titulo_en: z.string().optional(),
  titulo_fr: z.string().optional(),
  titulo_it: z.string().optional(),
  titulo_de: z.string().optional(),
  descripcion_es: z.string().optional(),
  descripcion_en: z.string().optional(),
  descripcion_fr: z.string().optional(),
  descripcion_it: z.string().optional(),
  descripcion_de: z.string().optional(),
  precio: z.union([z.number(), z.string()]).refine(val => !isNaN(parseFloat(String(val))), {
    message: "El precio debe ser un número válido",
  }).transform(val => parseFloat(String(val))),
  foto_url: z.string().url().optional().nullable(),
  categoria_id: z.string().uuid().nullable().optional(),
  es_especial: z.boolean().default(false),
  activo: z.boolean().default(true),
});

const updateProductBodySchema = createProductBodySchema.partial();

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Configuración de Supabase incompleta");
  }
  
  return createClient(supabaseUrl, supabaseKey);
}

function getEmpresaId(request: NextRequest): string | null {
  return request.headers.get('x-empresa-id');
}

export async function GET(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('empresa_id', empresaId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createProductBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('productos')
    .insert({
      empresa_id: empresaId,
      titulo_es: parsed.data.titulo_es,
      titulo_en: parsed.data.titulo_en || null,
      titulo_fr: parsed.data.titulo_fr || null,
      titulo_it: parsed.data.titulo_it || null,
      titulo_de: parsed.data.titulo_de || null,
      descripcion_es: parsed.data.descripcion_es || null,
      descripcion_en: parsed.data.descripcion_en || null,
      descripcion_fr: parsed.data.descripcion_fr || null,
      descripcion_it: parsed.data.descripcion_it || null,
      descripcion_de: parsed.data.descripcion_de || null,
      precio: parsed.data.precio,
      foto_url: parsed.data.foto_url || null,
      categoria_id: parsed.data.categoria_id || null,
      es_especial: parsed.data.es_especial,
      activo: parsed.data.activo,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');

  const idParsed = queryIdSchema.safeParse({ id: idParam });
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const body = await request.json();
  const parsed = updateProductBodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.errors[0].message },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const updateData: Record<string, unknown> = {};
  if (parsed.data.titulo_es !== undefined) updateData.titulo_es = parsed.data.titulo_es;
  if (parsed.data.titulo_en !== undefined) updateData.titulo_en = parsed.data.titulo_en;
  if (parsed.data.titulo_fr !== undefined) updateData.titulo_fr = parsed.data.titulo_fr;
  if (parsed.data.titulo_it !== undefined) updateData.titulo_it = parsed.data.titulo_it;
  if (parsed.data.titulo_de !== undefined) updateData.titulo_de = parsed.data.titulo_de;
  if (parsed.data.descripcion_es !== undefined) updateData.descripcion_es = parsed.data.descripcion_es;
  if (parsed.data.descripcion_en !== undefined) updateData.descripcion_en = parsed.data.descripcion_en;
  if (parsed.data.descripcion_fr !== undefined) updateData.descripcion_fr = parsed.data.descripcion_fr;
  if (parsed.data.descripcion_it !== undefined) updateData.descripcion_it = parsed.data.descripcion_it;
  if (parsed.data.descripcion_de !== undefined) updateData.descripcion_de = parsed.data.descripcion_de;
  if (parsed.data.precio !== undefined) updateData.precio = parsed.data.precio;
  if (parsed.data.foto_url !== undefined) {
    updateData.foto_url = parsed.data.foto_url;
  }
  if (parsed.data.categoria_id !== undefined) updateData.categoria_id = parsed.data.categoria_id;
  if (parsed.data.es_especial !== undefined) updateData.es_especial = parsed.data.es_especial;
  if (parsed.data.activo !== undefined) updateData.activo = parsed.data.activo;

  const { data, error } = await supabase
    .from('productos')
    .update(updateData)
    .eq('id', idParsed.data.id)
    .eq('empresa_id', empresaId)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const idParam = searchParams.get('id');

  const idParsed = queryIdSchema.safeParse({ id: idParam });
  if (!idParsed.success) {
    return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', idParsed.data.id)
    .eq('empresa_id', empresaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
