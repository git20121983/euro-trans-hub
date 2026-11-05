import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';

const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

const Body = z.object({
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'формат YYYY-MM-DD')
    .refine((s) => !isNaN(Date.parse(s)), 'некоректна дата'),
  route: z.string().trim().min(1).max(500),
  client_name: z.string().trim().min(1).max(255),
  cargo: z.string().trim().max(500).optional().nullable(),
  cargo_weight: z.coerce.number().nonnegative().optional().nullable(),
  freight: z.coerce.number().nonnegative(),
  currency: z.string().trim().regex(/^[A-Za-z]{3}$/, 'код валюти з 3 літер').transform((s) => s.toUpperCase()),
  notes: z.string().max(2000).optional().nullable(),
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('BOT_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-bot-secret') !== secret) return json({ error: 'Unauthorized' }, 401);

  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: 'Невалідний JSON' }, 400); }
  const parsed = Body.safeParse(raw);
  if (!parsed.success) return json({ error: 'Невалідні поля', fields: parsed.error.flatten().fieldErrors }, 400);
  const d = parsed.data;

  const sb = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data, error } = await sb.from('orders').insert({
    trip_date: d.trip_date,
    route: d.route,
    client_name: d.client_name,
    cargo: d.cargo ?? null,
    cargo_weight: d.cargo_weight ?? null,
    freight: d.freight,
    currency: d.currency,
    notes: d.notes ?? null,
    status: 'new',
    payment_status: 'unpaid',
    freight_price_original: d.freight,
    total_amount: d.freight,
  }).select('id, order_number').single();

  if (error) return json({ error: error.message }, 500);
  return json({ id: data.id, order_number: data.order_number });
});
