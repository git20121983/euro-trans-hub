import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Loader2, Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

/**
 * CSV columns expected (in this order, matching the Google Sheet):
 * trip_date, route, client, cargo_type, tonnage, currency,
 * freight_price_original, freight_price_uah, payment_date, payment_status, notes
 *
 * Separator: comma or tab. First line may be a header — it will be skipped
 * if it contains "Дата" or "trip_date".
 */
const TEMPLATE = `trip_date,route,client,cargo_type,tonnage,currency,freight_price_original,freight_price_uah,payment_date,payment_status,notes
2026-01-15,Київ → Варшава,ТОВ "Агро",зерно,22,EUR,2500,105000,2026-01-25,paid,Терміновий рейс`;

type ParsedRow = {
  trip_date: string | null;
  route: string;
  client_name: string;
  cargo_type: string;
  cargo_weight: number | null;
  currency: string;
  freight_price_original: number | null;
  freight_price_uah: number | null;
  payment_date: string | null;
  payment_status: string;
  notes: string | null;
  origin: string;
  destination: string;
};

function parseCsv(text: string): ParsedRow[] {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const sep = lines[0].includes("\t") ? "\t" : ",";
  const first = lines[0].toLowerCase();
  const start = first.includes("дата") || first.includes("trip_date") ? 1 : 0;

  const rows: ParsedRow[] = [];
  for (let i = start; i < lines.length; i++) {
    const cols = lines[i].split(sep).map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length < 3) continue;
    const [
      trip_date, route, client, cargo_type, tonnage, currency,
      freight_orig, freight_uah, payment_date, payment_status, notes,
    ] = cols;

    const [origin = "", destination = ""] = (route || "").split(/→|->|-|,/).map((s) => s.trim());
    const cur = (currency || "UAH").toUpperCase().replace("€", "EUR").replace("$", "USD").replace("ГРН", "UAH");

    rows.push({
      trip_date: trip_date || null,
      route: route || "",
      client_name: client || "",
      cargo_type: cargo_type || "standard",
      cargo_weight: tonnage ? Number(tonnage.replace(",", ".")) : null,
      currency: ["UAH", "EUR", "USD"].includes(cur) ? cur : "UAH",
      freight_price_original: freight_orig ? Number(freight_orig.replace(/\s/g, "").replace(",", ".")) : null,
      freight_price_uah: freight_uah ? Number(freight_uah.replace(/\s/g, "").replace(",", ".")) : null,
      payment_date: payment_date || null,
      payment_status: (payment_status || "unpaid").toLowerCase(),
      notes: notes || null,
      origin,
      destination: destination || origin,
    });
  }
  return rows;
}

