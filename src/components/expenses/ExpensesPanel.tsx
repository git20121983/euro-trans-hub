import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Receipt, Camera, ImageIcon, X } from "lucide-react";
import { toast } from "sonner";

export const EXPENSE_CATEGORIES = [
  "Пальне",
  "Толи/Паром",
  "Ремонт",
  "Омивайка",
  "Інше",
];

export const EXPENSE_CURRENCIES = ["UAH", "EUR", "PLN"] as const;
export type ExpenseCurrency = (typeof EXPENSE_CURRENCIES)[number];

/** Approximate conversion rates to UAH used for aggregate totals */
export const CURRENCY_TO_UAH: Record<string, number> = {
  UAH: 1,
  EUR: 48,
  PLN: 11,
};

export const toUah = (amount: number, currency?: string | null) =>
  Number(amount || 0) * (CURRENCY_TO_UAH[currency || "UAH"] ?? 1);

export interface ExpenseRow {
  id: string;
  order_id: string;
  driver_id: string | null;
  amount: number;
  currency: string | null;
  receipt_url: string | null;
  category: string;
  description: string | null;
  created_at: string;
}

interface Props {
  orderId: string;
  driverId: string | null;
  allowance: number;
  canAdd: boolean;
  canDelete?: boolean;
  compact?: boolean;
}

const fmt = (n: number) =>
  n.toLocaleString("uk-UA", { maximumFractionDigits: 0 });

