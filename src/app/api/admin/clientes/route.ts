import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

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

const clienteIdSchema = z.object({
  id: z.string().uuid(),
});

const createClienteSchema = z.object({
  nombre: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
});

const updateClienteSchema = createClienteSchema.extend({
  id: z.string().uuid(),
  nombre: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  telefono: z.string().optional(),
  direccion: z.string().optional(),
  aceptar_promociones: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const supabase = getSupabaseClient();

    const { data: clientes, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: pedidos } = await supabase
      .from('pedidos')
      .select('cliente_id')
      .eq('empresa_id', empresaId);

    const pedidosCount: Record<string, number> = {};
    pedidos?.forEach(p => {
      if (p.cliente_id) {
        pedidosCount[p.cliente_id] = (pedidosCount[p.cliente_id] || 0) + 1;
      }
    });

    const clientesConPedidos = clientes?.map(c => ({
      ...c,
      numero_pedidos: pedidosCount[c.id] || 0
    })).sort((a, b) => b.numero_pedidos - a.numero_pedidos);

    return NextResponse.json({ clientes: clientesConPedidos });
  } catch (error) {
    console.error('Error fetching clientes:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = updateClienteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    const supabase = getSupabaseClient();

    const updateData: Record<string, unknown> = {};
    if (parsed.data.nombre !== undefined) updateData.nombre = parsed.data.nombre;
    if (parsed.data.email !== undefined) updateData.email = parsed.data.email || null;
    if (parsed.data.telefono !== undefined) updateData.telefono = parsed.data.telefono;
    if (parsed.data.direccion !== undefined) updateData.direccion = parsed.data.direccion;
    if (parsed.data.aceptar_promociones !== undefined) updateData.aceptar_promociones = parsed.data.aceptar_promociones;

    const { error } = await supabase
      .from('clientes')
      .update(updateData)
      .eq('id', parsed.data.id)
      .eq('empresa_id', empresaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating cliente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createClienteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0].message },
        { status: 400 }
      );
    }

    if (!parsed.data.nombre && !parsed.data.email && !parsed.data.telefono) {
      return NextResponse.json({ error: 'Al menos un campo es requerido' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { data: cliente, error } = await supabase
      .from('clientes')
      .insert({
        empresa_id: empresaId,
        nombre: parsed.data.nombre || null,
        email: parsed.data.email || null,
        telefono: parsed.data.telefono || null,
        direccion: parsed.data.direccion || null,
        aceptar_promociones: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cliente });
  } catch (error) {
    console.error('Error creating cliente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const empresaId = getEmpresaId(request);
  if (!empresaId) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = clienteIdSchema.safeParse({ id: body.id });

    if (!parsed.success) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', parsed.data.id)
      .eq('empresa_id', empresaId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting cliente:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
