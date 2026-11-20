import { z } from 'npm:zod@3';

const isCalendarDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
};

export const PaymentBody = z.object({
  order_number: z.string().trim().min(1).max(100),
  payment_date: z.string().refine(isCalendarDate, 'формат YYYY-MM-DD або некоректна дата').optional(),
});

export interface OrderRecord {
  id: string;
  order_number: string;
  client_name: string;
  route: string | null;
  payment_status: string;
  paid_amount: number | null;
  payment_date: string | null;
  total_amount: number | null;
  freight_price_original: number | null;
  freight: number | null;
  currency: string | null;
}

export interface OrderStore {
  findOrder(orderNumber: string): Promise<OrderRecord | null>;
  setPaid(order: OrderRecord, amount: number, paymentDate: string): Promise<OrderRecord>;
  addPaymentEvent(order: OrderRecord, amount: number, paymentDate: string): Promise<void>;
}

export const getPaymentAmount = (order: OrderRecord) =>
  order.total_amount ?? order.freight_price_original ?? order.freight;

const responseBody = (order: OrderRecord, alreadyPaid: boolean) => ({
  id: order.id,
  order_number: order.order_number,
  client_name: order.client_name,
  route: order.route,
  payment_status: order.payment_status,
  paid_amount: order.paid_amount,
  payment_date: order.payment_date,
  already_paid: alreadyPaid,
});

export async function markOrderPaid(
  store: OrderStore,
  input: z.infer<typeof PaymentBody>,
): Promise<{ status: number; body: Record<string, unknown> }> {
  const order = await store.findOrder(input.order_number);
  if (!order) {
    return { status: 404, body: { error: `Рейс ${input.order_number} не знайдено` } };
  }

  if (order.payment_status === 'paid') {
    return { status: 200, body: responseBody(order, true) };
  }

  const amount = getPaymentAmount(order);
  if (amount === null || !Number.isFinite(amount) || amount <= 0) {
    return {
      status: 422,
      body: { error: 'У рейсі відсутня коректна сума до сплати' },
    };
  }

  const paymentDate = input.payment_date ?? new Date().toISOString().slice(0, 10);
  const updated = await store.setPaid(order.id, amount, paymentDate);

  if (updated.payment_status !== 'paid') {
    return {
      status: 500,
      body: {
        error: 'Суму записано, але база не встановила статус paid',
        payment_status: updated.payment_status,
      },
    };
  }

  await store.addPaymentEvent(updated, amount, paymentDate);
  return { status: 200, body: responseBody(updated, false) };
}
