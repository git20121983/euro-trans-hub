import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, FileText, Wallet, TrendingDown, Scale } from "lucide-react";
import { EXPENSE_CATEGORIES } from "@/components/expenses/ExpensesPanel";
import { toast } from "sonner";

interface Props {
  driverId: string;
  driverName: string;
}

interface OrderRow {
  id: string;
  order_number: string;
  origin: string;
  destination: string;
  allowance_amount: number;
  created_at: string;
  status: string;
}

interface ExpenseRow {
  id: string;
  order_id: string;
  amount: number;
  category: string;
  description: string | null;
  created_at: string;
}

type RangePreset = "all" | "this_month" | "last_month" | "custom";

const fmt = (n: number) =>
  n.toLocaleString("uk-UA", { maximumFractionDigits: 0 });

const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const endOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);

export default function DriverFinancePanel({ driverId, driverName }: Props) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [preset, setPreset] = useState<RangePreset>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      const [ordersRes, expensesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, order_number, origin, destination, allowance_amount, created_at, status")
          .eq("driver_id", driverId)
          .order("created_at", { ascending: false }),
        supabase
          .from("expenses")
          .select("id, order_id, amount, category, description, created_at")
          .eq("driver_id", driverId)
          .order("created_at", { ascending: false }),
      ]);
      if (cancelled) return;
      setOrders((ordersRes.data as OrderRow[]) ?? []);
      setExpenses((expensesRes.data as ExpenseRow[]) ?? []);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`driver-finance-${driverId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `driver_id=eq.${driverId}` },
        () => load())
      .on("postgres_changes",
        { event: "*", schema: "public", table: "orders", filter: `driver_id=eq.${driverId}` },
        () => load())
      .subscribe();
    return () => { cancelled = true; supabase.removeChannel(ch); };
  }, [driverId]);

  const range = useMemo(() => {
    const now = new Date();
    if (preset === "this_month") return { from: startOfMonth(now), to: endOfMonth(now) };
    if (preset === "last_month") {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return { from: startOfMonth(prev), to: endOfMonth(prev) };
    }
    if (preset === "custom") {
      return {
        from: fromDate ? new Date(fromDate) : null,
        to: toDate ? new Date(toDate + "T23:59:59") : null,
      };
    }
    return { from: null as Date | null, to: null as Date | null };
  }, [preset, fromDate, toDate]);

  const inRange = (iso: string) => {
    const d = new Date(iso);
    if (range.from && d < range.from) return false;
    if (range.to && d > range.to) return false;
    return true;
  };

  const filteredOrders = useMemo(() => orders.filter(o => inRange(o.created_at)), [orders, range]);
  const filteredExpenses = useMemo(() => expenses.filter(e => inRange(e.created_at)), [expenses, range]);

  const ordersById = useMemo(() => {
    const m = new Map<string, OrderRow>();
    orders.forEach(o => m.set(o.id, o));
    return m;
  }, [orders]);

  const totalAllowance = filteredOrders.reduce((s, o) => s + Number(o.allowance_amount || 0), 0);
  const totalExpenses = filteredExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const balance = totalAllowance - totalExpenses;

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    EXPENSE_CATEGORIES.forEach(c => map.set(c, 0));
    filteredExpenses.forEach(e => {
      map.set(e.category, (map.get(e.category) ?? 0) + Number(e.amount || 0));
    });
    return Array.from(map.entries());
  }, [filteredExpenses]);

  const exportCsv = () => {
    const rows = [
      ["Дата", "Рейс", "Маршрут", "Категорія", "Сума, ₴", "Коментар"],
      ...filteredExpenses.map(e => {
        const o = ordersById.get(e.order_id);
        return [
          new Date(e.created_at).toLocaleDateString("uk-UA"),
          o?.order_number ?? "—",
          o ? `${o.origin} → ${o.destination}` : "—",
          e.category,
          String(Number(e.amount || 0)),
          (e.description ?? "").replace(/[\r\n]+/g, " "),
        ];
      }),
      [],
      ["Всього авансів", "", "", "", String(totalAllowance), ""],
      ["Всього витрачено", "", "", "", String(totalExpenses), ""],
      ["Баланс", "", "", "", String(balance), ""],
    ];
    const csv = rows
      .map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${driverName}-витрати.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("CSV завантажено");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <SummaryCard
          icon={<Wallet className="w-4 h-4 text-blue-400" />}
          label="Всього видано авансів"
          value={`${fmt(totalAllowance)} ₴`}
          tone="blue"
        />
        <SummaryCard
          icon={<TrendingDown className="w-4 h-4 text-amber-400" />}
          label="Всього витрачено"
          value={`${fmt(totalExpenses)} ₴`}
          tone="amber"
        />
        <SummaryCard
          icon={<Scale className="w-4 h-4" />}
          label={balance >= 0 ? "Залишок у водія" : "Борг фірми перед водієм"}
          value={`${fmt(Math.abs(balance))} ₴`}
          tone={balance >= 0 ? "green" : "red"}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-end p-3 rounded-lg border border-border bg-muted/10">
        <div className="min-w-[160px]">
          <Label className="text-xs">Період</Label>
          <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">За весь час</SelectItem>
              <SelectItem value="this_month">Цей місяць</SelectItem>
              <SelectItem value="last_month">Минулий місяць</SelectItem>
              <SelectItem value="custom">Власний</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {preset === "custom" && (
          <>
            <div>
              <Label className="text-xs">З</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">По</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="mt-1" />
            </div>
          </>
        )}
        <div className="flex gap-2 ml-auto">
          <Button size="sm" variant="outline" onClick={() => setShowReport(s => !s)}>
            <FileText className="w-4 h-4 mr-1.5" />
            {showReport ? "Сховати звіт" : "Сформувати звіт"}
          </Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Report */}
      {showReport && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4 print:border-0">
          <div>
            <h3 className="font-display text-lg font-bold">Звіт по витратах — {driverName}</h3>
            <p className="text-xs text-muted-foreground">
              {range.from ? range.from.toLocaleDateString("uk-UA") : "початок"} — {range.to ? range.to.toLocaleDateString("uk-UA") : "сьогодні"}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Витрати за категоріями</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {byCategory.map(([cat, sum]) => (
                <div key={cat} className="p-2 rounded border border-border bg-muted/20">
                  <p className="text-[11px] text-muted-foreground">{cat}</p>
                  <p className="text-sm font-semibold text-foreground">{fmt(sum)} ₴</p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">
              Всі транзакції ({filteredExpenses.length})
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left p-2">Дата</th>
                    <th className="text-left p-2">Рейс</th>
                    <th className="text-left p-2">Категорія</th>
                    <th className="text-right p-2">Сума</th>
                    <th className="text-left p-2">Коментар</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr><td colSpan={5} className="p-4 text-center text-muted-foreground">Витрат немає</td></tr>
                  ) : filteredExpenses.map(e => {
                    const o = ordersById.get(e.order_id);
                    return (
                      <tr key={e.id} className="border-b border-border/50">
                        <td className="p-2 whitespace-nowrap">{new Date(e.created_at).toLocaleDateString("uk-UA")}</td>
                        <td className="p-2 whitespace-nowrap">{o?.order_number ?? "—"}</td>
                        <td className="p-2">{e.category}</td>
                        <td className="p-2 text-right font-medium">{fmt(Number(e.amount))} ₴</td>
                        <td className="p-2 text-muted-foreground">{e.description ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td colSpan={3} className="p-2 text-right">Підсумок:</td>
                    <td className="p-2 text-right text-amber-300">{fmt(totalExpenses)} ₴</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <Button size="sm" variant="outline" onClick={() => window.print()} className="print:hidden">
            Друкувати
          </Button>
        </div>
      )}

      {/* Full transactions list (always visible) */}
      {!showReport && (
        <div className="rounded-lg border border-border bg-card overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                <th className="text-left p-3">Дата</th>
                <th className="text-left p-3">Рейс</th>
                <th className="text-left p-3">Категорія</th>
                <th className="text-right p-3">Сума</th>
                <th className="text-left p-3">Коментар</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Витрат у вибраному періоді немає</td></tr>
              ) : filteredExpenses.map(e => {
                const o = ordersById.get(e.order_id);
                return (
                  <tr key={e.id} className="border-b border-border/50 hover:bg-muted/10">
                    <td className="p-3 whitespace-nowrap">{new Date(e.created_at).toLocaleDateString("uk-UA")}</td>
                    <td className="p-3 whitespace-nowrap">
                      <div className="font-medium">{o?.order_number ?? "—"}</div>
                      {o && <div className="text-[10px] text-muted-foreground">{o.origin} → {o.destination}</div>}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded-full bg-secondary/15 text-secondary">{e.category}</span>
                    </td>
                    <td className="p-3 text-right font-semibold">{fmt(Number(e.amount))} ₴</td>
                    <td className="p-3 text-muted-foreground">{e.description ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  icon, label, value, tone,
}: { icon: React.ReactNode; label: string; value: string; tone: "blue" | "amber" | "green" | "red" }) {
  const tones: Record<string, string> = {
    blue: "border-blue-500/30 bg-blue-500/5 text-blue-300",
    amber: "border-amber-500/30 bg-amber-500/5 text-amber-300",
    green: "border-green-500/30 bg-green-500/5 text-green-400",
    red: "border-red-500/30 bg-red-500/5 text-red-400",
  };
  return (
    <div className={`p-4 rounded-lg border ${tones[tone]}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
