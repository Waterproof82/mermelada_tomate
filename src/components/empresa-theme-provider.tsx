'use client';

import { useEffect, useState, ReactNode, useMemo } from 'react';
import { EmpresaColores } from '@/core/domain/entities/types';

interface EmpresaThemeProviderProps {
  children: ReactNode;
  colores: EmpresaColores | null;
}

/**
 * Derives a dark palette from the tenant's light colors by swapping
 * background ↔ foreground roles and adjusting secondary/accent brightness.
 */
function deriveDarkColors(light: EmpresaColores): EmpresaColores {
  return {
    primary: light.primaryForeground,
    primaryForeground: light.primary,
    secondary: light.foreground,
    secondaryForeground: light.background,
    accent: light.foreground,
    accentForeground: light.background,
    background: light.foreground,
    foreground: light.background,
  };
}

const HEX_COLOR_RE = /^#[\da-f]{6}$/i;

function isValidHex(value: string): boolean {
  return HEX_COLOR_RE.test(value);
}

/**
 * Applies tenant brand colors to CSS custom properties.
 * In dark mode, automatically derives an inverted palette from the tenant's light colors.
 */
export function EmpresaThemeProvider({ children, colores }: EmpresaThemeProviderProps) {
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDark(e.matches);
    mq.addEventListener('change', handleChange);

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', handleChange);
    };
  }, []);

  const colorsToApply = useMemo(() => {
    if (!colores) return null;
    return isDark ? deriveDarkColors(colores) : colores;
  }, [colores, isDark]);

  useEffect(() => {
    if (!colorsToApply || !mounted) return;

    const root = document.documentElement;

    const tokenMap: Record<string, string> = {
      '--primary': colorsToApply.primary,
      '--primary-foreground': colorsToApply.primaryForeground,
      '--secondary': colorsToApply.secondary,
      '--secondary-foreground': colorsToApply.secondaryForeground,
      '--accent': colorsToApply.accent,
      '--accent-foreground': colorsToApply.accentForeground,
      '--background': colorsToApply.background,
      '--foreground': colorsToApply.foreground,
      '--ring': colorsToApply.primary,
    };

    // Set both raw vars and Tailwind v4 --color-* mappings
    for (const [prop, value] of Object.entries(tokenMap)) {
      if (!isValidHex(value)) continue;
      root.style.setProperty(prop, value);
      root.style.setProperty(`--color-${prop.slice(2)}`, value);
    }

    return () => {
      for (const prop of Object.keys(tokenMap)) {
        root.style.removeProperty(prop);
        root.style.removeProperty(`--color-${prop.slice(2)}`);
      }
    };
  }, [colorsToApply, mounted]);

  return <>{children}</>;
}
