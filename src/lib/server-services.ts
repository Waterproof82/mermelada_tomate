import "server-only"; // Asegura que esto nunca llegue al cliente
import { supabase } from "./supabaseClient";
import { SupabaseProductRepository } from "@/core/infrastructure/database/SupabaseProductRepository";
import { SupabaseCategoryRepository } from "@/core/infrastructure/database/SupabaseCategoryRepository";
import { GetMenuUseCase } from "@/core/application/use-cases/get-menu.use-case";

// Singleton del Cliente Supabase (Server-Side)
// Nota: En Next.js App Router, idealmente usarías createServerClient de @supabase/ssr para cookies,
// pero para lectura pública (menú) la key anónima y url son suficientes por ahora.
// supabase client is imported from supabaseClient singleton

// Instanciación de Repositorios
const productRepo = new SupabaseProductRepository(supabase);
const categoryRepo = new SupabaseCategoryRepository(supabase);

// Instanciación de Casos de Uso
export const getMenuUseCase = new GetMenuUseCase(productRepo, categoryRepo);
