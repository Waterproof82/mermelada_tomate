"use client";

import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSelector } from "@/components/language-selector";
import { t } from "@/lib/translations";

import { useCart } from "@/lib/cart-context";

interface SiteHeaderClientProps {
  readonly showCart: boolean;
}

export function SiteHeaderClient({ showCart }: SiteHeaderClientProps) {
  const { openCart } = useCart();
  // Si tienes lógica para el logo, puedes migrarla a un server action o usar un valor estático
  const logoUrl = "/logo.png";

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 md:h-20 md:px-6">
        <a href="/" className="flex items-center gap-2">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Mermelada de Tomate"
              className="h-12 w-auto md:h-16"
            />
          )}
        </a>
        <div className="flex items-center gap-1">
          <LanguageSelector />
          {showCart ? (
            <Button
              variant="ghost"
              size="icon"
              className="relative"
              onClick={openCart}
              aria-label={t("openCart", "es")}
            >
              <ShoppingCart className="size-5" />
            </Button>
          ) : (
            <div className="text-gray-400 text-sm"></div>
          )}
        </div>
      </div>
    </header>
  );
}
