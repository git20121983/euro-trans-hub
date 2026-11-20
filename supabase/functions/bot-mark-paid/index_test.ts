import assert from 'node:assert/strict';
import { getPaymentAmount, markOrderPaid, PaymentBody, type OrderRecord, type OrderStore } from './logic.ts';

const order: OrderRecord = {
  id: 'order-1',
  order_number: 'ETL-2026-000001',
  client_name: 'Тестовий клієнт',
  route: 'Одеса - Київ',
  payment_status: 'unpaid',
  paid_amount: 0,
  payment_date: null,
  total_amount: 45000,
  freight_price_original: 44000,
  freight: 43000,
  currency: 'UAH',
};

class MemoryStore implements OrderStore {
  updates = 0;
  events = 0;
  constructor(public record: OrderRecord | null) {}

  async findOrder() {
    return this.record;
  }

  async setPaid(original: OrderRecord, amount: number, paymentDate: string) {
    this.updates += 1;
    this.record = {
      ...original,
      total_amount: original.total_amount ?? amount,
      paid_amount: amount,
      payment_date: paymentDate,
      payment_status: 'paid',
    };
    return this.record;
  }

  async addPaymentEvent() {
    this.events += 1;
  }
}

Deno.test('validates order number and real calendar dates', () => {
  assert.equal(PaymentBody.safeParse({}).success, false);
  assert.equal(PaymentBody.safeParse({ order_number: 'ETL-1', payment_date: '2026-02-31' }).success, false);
  assert.equal(PaymentBody.safeParse({ order_number: 'ETL-1', payment_date: '2026-02-28' }).success, true);
});

Deno.test('uses total amount, then original freight, then freight', () => {
  assert.equal(getPaymentAmount(order), 45000);
  assert.equal(getPaymentAmount({ ...order, total_amount: null }), 44000);
  assert.equal(getPaymentAmount({ ...order, total_amount: null, freight_price_original: null }), 43000);
});

Deno.test('does not change an already paid order', async () => {
  const store = new MemoryStore({ ...order, payment_status: 'paid', paid_amount: 45000 });
  const result = await markOrderPaid(store, { order_number: order.order_number });
  assert.equal(result.status, 200);
  assert.equal(result.body.already_paid, true);
  assert.equal(store.updates, 0);
  assert.equal(store.events, 0);
});

Deno.test('marks an unpaid order paid and records one history event', async () => {
  const store = new MemoryStore({ ...order });
  const result = await markOrderPaid(store, { order_number: order.order_number, payment_date: '2026-11-20' });
  assert.equal(result.status, 200);
  assert.equal(result.body.already_paid, false);
  assert.equal(result.body.payment_status, 'paid');
  assert.equal(result.body.paid_amount, 45000);
  assert.equal(result.body.payment_date, '2026-11-20');
  assert.equal(store.updates, 1);
  assert.equal(store.events, 1);
});

Deno.test('returns 404 when the order does not exist', async () => {
  const store = new MemoryStore(null);
  const result = await markOrderPaid(store, { order_number: 'ETL-404' });
  assert.equal(result.status, 404);
  assert.equal(store.updates, 0);
});
