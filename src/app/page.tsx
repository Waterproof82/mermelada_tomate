import { getMenuUseCase } from "@/lib/server-services"
import { MenuPage } from "@/components/client-menu-page"
import SiteHeaderWrapper from "@/components/site-header-wrapper";
import type { MenuCategoryVM } from "@/core/application/dtos/menu-view-model"

export const revalidate = 3600;

import { cookies } from 'next/headers';

export default async function Home() {
  const empresaId = process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID || "demo-empresa-id";
  let menuData: MenuCategoryVM[] = [];
  const cookieStore = await cookies();
  const cartAuthorizedCookie = cookieStore.get('cart_authorized');
  const showCart = cartAuthorizedCookie?.value === 'true';
  console.log('Page: cart_authorized cookie:', cartAuthorizedCookie);
  console.log('Page: showCart:', showCart);

  try {
    menuData = await getMenuUseCase.execute(empresaId);
    console.log("Menu data loaded successfully:", menuData.length);
  } catch (error) {
    console.error("Error fetching menu from Supabase:", error);
  }

  const header = await SiteHeaderWrapper();
  return <MenuPage menuData={menuData} header={header} showCart={showCart} />;
}
