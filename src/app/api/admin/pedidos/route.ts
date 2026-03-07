import { NextRequest } from 'next/server';
import { z } from 'zod';
import { pedidoRepository, pedidoUseCase } from '@/core/infrastructure/database';
import { requireAuth, successResponse, errorResponse, validationErrorResponse } from '@/core/infrastructure/api/helpers';

const pedidoIdSchema = z.object({
  id: z.string().uuid(),
});

const updatePedidoSchema = z.object({
  id: z.string().uuid(),
  estado: z.enum(['pendiente', 'aceptado', 'preparando', 'enviado', 'entregado', 'cancelado']),
});

export async function GET(request: NextRequest) {
  const { empresaId, error: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const pedidos = await pedidoRepository.findAllByTenant(empresaId!);
    return successResponse({ pedidos });
  } catch {
    return errorResponse('Error al obtener pedidos');
  }
}

export async function PATCH(request: NextRequest) {
  const { empresaId, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const parsed = updatePedidoSchema.safeParse(body);

  if (!parsed.success) {
    return validationErrorResponse(parsed.error.errors[0].message);
  }

  try {
    await pedidoRepository.updateStatus(parsed.data.id, empresaId!, parsed.data.estado);
    return successResponse({ success: true });
  } catch {
    return errorResponse('Error al actualizar pedido');
  }
}

export async function DELETE(request: NextRequest) {
  const { empresaId, error: authError } = await requireAuth(request);
  if (authError) return authError;

  const body = await request.json();
  const parsed = pedidoIdSchema.safeParse({ id: body.id });

  if (!parsed.success) {
    return validationErrorResponse('ID inválido');
  }

  try {
    await pedidoUseCase.delete(parsed.data.id, empresaId!);
    return successResponse({ success: true });
  } catch {
    return errorResponse('Error al eliminar pedido');
  }
}

export async function PUT(request: NextRequest) {
  const { empresaId, error: authError } = await requireAuth(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const mesParam = searchParams.get('mes');
    const añoParam = searchParams.get('año');

    const now = new Date();
    const selectedMonth = mesParam ? Number.parseInt(mesParam) : now.getMonth();
    const selectedYear = añoParam ? Number.parseInt(añoParam) : now.getFullYear();

    const stats = await pedidoUseCase.getStats(empresaId!, selectedMonth, selectedYear);

    return successResponse({
      ...stats,
      mesSeleccionado: `${selectedMonth}-${selectedYear}`,
    });
  } catch {
    return errorResponse('Error al obtener estadísticas');
  }
}
