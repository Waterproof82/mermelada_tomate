import { Empresa, Cliente, EmpresaColores } from "@/core/domain/entities/types";
import { IClienteRepository } from "@/core/domain/repositories/IClienteRepository";
import { IEmpresaRepository } from "@/core/domain/repositories/IEmpresaRepository";
import { UpdateEmpresaDTO } from "@/core/application/dtos/empresa.dto";
import { SupabaseClient } from "@supabase/supabase-js";

export class SupabaseClienteRepository implements IClienteRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async findAllByTenant(empresaId: string): Promise<Cliente[]> {
    const { data: clientes, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`DB Error: ${error.message}`);

    const { data: pedidos } = await this.supabase
      .from('pedidos')
      .select('cliente_id')
      .eq('empresa_id', empresaId);

    const pedidosCount: Record<string, number> = {};
    pedidos?.forEach(p => {
      if (p.cliente_id) {
        pedidosCount[p.cliente_id] = (pedidosCount[p.cliente_id] || 0) + 1;
      }
    });

    const mapped = clientes?.map(c => ({
      ...c,
      empresaId: c.empresa_id as string,
      numero_pedidos: pedidosCount[c.id] || 0,
    })) ?? [];

    return mapped.sort((a, b) => b.numero_pedidos - a.numero_pedidos);
  }

  async findByEmail(email: string, empresaId: string): Promise<Cliente | null> {
    const normalizedEmail = email.trim().toLowerCase();

    const { data: cliente } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .ilike('email', normalizedEmail)
      .single();

    if (!cliente) return null;
    return { ...cliente, empresaId: cliente.empresa_id };
  }

  async findByTelefono(telefono: string, empresaId: string): Promise<Cliente | null> {
    const { data: cliente, error } = await this.supabase
      .from('clientes')
      .select('*')
      .eq('empresa_id', empresaId)
      .eq('telefono', telefono)
      .single();

    if (error) return null;
    return { ...cliente, empresaId: cliente.empresa_id };
  }

  async create(data: { empresaId: string; nombre?: string | null; email?: string | null; telefono?: string | null; direccion?: string | null }): Promise<Cliente> {
    const { data: cliente, error } = await this.supabase
      .from('clientes')
      .insert({
        empresa_id: data.empresaId,
        nombre: data.nombre || null,
        email: data.email || null,
        telefono: data.telefono || null,
        direccion: data.direccion || null,
        aceptar_promociones: false,
      })
      .select()
      .single();

    if (error) throw new Error(`DB Error: ${error.message}`);
    return { ...cliente, empresaId: cliente.empresa_id };
  }

  async update(id: string, empresaId: string, data: Partial<{ nombre?: string | null; email?: string | null; telefono?: string | null; direccion?: string | null; aceptar_promociones?: boolean | null }>): Promise<void> {
    const updatePayload: Record<string, unknown> = {};
    if (data.nombre !== undefined) updatePayload.nombre = data.nombre;
    if (data.email !== undefined) updatePayload.email = data.email || null;
    if (data.telefono !== undefined) updatePayload.telefono = data.telefono;
    if (data.direccion !== undefined) updatePayload.direccion = data.direccion;
    if (data.aceptar_promociones !== undefined) updatePayload.aceptar_promociones = data.aceptar_promociones;

    const { error } = await this.supabase
      .from('clientes')
      .update(updatePayload)
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`DB Error: ${error.message}`);
  }

  async delete(id: string, empresaId: string): Promise<void> {
    const { error } = await this.supabase
      .from('clientes')
      .delete()
      .eq('id', id)
      .eq('empresa_id', empresaId);

    if (error) throw new Error(`DB Error: ${error.message}`);
  }
}

export class SupabaseEmpresaRepository implements IEmpresaRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async getById(empresaId: string): Promise<Partial<Empresa> | null> {
    const { data: empresa } = await this.supabase
      .from('empresas')
      .select('email_notification, telefono_whatsapp, nombre, logo_url, fb, instagram, url_mapa, direccion, dominio, slug, url_image, descripcion_es, descripcion_en, descripcion_fr, descripcion_it, descripcion_de, mostrar_carrito, moneda, subdomain_pedidos')
      .eq('id', empresaId)
      .single();

