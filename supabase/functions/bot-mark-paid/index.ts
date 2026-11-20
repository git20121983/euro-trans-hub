import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { markOrderPaid, PaymentBody, type OrderRecord, type OrderStore } from './logic.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

const ORDER_FIELDS = 'id, order_number, client_name, route, payment_status, paid_amount, payment_date, total_amount, freight_price_original, freight, currency';

const createOrderStore = (sb: ReturnType<typeof createClient>): OrderStore => ({
  async findOrder(orderNumber) {
    const { data, error } = await sb
      .from('orders')
      .select(ORDER_FIELDS)
      .eq('order_number', orderNumber)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data as OrderRecord | null;
  },

  async setPaid(order, amount, paymentDate) {
    // payment_status is intentionally omitted: orders_recompute_finance() calculates it.
    const update: { paid_amount: number; payment_date: string; total_amount?: number } = {
      paid_amount: amount,
      payment_date: paymentDate,
    };
    if (order.total_amount === null) update.total_amount = amount;

    const { data, error } = await sb
      .from('orders')
      .update(update)
      .eq('id', order.id)
      .select(ORDER_FIELDS)
      .single();

    if (error) throw new Error(error.message);
    return data as OrderRecord;
  },

  async addPaymentEvent(order, amount, paymentDate) {
    const { error } = await sb.from('order_events').insert({
      order_id: order.id,
      event_type: 'payment',
      description: `Оплачено через Telegram-бота. Дата: ${paymentDate}. Сума: ${amount} ${order.currency ?? ''}.`,
      metadata: {
        source: 'telegram-bot',
        order_number: order.order_number,
        payment_date: paymentDate,
        amount,
        currency: order.currency,
      },
    });

    if (error) throw new Error(`Не вдалося записати історію оплати: ${error.message}`);
  },
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const secret = Deno.env.get('BOT_WEBHOOK_SECRET');
  if (!secret || req.headers.get('x-bot-secret') !== secret) {
    return json({ error: 'Unauthorized' }, 401);
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return json({ error: 'Невалідний JSON' }, 400);
  }

  const parsed = PaymentBody.safeParse(raw);
  if (!parsed.success) {
    return json({ error: 'Невалідні поля', fields: parsed.error.flatten().fieldErrors }, 400);
  }

  try {
    const sb = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
    const result = await markOrderPaid(createOrderStore(sb), parsed.data);
    return json(result.body, result.status);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'Внутрішня помилка' }, 500);
  }
});
