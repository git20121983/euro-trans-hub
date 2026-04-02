
-- Remove duplicate drivers, keep the oldest record per user_id
DELETE FROM public.drivers
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.drivers
  WHERE user_id IS NOT NULL
  ORDER BY user_id, created_at ASC
)
AND user_id IS NOT NULL;

-- Add unique constraint on user_id (only for non-null values)
ALTER TABLE public.drivers
ADD CONSTRAINT drivers_user_id_unique UNIQUE (user_id);

-- Add toll_cost and actual_fuel_cost columns to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS toll_cost numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS actual_fuel_cost numeric DEFAULT NULL;

-- Add last_service_mileage to trucks for fleet health tracking
ALTER TABLE public.trucks
ADD COLUMN IF NOT EXISTS last_service_mileage integer DEFAULT 0;
