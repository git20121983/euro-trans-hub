import { useEffect, useState } from "react";
import { Truck, Package, DollarSign, Fuel, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface Stats {
  activeTrips: number;
  monthRevenue: number;
  fuelCosts: number;
  availableTrucks: number;
}

const mockChartData = [
  { month: "Січ", trips: 18 },
  { month: "Лют", trips: 22 },
  { month: "Бер", trips: 28 },
  { month: "Кві", trips: 25 },
  { month: "Тра", trips: 30 },
  { month: "Чер", trips: 35 },
];

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    activeTrips: 0,
    monthRevenue: 0,
    fuelCosts: 0,
    availableTrucks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [ordersRes, trucksRes] = await Promise.all([
        supabase.from("orders").select("status, total_price, fuel_cost"),
        supabase.from("trucks").select("status"),
      ]);

      const orders = ordersRes.data ?? [];
      const trucks = trucksRes.data ?? [];

      setStats({
        activeTrips: orders.filter((o) => o.status === "in_transit").length,
        monthRevenue: orders
          .filter((o) => o.status === "completed")
          .reduce((sum, o) => sum + (o.total_price ?? 0), 0),
        fuelCosts: orders.reduce((sum, o) => sum + (o.fuel_cost ?? 0), 0),
        availableTrucks: trucks.filter((t) => t.status === "available").length,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { icon: Package, label: "Активні рейси", value: stats.activeTrips, color: "text-blue-400" },
    { icon: DollarSign, label: "Прибуток за місяць", value: `${stats.monthRevenue.toLocaleString("uk-UA")} ₴`, color: "text-green-400" },
    { icon: Fuel, label: "Витрати на пальне", value: `${stats.fuelCosts.toLocaleString("uk-UA")} ₴`, color: "text-orange-400" },
    { icon: Truck, label: "Вільні авто", value: stats.availableTrucks, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card p-5">
            <card.icon className={`w-6 h-6 ${card.color} mb-3`} />
            <div className="font-display text-2xl font-bold">{card.value}</div>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-5 h-5 text-secondary" />
          <h3 className="font-display font-bold">Завантаженість за місяцями</h3>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={mockChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215 25% 20%)" />
              <XAxis dataKey="month" stroke="hsl(215 15% 55%)" fontSize={12} />
              <YAxis stroke="hsl(215 15% 55%)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(215 30% 12%)",
                  border: "1px solid hsl(215 25% 20%)",
                  borderRadius: "8px",
                  color: "hsl(210 20% 95%)",
                }}
              />
              <Bar dataKey="trips" fill="hsl(30 95% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
