import { NextResponse } from 'next/server';
import { clienteUseCase } from '@/core/infrastructure/database';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    let email = searchParams.get('email');
    const empresaId = searchParams.get('empresa');
    const action = searchParams.get('action') as 'alta' | 'baja' | null;

    if (!email || !empresaId) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es'}/?error=invalid`);
    }

    // Decode email if it's URL encoded
    try {
      email = decodeURIComponent(email);
    } catch {
      // Keep original if decode fails
    }
    
    // Normalizar email: trim, lowercase
    const normalizedEmail = email.trim().toLowerCase();

    const nuevoValor = await clienteUseCase.togglePromoSubscription(normalizedEmail, empresaId, action ?? undefined);

    if (nuevoValor === null) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es'}/?error=notfound`);
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es';
    const mensaje = nuevoValor ? 'promo=on' : 'promo=off';
    return NextResponse.redirect(`${baseUrl}/?${mensaje}`);
  } catch (error) {
    console.error('Promo error:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.almadearena.es'}/?error=internal`);
  }
}
