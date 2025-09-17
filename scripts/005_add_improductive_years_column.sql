-- Add improductive years column to blocks table
ALTER TABLE public.blocks
  ADD COLUMN IF NOT EXISTS improductive_years INTEGER;