    if (!empresa) return null;

    return {
      id: empresaId,
      nombre: empresa.nombre,
      dominio: empresa.dominio || '',
      slug: (empresa.slug as string | null) ?? null,
      logoUrl: empresa.logo_url,
      mostrarCarrito: empresa.mostrar_carrito ?? false,
      moneda: empresa.moneda ?? 'EUR',
      emailNotification: empresa.email_notification,
      colores: null,
      fb: empresa.fb ?? null,
      instagram: empresa.instagram ?? null,
      urlMapa: empresa.url_mapa ?? null,
      direccion: empresa.direccion ?? null,
      telefonoWhatsapp: empresa.telefono_whatsapp ?? null,
      urlImage: empresa.url_image ?? null,
      descripcion: {
        es: empresa.descripcion_es as string | null,
        en: empresa.descripcion_en as string | null,
        fr: empresa.descripcion_fr as string | null,
        it: empresa.descripcion_it as string | null,
        de: empresa.descripcion_de as string | null,
      },
    };
  }

  async update(empresaId: string, data: UpdateEmpresaDTO): Promise<void> {
    const updatePayload: Record<string, unknown> = {};
    if (data.email_notification !== undefined) updatePayload.email_notification = data.email_notification || null;
    if (data.telefono_whatsapp !== undefined) updatePayload.telefono_whatsapp = data.telefono_whatsapp || null;
    if (data.fb !== undefined) updatePayload.fb = data.fb || null;
    if (data.instagram !== undefined) updatePayload.instagram = data.instagram || null;
    if (data.url_mapa !== undefined) updatePayload.url_mapa = data.url_mapa || null;
    if (data.direccion !== undefined) updatePayload.direccion = data.direccion || null;
    if (data.url_image !== undefined) updatePayload.url_image = data.url_image || null;
    if (data.descripcion_es !== undefined) updatePayload.descripcion_es = data.descripcion_es || null;
    if (data.descripcion_en !== undefined) updatePayload.descripcion_en = data.descripcion_en || null;
    if (data.descripcion_fr !== undefined) updatePayload.descripcion_fr = data.descripcion_fr || null;
    if (data.descripcion_it !== undefined) updatePayload.descripcion_it = data.descripcion_it || null;
    if (data.descripcion_de !== undefined) updatePayload.descripcion_de = data.descripcion_de || null;

    const { error } = await this.supabase
      .from('empresas')
      .update(updatePayload)
      .eq('id', empresaId);

    if (error) throw new Error(`DB Error: ${error.message}`);
  }

  async findByDomain(dominio: string): Promise<{ id: string; nombre: string; email_notification: string | null; telefono_whatsapp: string | null } | null> {
    const { data: empresa } = await this.supabase
      .from('empresas')
      .select('id, nombre, email_notification, telefono_whatsapp')
      .eq('dominio', dominio)
      .single();

    if (empresa) return empresa;

    const subdomainPedidos = 'pedidos';
    const isPedidos = dominio.startsWith(`${subdomainPedidos}.`) || dominio.includes('-pedidos');

    if (isPedidos) {
      const mainDomainFromSubdomain = dominio.split('.').slice(1).join('.');
      const { data: empresaSubdomain } = await this.supabase
        .from('empresas')
        .select('id, nombre, email_notification, telefono_whatsapp')
        .eq('dominio', mainDomainFromSubdomain)
        .single();

      return empresaSubdomain || null;
    }

    return null;
  }

  async updateColores(empresaId: string, colores: EmpresaColores): Promise<boolean> {
    const { error } = await this.supabase
      .from('empresas')
      .update({
        color_primary: colores.primary,
        color_primary_foreground: colores.primaryForeground,
        color_secondary: colores.secondary,
        color_secondary_foreground: colores.secondaryForeground,
        color_accent: colores.accent,
        color_accent_foreground: colores.accentForeground,
        color_background: colores.background,
        color_foreground: colores.foreground,
      })
      .eq('id', empresaId);

    if (error) {
      console.error('[Repo] Error updating colores:', error.message);
      return false;
    }

    return true;
  }
}
