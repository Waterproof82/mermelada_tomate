"use client"

import { useLanguage } from "@/lib/language-context"
import { t } from "@/lib/translations"
import { useEffect, useState } from "react"
import { createClient } from "@supabase/supabase-js"

export function SiteFooter() {
  const { language } = useLanguage()
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  useEffect(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const supabase = createClient(supabaseUrl, supabaseKey)
    const fetchLogo = async () => {
      const { data, error } = await supabase
        .from("empresas")
        .select("logo_url")
        .limit(1)
        .single()
      if (!error && data && data.logo_url) {
        setLogoUrl(data.logo_url)
      }
    }
    fetchLogo()
  }, [])
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <div className="flex flex-col items-center gap-6 text-center">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Mermelada de Tomate"
              className="h-16 w-auto opacity-80"
            />
          )}
          <p className="max-w-md font-serif text-lg italic text-muted-foreground">
            {"\"...il risultato di farlo con amore\""}
          </p>
          <div className="text-sm text-muted-foreground">
            <p>{t("allergenDisclaimer", language)}</p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span>Crustaceos</span>
            <span>Pescado</span>
            <span>Huevos</span>
            <span>Cacahuetes</span>
            <span>Soja</span>
            <span>Lacteos</span>
            <span>Frutos con cascara</span>
            <span>Apio</span>
            <span>Moluscos</span>
            <span>Altramuces</span>
            <span>Mostaza</span>
            <span>Granos sesamo</span>
            <span>Dioxido azufre y sulfitos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
