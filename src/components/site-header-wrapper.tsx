
'use server';
import { SiteHeaderClient } from './site-header-client';
import { cookies } from 'next/headers';

export default async function SiteHeaderWrapper() {
  const cookieStore = await cookies();
  const showCart = cookieStore.get('cart_authorized')?.value === 'true';
  return <SiteHeaderClient key="site-header" showCart={showCart} />;
}
