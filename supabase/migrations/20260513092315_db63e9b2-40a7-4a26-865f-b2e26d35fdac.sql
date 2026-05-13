-- 1. Add 'accountant' role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'accountant';
