import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

export default function AdminFinance() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    supabase
      .from("orders")
      .select("*")
      .in("status", ["completed", "awaiting_payment"])
      .order("created_at", { ascending: false })
      .then(({ data }) => setOrders(data ?? []));
  }, []);

  const totalRevenue = orders.reduce((s, o) => s + (o.total_price ?? 0), 0);
  const totalFuel = orders.reduce((s, o) => s + (o.fuel_cost ?? 0), 0);
  const totalSalary = orders.reduce((s, o) => s + (o.driver_salary ?? 0), 0);
  const totalDepreciation = orders.reduce((s, o) => s + (o.depreciation_cost ?? 0), 0);
  const totalProfit = totalRevenue - totalFuel - totalSalary - totalDepreciation;

  const fmt = (n: number) => n.toLocaleString("uk-UA");

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <DollarSign className="w-6 h-6 text-secondary" /> Фінансовий модуль
      </h1>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Дохід", value: `${fmt(totalRevenue)} ₴`, icon: TrendingUp, color: "text-green-400" },
          { label: "Паливо", value: `${fmt(totalFuel)} ₴`, icon: TrendingDown, color: "text-orange-400" },
          { label: "Зарплати", value: `${fmt(totalSalary)} ₴`, icon: Minus, color: "text-blue-400" },
          { label: "Чистий прибуток", value: `${fmt(totalProfit)} ₴`, icon: DollarSign, color: totalProfit >= 0 ? "text-green-400" : "text-red-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5">
            <card.icon className={`w-6 h-6 ${card.color} mb-3`} />
            <div className="font-display text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border">
          <h3 className="font-display font-bold">Прибуток по рейсах</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">ТТН</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Маршрут</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Сума</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Паливо</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Зарплата</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Амортизація</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Прибуток</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Завершених рейсів немає
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const profit = (o.total_price ?? 0) - (o.fuel_cost ?? 0) - (o.driver_salary ?? 0) - (o.depreciation_cost ?? 0);
                  return (
                    <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="p-4 font-mono text-xs">{o.order_number}</td>
                      <td className="p-4 text-xs">{o.origin} → {o.destination}</td>
                      <td className="p-4 text-right">{fmt(o.total_price ?? 0)} ₴</td>
                      <td className="p-4 text-right text-orange-400">{fmt(o.fuel_cost ?? 0)} ₴</td>
                      <td className="p-4 text-right text-blue-400">{fmt(o.driver_salary ?? 0)} ₴</td>
                      <td className="p-4 text-right text-muted-foreground">{fmt(o.depreciation_cost ?? 0)} ₴</td>
                      <td className={`p-4 text-right font-semibold ${profit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {fmt(profit)} ₴
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
