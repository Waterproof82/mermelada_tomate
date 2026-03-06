import { NextResponse } from 'next/server';

// Función helper para obtener base URL
function getBaseUrl(): string {
  return process.env.NEXT_PUBLIC_BASE_URL || 
         process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('supabase.co', 'vercel.app') ||
         'https://www.almadearena.es';
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const empresaId = searchParams.get('empresa');

    console.log('[Unsubscribe] Request received:', { email, empresaId, url: request.url });

    if (!email || !empresaId) {
      console.log('[Unsubscribe] Missing params, redirecting to error');
      return NextResponse.redirect(`${getBaseUrl()}/?error=invalid`);
    }

    const { getSupabaseClient } = await import('@/core/infrastructure/database/supabase-client');
    const supabase = getSupabaseClient();

    // Buscar cliente por email y empresa
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('email', email)
      .single();

    console.log('[Unsubscribe] Cliente found:', { cliente, clienteError });

    if (clienteError || !cliente) {
      return NextResponse.redirect(`${getBaseUrl()}/?error=notfound`);
    }

    // Toggle: cambiar valor de aceptar_promociones
    const nuevoValor = !cliente.aceptar_promociones;

    console.log('[Unsubscribe] Toggling aceptar_promociones:', { current: cliente.aceptar_promociones, new: nuevoValor });

    await supabase
      .from('clientes')
      .update({ aceptar_promociones: nuevoValor })
      .eq('id', cliente.id);

    const mensaje = nuevoValor ? 'promo=on' : 'promo=off';
    console.log('[Unsubscribe] Redirecting to:', `${getBaseUrl()}/?${mensaje}`);
    return NextResponse.redirect(`${getBaseUrl()}/?${mensaje}`);
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.redirect(`${getBaseUrl()}/?error=internal`);
  }
}
