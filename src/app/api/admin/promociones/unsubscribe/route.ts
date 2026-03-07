import { NextResponse } from 'next/server';
import { clienteUseCase } from '@/core/infrastructure/database';

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

    if (!email || !empresaId) {
      return NextResponse.redirect(`${getBaseUrl()}/?error=invalid`);
    }

    const nuevoValor = await clienteUseCase.togglePromoSubscription(email, empresaId);

    if (nuevoValor === null) {
      return NextResponse.redirect(`${getBaseUrl()}/?error=notfound`);
    }

    const mensaje = nuevoValor ? 'promo=on' : 'promo=off';
    return NextResponse.redirect(`${getBaseUrl()}/?${mensaje}`);
  } catch (error) {
    console.error('[Unsubscribe] Error:', error);
    return NextResponse.redirect(`${getBaseUrl()}/?error=internal`);
  }
}
