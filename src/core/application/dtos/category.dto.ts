import { z } from "zod";

export const createCategorySchema = z.object({
  nombreEs: z.string().min(1, "El nombre en español es requerido"),
  nombreEn: z.string().optional(),
  nombreFr: z.string().optional(),
  nombreIt: z.string().optional(),
  nombreDe: z.string().optional(),
  descripcionEs: z.string().optional(),
  descripcionEn: z.string().optional(),
  descripcionFr: z.string().optional(),
  descripcionIt: z.string().optional(),
  descripcionDe: z.string().optional(),
  orden: z.number().int().default(0),
  categoriaComplementoDe: z.string().uuid().nullable().optional(),
  complementoObligatorio: z.boolean().default(false),
  categoriaPadreId: z.string().uuid().nullable().optional(),
});

export const updateCategorySchema = createCategorySchema.partial().extend({
  id: z.string().uuid(),
});

export const categoryIdSchema = z.object({
  id: z.string().uuid(),
});

export type CreateCategoryDTO = z.infer<typeof createCategorySchema>;
export type UpdateCategoryDTO = z.infer<typeof updateCategorySchema>;
