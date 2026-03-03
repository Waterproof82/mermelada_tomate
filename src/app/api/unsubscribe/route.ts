import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const empresaId = searchParams.get('empresa');
    const action = searchParams.get('action'); // 'baja' or 'alta'

    console.log('Promo request:', { email, empresaId, action });

    if (!email || !empresaId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es'}/?error=invalid`);
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Buscar cliente por email y empresa
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('email', email)
      .single();

    console.log('Cliente found:', cliente, 'Error:', clienteError);

    if (clienteError || !cliente) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es'}/?error=notfound`);
    }

    // Determinar nuevo valor según acción
    let nuevoValor: boolean;
    
    if (action === 'alta') {
      nuevoValor = true; // Darse de alta
    } else if (action === 'baja') {
      nuevoValor = false; // Darse de baja
    } else {
      // Default: toggle
      nuevoValor = !cliente.aceptar_promociones;
    }

    await supabase
      .from('clientes')
      .update({ aceptar_promociones: nuevoValor })
      .eq('id', cliente.id);

    console.log('Updated cliente:', nuevoValor);

    // Redirigir con mensaje
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es';
    const mensaje = nuevoValor ? 'promo=on' : 'promo=off';
    return NextResponse.redirect(`${baseUrl}/?${mensaje}`);
  } catch (error) {
    console.error('Promo error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es'}/?error=internal`);
  }
}
