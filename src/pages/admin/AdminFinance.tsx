import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  AlertCircle,
  Receipt,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Tables } from "@/integrations/supabase/types";
import { toUah } from "@/components/expenses/ExpensesPanel";

type Order = Tables<"orders"> & {
  total_amount?: number | null;
  paid_amount?: number | null;
  driver_advance?: number | null;
  vat_amount?: number | null;
  is_international?: boolean | null;
  payment_status?: string | null;
  unloading_date?: string | null;
  manager_id?: string | null;
};

const fmt = (n: number) =>
  n.toLocaleString("uk-UA", { maximumFractionDigits: 0 });

const STATUS_LABEL: Record<string, string> = {
  unpaid: "Не оплачено",
  partially_paid: "Частково",
  paid: "Оплачено",
  overdue: "Прострочено",
};

const STATUS_COLOR: Record<string, string> = {
  unpaid: "bg-slate-700 text-slate-200",
  partially_paid: "bg-amber-500/20 text-amber-300",
  paid: "bg-emerald-500/20 text-emerald-300",
  overdue: "bg-red-500/20 text-red-300",
};

export default function AdminFinance() {
  const { isAdmin, isAccountant, isManager } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [expensesByOrder, setExpensesByOrder] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const canSeeCompanyProfit = isAdmin || isAccountant;

  useEffect(() => {
    // RLS вже відфільтрує дані: менеджер бачить лише свої.
    supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setOrders((data ?? []) as Order[]);
        setLoading(false);
      });

    supabase
      .from("expenses")
      .select("order_id, amount, currency")
      .then(({ data }) => {
        const map: Record<string, number> = {};
        (data ?? []).forEach((e: { order_id: string; amount: number; currency: string | null }) => {
          map[e.order_id] = (map[e.order_id] ?? 0) + toUah(Number(e.amount || 0), e.currency);
        });
        setExpensesByOrder(map);
      });
  }, []);

  const stats = useMemo(() => {
    const now = Date.now();
    const fourteenDays = 14 * 24 * 60 * 60 * 1000;

    let receivable = 0;
    let activeAdvances = 0;
    let forecastProfit = 0;
    let overdueCount = 0;

    for (const o of orders) {
      const total = Number(o.total_amount ?? o.total_price ?? 0);
      const paid = Number(o.paid_amount ?? 0);
      const debt = Math.max(total - paid, 0);

      const unloaded = o.unloading_date
        ? new Date(o.unloading_date).getTime()
        : null;
      const isOverdue =
        debt > 0 && unloaded !== null && now - unloaded > fourteenDays;

      if (o.payment_status !== "paid") receivable += debt;
      if (isOverdue) overdueCount += 1;

      if (["in_transit", "unloading", "customs"].includes(o.status)) {
        activeAdvances += Number(o.driver_advance ?? 0);
      }

      const vat = Number(o.vat_amount ?? 0);
      const fuel = Number(o.fuel_cost ?? 0);
      const salary = Number(o.driver_salary ?? 0);
      const depr = Number(o.depreciation_cost ?? 0);
      const toll = Number(o.toll_cost ?? 0);
      const tripExpenses = expensesByOrder[o.id] ?? 0;
      forecastProfit += total - vat - fuel - salary - depr - toll - tripExpenses;
    }

    return { receivable, activeAdvances, forecastProfit, overdueCount };
  }, [orders, expensesByOrder]);

  const widgets = [
    {
      label: "Загальна дебіторка",
      value: `${fmt(stats.receivable)} ₴`,
      icon: Receipt,
      tone: "text-amber-300",
      sub:
        stats.overdueCount > 0
          ? `${stats.overdueCount} прострочених`
          : "Все в строк",
      visible: true,
    },
    {
      label: "Активні аванси водіям",
      value: `${fmt(stats.activeAdvances)} ₴`,
      icon: Wallet,
      tone: "text-blue-300",
      sub: "Гроші «на руках»",
      visible: true,
    },
    {
      label: "Прогноз прибутку",
      value: `${fmt(stats.forecastProfit)} ₴`,
      icon: TrendingUp,
      tone: stats.forecastProfit >= 0 ? "text-emerald-300" : "text-red-300",
      sub: "З ПДВ та дорожніми витратами",
      visible: canSeeCompanyProfit,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <DollarSign className="w-6 h-6 text-secondary" /> Фінансовий модуль
        </h1>
        {isManager && !isAdmin && !isAccountant && (
          <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-slate-300">
            Перегляд: тільки ваші угоди
          </span>
        )}
      </div>

      {/* Top widgets */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {widgets
          .filter((w) => w.visible)
          .map((w) => (
            <div
              key={w.label}
              className="rounded-xl border border-border bg-card p-5 hover:border-secondary/40 transition"
            >
              <div className="flex items-start justify-between">
                <w.icon className={`w-6 h-6 ${w.tone}`} />
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Live
                </span>
              </div>
              <div className="font-display text-2xl font-bold mt-3">
                {w.value}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{w.label}</p>
              <p className="text-[11px] text-muted-foreground/80 mt-2">
                {w.sub}
              </p>
            </div>
          ))}
      </div>

      {/* Receivables table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-300" />
          <h3 className="font-display font-bold">Дебіторка по замовленнях</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">ТТН</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Маршрут</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Сума</th>
                <th className="text-right p-4 font-medium text-muted-foreground">ПДВ</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Сплачено</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Аванс</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Борг</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Статус</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Завантаження…
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Замовлень немає
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const total = Number(o.total_amount ?? o.total_price ?? 0);
                  const paid = Number(o.paid_amount ?? 0);
                  const debt = Math.max(total - paid, 0);
                  const now = Date.now();
                  const unloaded = o.unloading_date
                    ? new Date(o.unloading_date).getTime()
                    : null;
                  const isOverdue =
                    debt > 0 &&
                    unloaded !== null &&
                    now - unloaded > 14 * 24 * 60 * 60 * 1000;
                  const status = isOverdue ? "overdue" : o.payment_status ?? "unpaid";
                  return (
                    <tr
                      key={o.id}
                      className="border-b border-border last:border-0 hover:bg-muted/10"
                    >
                      <td className="p-4 font-mono text-xs">{o.order_number}</td>
                      <td className="p-4 text-xs">
                        {o.origin} → {o.destination}
                      </td>
                      <td className="p-4 text-right">{fmt(total)} ₴</td>
                      <td className="p-4 text-right text-muted-foreground">
                        {fmt(Number(o.vat_amount ?? 0))} ₴
                      </td>
                      <td className="p-4 text-right text-emerald-300">
                        {fmt(paid)} ₴
                      </td>
                      <td className="p-4 text-right text-blue-300">
                        {fmt(Number(o.driver_advance ?? 0))} ₴
                      </td>
                      <td
                        className={`p-4 text-right font-semibold ${
                          debt > 0 ? "text-amber-300" : "text-muted-foreground"
                        }`}
                      >
                        {fmt(debt)} ₴
                      </td>
                      <td className="p-4 text-right">
                        <span
                          className={`text-[11px] px-2 py-1 rounded-full ${STATUS_COLOR[status] ?? STATUS_COLOR.unpaid}`}
                        >
                          {STATUS_LABEL[status] ?? status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
