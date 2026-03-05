-- Add telefono column to pedidos table if not exists
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS telefono TEXT;
