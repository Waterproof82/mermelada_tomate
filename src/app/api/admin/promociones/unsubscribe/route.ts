import { NextResponse } from 'next/server';
import { clienteUseCase } from '@/core/infrastructure/database';

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

    const nuevoValor = await clienteUseCase.togglePromoSubscription(email, empresaId);

    console.log('[Unsubscribe] Toggling aceptar_promociones:', { new: nuevoValor });

    if (nuevoValor === null) {
      return NextResponse.redirect(`${getBaseUrl()}/?error=notfound`);
    }

    const mensaje = nuevoValor ? 'promo=on' : 'promo=off';
    console.log('[Unsubscribe] Redirecting to:', `${getBaseUrl()}/?${mensaje}`);
    return NextResponse.redirect(`${getBaseUrl()}/?${mensaje}`);
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.redirect(`${getBaseUrl()}/?error=internal`);
  }
}