export default function ExpensesPanel({
  orderId, driverId, allowance, canAdd, canDelete = true, compact = false,
}: Props) {
  const [items, setItems] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState<string>("UAH");
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });
    setItems((data as unknown as ExpenseRow[]) ?? []);
    setLoading(false);
  }, [orderId]);

  useEffect(() => {
    fetchExpenses();
    const channel = supabase
      .channel(`expenses-${orderId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `order_id=eq.${orderId}` },
        () => fetchExpenses(),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [orderId, fetchExpenses]);

  // Create signed URLs for receipts (private bucket)
  useEffect(() => {
    const paths = items.map((x) => x.receipt_url).filter(Boolean) as string[];
    if (paths.length === 0) return;
    supabase.storage
      .from("expense-receipts")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        if (!data) return;
        const map: Record<string, string> = {};
        data.forEach((d) => {
          if (d.path && d.signedUrl) map[d.path] = d.signedUrl;
        });
        setSignedUrls(map);
      });
  }, [items]);

  const totalExpenses = items.reduce((s, x) => s + toUah(Number(x.amount || 0), x.currency), 0);
  const remaining = Number(allowance || 0) - totalExpenses;

  const pickReceipt = (file?: File | null) => {
    if (!file) return;
    setReceipt(file);
    setReceiptPreview(URL.createObjectURL(file));
  };

  const resetForm = () => {
    setAmount("");
    setDescription("");
    setCurrency("UAH");
    setCategory(EXPENSE_CATEGORIES[0]);
    setReceipt(null);
    setReceiptPreview(null);
    setShowForm(false);
  };

  const addExpense = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) {
      toast.error("Вкажіть суму більше 0");
      return;
    }
    setAdding(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { data: inserted, error } = await supabase.from("expenses").insert({
      order_id: orderId,
      driver_id: driverId,
      amount: amt,
      currency,
      category,
      description: description || null,
      created_by: user?.id ?? null,
    }).select("id").single();

    if (error || !inserted) {
      toast.error(`Помилка: ${error?.message ?? "не вдалося зберегти"}`);
      setAdding(false);
      return;
    }

    if (receipt) {
      const ext = (receipt.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${orderId}/${inserted.id}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("expense-receipts")
        .upload(path, receipt, { upsert: true, contentType: receipt.type || "image/jpeg" });
      if (upErr) {
        toast.error("Витрату збережено, але чек не завантажився");
      } else {
        await supabase.from("expenses").update({ receipt_url: path }).eq("id", inserted.id);
      }
    }

    toast.success("Витрату додано");
    resetForm();
    fetchExpenses();
    setAdding(false);
  };

  const deleteExpense = async (row: ExpenseRow) => {
    const { error } = await supabase.from("expenses").delete().eq("id", row.id);
    if (error) toast.error("Не вдалося видалити");
    else {
      if (row.receipt_url) {
        await supabase.storage.from("expense-receipts").remove([row.receipt_url]);
      }
      toast.success("Витрату видалено");
    }
  };

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 rounded-lg bg-muted/20 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Аванс</p>
          <p className="text-sm font-semibold text-blue-300">{fmt(Number(allowance || 0))} ₴</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/20 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Витрачено</p>
          <p className="text-sm font-semibold text-amber-300">{fmt(totalExpenses)} ₴</p>
        </div>
        <div className={`p-3 rounded-lg border ${remaining >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
          <p className="text-[10px] text-muted-foreground uppercase">Залишок</p>
          <p className={`text-sm font-semibold ${remaining >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmt(remaining)} ₴
          </p>
        </div>
      </div>

      {/* Add form */}
      {canAdd && (
        <>
          {!showForm ? (
            <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4" /> Додати витрату
            </Button>
          ) : (
            <div className="space-y-3 p-3 rounded-lg border border-border bg-card">
              <div>
                <Label className="text-xs">Категорія</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Сума</Label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="mt-1 h-10"
                  />
                </div>
                <div>
                  <Label className="text-xs">Валюта</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger className="mt-1 h-10"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EXPENSE_CURRENCIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Receipt */}
              <div>
                <Label className="text-xs">Чек / квитанція</Label>
                <input
                  ref={cameraRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(e) => pickReceipt(e.target.files?.[0])}
                />
                <input
                  ref={galleryRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => pickReceipt(e.target.files?.[0])}
                />
                {receiptPreview ? (
                  <div className="mt-1 relative w-full">
                    <img src={receiptPreview} alt="Чек" className="w-full max-h-48 object-contain rounded-lg border border-border bg-muted/20" />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute top-1 right-1 h-7 w-7"
                      onClick={() => { setReceipt(null); setReceiptPreview(null); }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    <Button type="button" size="sm" variant="outline" className="gap-2 h-10" onClick={() => cameraRef.current?.click()}>
                      <Camera className="w-4 h-4" /> Камера
                    </Button>
                    <Button type="button" size="sm" variant="outline" className="gap-2 h-10" onClick={() => galleryRef.current?.click()}>
                      <ImageIcon className="w-4 h-4" /> Галерея
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-xs">Коментар</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Необов'язково"
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={addExpense} disabled={adding} className="flex-1 h-10">
                  {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
                </Button>
                <Button size="sm" variant="ghost" className="h-10" onClick={resetForm}>Скасувати</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* List */}
      <div className="space-y-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Receipt className="w-3 h-3" /> Витрати ({items.length})
        </p>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <p className="text-xs text-center py-4 text-muted-foreground">Витрат немає</p>
        ) : (
          items.map((x) => {
            const url = x.receipt_url ? signedUrls[x.receipt_url] : null;
            const cur = x.currency || "UAH";
            return (
              <div key={x.id} className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card">
                {url && (
                  <a href={url} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={url} alt="Чек" className="w-12 h-12 object-cover rounded-md border border-border" />
                  </a>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                      {x.category}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      {fmt(Number(x.amount))} {cur}
                    </span>
                    {cur !== "UAH" && (
                      <span className="text-[10px] text-muted-foreground">
                        ≈ {fmt(toUah(Number(x.amount), cur))} ₴
                      </span>
                    )}
                  </div>
                  {x.description && (
                    <p className="text-xs text-muted-foreground mt-1 break-words">{x.description}</p>
                  )}
                  {!compact && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {new Date(x.created_at).toLocaleString("uk-UA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  )}
                </div>
                {canDelete && (
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => deleteExpense(x)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
