import { supabase } from "@/integrations/supabase/client";
import { buildInvoiceLines, invoiceNumberFor } from "@/lib/invoice";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const esc = (s: unknown) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]!));
const money = (n: number, c: string) => `${n.toLocaleString("uk-UA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${c}`;

async function toDataUrl(url: string) {
  const blob = await (await fetch(url)).blob();
  return new Promise<string>((res) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.readAsDataURL(blob); });
}

export async function generateInvoicePdf(order: Order) {
  const { lines, currency, subtotal, vat, total } = buildInvoiceLines(order);
  const number = invoiceNumberFor(order.order_number);
  const issued = new Date();
  const due = new Date(issued.getTime() + 14 * 864e5);

  // Save / update invoice record
  const { data: existing } = await supabase.from("invoices").select("id").eq("order_id", order.id).maybeSingle();
  const payload = { order_id: order.id, invoice_number: number, amount: total, vat_amount: vat, due_date: due.toISOString().slice(0, 10) };
  if (existing) await supabase.from("invoices").update(payload).eq("id", existing.id);
  else await supabase.from("invoices").insert(payload);

  let cmrImg = "";
  if (order.cmr_document_url) {
    const { data } = await supabase.storage.from("cmr-documents").createSignedUrl(order.cmr_document_url, 600);
    if (data?.signedUrl) { try { cmrImg = await toDataUrl(data.signedUrl); } catch { /* skip */ } }
  }
  const ok = (b: boolean) => (b ? "✔ підтверджено AI" : "✖ не виявлено");

  const el = document.createElement("div");
  el.style.cssText = "width:780px;padding:36px;background:#fff;color:#111;font-family:Arial,sans-serif;font-size:12px";
  el.innerHTML = `
  <div style="display:flex;justify-content:space-between;border-bottom:3px solid #f59e0b;padding-bottom:12px">
    <div><div style="font-size:22px;font-weight:bold">Euro Trans Logistics</div><div style="color:#555">ETL Euro Trans · Україна</div></div>
    <div style="text-align:right"><div style="font-size:20px;font-weight:bold">РАХУНОК-ФАКТУРА</div>
      <div>№ ${esc(number)}</div><div>від ${issued.toLocaleDateString("uk-UA")}</div><div>Сплатити до ${due.toLocaleDateString("uk-UA")}</div></div>
  </div>
  <table style="width:100%;margin:16px 0"><tr>
    <td style="vertical-align:top"><b>Платник:</b><br>${esc(order.client_name)}<br>${esc(order.client_phone)}</td>
    <td style="vertical-align:top;text-align:right"><b>Замовлення:</b> ${esc(order.order_number)}<br><b>Маршрут:</b> ${esc(order.origin)} → ${esc(order.destination)}<br><b>Вантаж:</b> ${esc(order.cargo_type)}${order.cargo_weight ? `, ${order.cargo_weight} т` : ""}<br>${order.unloading_date ? `<b>Розвантаження:</b> ${new Date(order.unloading_date).toLocaleDateString("uk-UA")}` : ""}</td>
  </tr></table>
  <table style="width:100%;border-collapse:collapse">
    <tr style="background:#f3f4f6"><th style="text-align:left;padding:6px;border:1px solid #ddd">Послуга</th><th style="padding:6px;border:1px solid #ddd">К-сть</th><th style="padding:6px;border:1px solid #ddd">Ціна</th><th style="padding:6px;border:1px solid #ddd">Сума</th></tr>
    ${lines.map((l) => `<tr><td style="padding:6px;border:1px solid #ddd">${esc(l.title)}</td><td style="padding:6px;border:1px solid #ddd;text-align:center">${l.qty}</td><td style="padding:6px;border:1px solid #ddd;text-align:right">${money(l.unit, l.currency)}</td><td style="padding:6px;border:1px solid #ddd;text-align:right">${money(l.total, l.currency)}</td></tr>`).join("")}
  </table>
  <div style="text-align:right;margin-top:10px;line-height:1.7">Разом: ${money(subtotal, currency)}<br>ПДВ: ${money(vat, currency)}<br><b style="font-size:15px">До сплати: ${money(total, currency)}</b></div>
  <div style="margin-top:20px;padding:10px;border:1px solid #ddd;border-radius:6px">
    <b>Підтвердження доставки (CMR)</b><br>
    Печатка отримувача (гр. 24): ${ok(!!order.cmr_stamp_verified)} · Підпис: ${ok(!!order.cmr_signature_verified)}
    ${order.cmr_verified_at ? ` · ${new Date(order.cmr_verified_at).toLocaleString("uk-UA")}` : ""}
    ${cmrImg ? `<div style="margin-top:8px;text-align:center"><img src="${cmrImg}" style="max-width:100%;max-height:520px;border:1px solid #ccc"/></div>` : "<div style='color:#999'>Скан CMR відсутній</div>"}
  </div>
  <div style="display:flex;justify-content:space-between;margin-top:30px"><div>Виконавець: ____________ / Euro Trans Logistics</div><div>М.П.</div></div>`;

  document.body.appendChild(el);
  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf().set({
      margin: 8, filename: `${number}.pdf`, image: { type: "jpeg", quality: 0.95 },
      html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: "mm", format: "a4" },
      pagebreak: { mode: ["avoid-all"] },
    }).from(el).save();
  } finally {
    el.remove();
  }
  return number;
}
