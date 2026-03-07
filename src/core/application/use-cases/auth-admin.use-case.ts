import { SignJWT, jwtVerify } from "jose";
import { createClient } from "@supabase/supabase-js";
import { adminRepository } from "@/core/infrastructure/database/SupabaseAdminRepository";
import { LoginDTO, loginSchema } from "../dtos/auth.dto";
import { AdminWithEmpresa } from "@/core/domain/repositories/IAdminRepository";

const ADMIN_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET!;
const TOKEN_EXPIRY = "24h";

export class AuthAdminUseCase {
  async login(data: LoginDTO): Promise<{ token: string; admin: AdminWithEmpresa }> {
    loginSchema.parse(data);

    const { email, password } = data;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('[AuthAdminUseCase] Intentando login para:', email);

    // 1. Verificar credenciales con Supabase Auth
    const { error, data: authData } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('[AuthAdminUseCase] Error de auth:', error.message);
      throw new Error("Credenciales inválidas");
    }

    if (!authData?.user) {
      console.error('[AuthAdminUseCase] No se recibió user data');
      throw new Error("Credenciales inválidas");
    }

    const userId = authData.user.id;
    console.log('[AuthAdminUseCase] User ID:', userId);

    // 2. Buscar perfil admin
    const admin = await adminRepository.findById(userId);
    console.log('[AuthAdminUseCase] Admin encontrado:', admin);

    if (!admin) {
      throw new Error("Usuario no autorizado como admin");
    }

    const token = await new SignJWT({
      adminId: admin.id,
      empresaId: admin.empresaId,
      rol: admin.rol,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(TOKEN_EXPIRY)
      .sign(new TextEncoder().encode(ADMIN_TOKEN_SECRET));

    return { token, admin };
  }

  async verifyToken(token: string): Promise<AdminWithEmpresa | null> {
    try {
      const secret = new TextEncoder().encode(ADMIN_TOKEN_SECRET);
      const { payload } = await jwtVerify(token, secret);

      const adminId = payload.adminId as string;
      const admin = await adminRepository.findById(adminId);

      return admin;
    } catch {
      return null;
    }
  }
}

export const authAdminUseCase = new AuthAdminUseCase();
