import { describe, it, expect } from "vitest";
import { buildInvoiceLines, invoiceNumberFor } from "@/lib/invoice";

describe("invoice", () => {
  it("adds freight + VAT", () => {
    const r = buildInvoiceLines({ order_number: "X", price: 1000, currency: "EUR", vat_amount: 200 });
    expect(r.total).toBe(1200);
  });
  it("adds demurrage line in same currency", () => {
    const r = buildInvoiceLines({ order_number: "X", price: 1000, currency: "EUR", demurrage_amount: 50, demurrage_hours: 2, demurrage_rate: 25, demurrage_currency: "EUR" });
    expect(r.lines).toHaveLength(2);
    expect(r.total).toBe(1050);
  });
  it("number format", () => expect(invoiceNumberFor("ETL-2026-000001")).toBe("INV-ETL-2026-000001"));
});
