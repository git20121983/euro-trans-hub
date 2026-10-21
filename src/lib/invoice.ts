export interface InvoiceOrder {
  order_number: string;
  price?: number | null;
  total_price?: number | null;
  freight?: number | null;
  currency?: string | null;
  demurrage_amount?: number | null;
  demurrage_hours?: number | null;
  demurrage_rate?: number | null;
  demurrage_currency?: string | null;
  vat_amount?: number | null;
}

export interface InvoiceLine { title: string; qty: number; unit: number; total: number; currency: string }

export function buildInvoiceLines(o: InvoiceOrder) {
  const currency = o.currency || "UAH";
  const freight = Number(o.price ?? o.freight ?? o.total_price ?? 0);
  const lines: InvoiceLine[] = [
    { title: "Транспортно-експедиційні послуги", qty: 1, unit: freight, total: freight, currency },
  ];
  const dem = Number(o.demurrage_amount ?? 0);
  if (dem > 0) {
    const hours = Number(o.demurrage_hours ?? 0);
    lines.push({
      title: "Простій транспорту (демередж)",
      qty: hours || 1,
      unit: hours ? Number(o.demurrage_rate ?? dem / hours) : dem,
      total: dem,
      currency: o.demurrage_currency || "EUR",
    });
  }
  const vat = Number(o.vat_amount ?? 0);
  const subtotal = lines.filter((l) => l.currency === currency).reduce((s, l) => s + l.total, 0);
  return { lines, currency, subtotal, vat, total: subtotal + vat };
}

export const invoiceNumberFor = (orderNumber: string) => `INV-${orderNumber}`;