export default function AdminImport() {
  const [text, setText] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ ok: number; fail: number } | null>(null);

  const handleFile = async (file: File) => {
    const t = await file.text();
    setText(t);
    setRows(parseCsv(t));
  };

  const handleParse = () => {
    const parsed = parseCsv(text);
    setRows(parsed);
    setResult(null);
    if (!parsed.length) toast.error("Не вдалось розпізнати жодного рядка");
    else toast.success(`Розпізнано ${parsed.length} рядків`);
  };

  const handleImport = async () => {
    if (!rows.length) return;
    setImporting(true);
    let ok = 0, fail = 0;
    for (const r of rows) {
      const { error } = await supabase.from("orders").insert([{
        client_name: r.client_name,
        origin: r.origin,
        destination: r.destination,
        route: r.route,
        cargo_type: r.cargo_type,
        cargo_weight: r.cargo_weight,
        currency: r.currency,
        freight_price_original: r.freight_price_original,
        freight_price_uah: r.freight_price_uah,
        total_price: r.freight_price_uah ?? r.freight_price_original,
        trip_date: r.trip_date,
        payment_date: r.payment_date,
        payment_status: r.payment_status,
        notes: r.notes,
        status: "completed",
      });
      if (error) { console.error(error); fail++; } else ok++;
    }
    setResult({ ok, fail });
    setImporting(false);
    toast[fail === 0 ? "success" : "warning"](`Імпортовано: ${ok} • Помилок: ${fail}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground flex items-center gap-2">
          <FileSpreadsheet className="w-6 h-6 text-secondary" />
          Імпорт з Google Sheets / CSV
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Вставте дані з таблиці або завантажте CSV. Підтримуються колонки: Дата рейса, Напрямок,
          Клієнт, Тип вантажу, Тоннаж, Валюта, Ціна фрахту, Ціна фрахту грн, Дата оплати, Статус оплати, Примітка.
        </p>
      </div>

      <Card className="p-5 space-y-4 bg-card/60 border-border/60">
        <div className="flex items-center gap-3 flex-wrap">
          <Label htmlFor="csv-file" className="cursor-pointer">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-border bg-muted/40 hover:bg-muted/60 text-sm">
              <Upload className="w-4 h-4" /> Завантажити CSV
            </div>
            <Input
              id="csv-file"
              type="file"
              accept=".csv,.tsv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </Label>
          <Button variant="outline" size="sm" onClick={() => setText(TEMPLATE)}>
            Шаблон
          </Button>
        </div>

        <div className="space-y-1.5">
          <Label>CSV / TSV дані</Label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={10}
            placeholder="Вставте сюди дані з Google Sheets..."
            className="font-mono text-xs"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={handleParse} variant="secondary">Розпізнати</Button>
          <Button onClick={handleImport} disabled={!rows.length || importing}>
            {importing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Імпортувати ({rows.length})
          </Button>
        </div>
      </Card>

      {rows.length > 0 && (
        <Card className="p-5 bg-card/60 border-border/60 overflow-x-auto">
          <h3 className="font-semibold mb-3 text-foreground">Попередній перегляд</h3>
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b border-border/60">
              <tr>
                {["Дата", "Напрямок", "Клієнт", "Вантаж", "Т", "Вал.", "Ціна", "Грн", "Оплата", "Статус"].map((h) => (
                  <th key={h} className="text-left py-2 px-2 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 20).map((r, i) => (
                <tr key={i} className="border-b border-border/30">
                  <td className="py-1.5 px-2">{r.trip_date}</td>
                  <td className="py-1.5 px-2">{r.route}</td>
                  <td className="py-1.5 px-2">{r.client_name}</td>
                  <td className="py-1.5 px-2">{r.cargo_type}</td>
                  <td className="py-1.5 px-2">{r.cargo_weight}</td>
                  <td className="py-1.5 px-2">{r.currency}</td>
                  <td className="py-1.5 px-2">{r.freight_price_original}</td>
                  <td className="py-1.5 px-2">{r.freight_price_uah}</td>
                  <td className="py-1.5 px-2">{r.payment_date}</td>
                  <td className="py-1.5 px-2">{r.payment_status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 20 && (
            <p className="text-xs text-muted-foreground mt-2">…та ще {rows.length - 20} рядків</p>
          )}
        </Card>
      )}

      {result && (
        <Card className={`p-4 flex items-center gap-3 ${result.fail === 0 ? "border-green-500/40 bg-green-500/5" : "border-amber-500/40 bg-amber-500/5"}`}>
          {result.fail === 0 ? <CheckCircle2 className="w-5 h-5 text-green-400" /> : <AlertCircle className="w-5 h-5 text-amber-400" />}
          <div className="text-sm">
            <p className="font-semibold text-foreground">Успішно: {result.ok} • Помилок: {result.fail}</p>
            <p className="text-muted-foreground text-xs">Перевірте Замовлення для підтвердження.</p>
          </div>
        </Card>
      )}

      <Card className="p-5 bg-card/40 border-border/40">
        <h3 className="font-semibold mb-2 text-foreground">Real-time синхронізація з Google Sheets</h3>
        <ol className="text-sm text-muted-foreground space-y-2 list-decimal pl-5">
          <li>
            <strong className="text-foreground">Через Zapier / Make:</strong> Створіть Zap з тригером
            "Google Sheets → New Row" та дією "Webhook → POST" на нашу edge-функцію
            (можна додати пізніше).
          </li>
          <li>
            <strong className="text-foreground">Через Google Apps Script:</strong> у вашій таблиці
            відкрийте Extensions → Apps Script і додайте onEdit-тригер, що шле fetch на
            Supabase REST endpoint <code className="bg-muted px-1 rounded">/rest/v1/orders</code>
            з anon-ключем.
          </li>
          <li>
            <strong className="text-foreground">Експорт назад:</strong> можна щодня вивантажувати з
            CRM у Sheet через cron edge-функцію (готовий до підключення).
          </li>
        </ol>
      </Card>
    </div>
  );
}
