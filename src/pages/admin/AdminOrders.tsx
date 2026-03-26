import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, MapPin, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const statusLabels: Record<string, string> = {
  new: "Нове",
  in_transit: "В дорозі",
  unloading: "Розвантаження",
  awaiting_payment: "Очікує оплати",
  completed: "Завершено",
  cancelled: "Скасовано",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-400",
  in_transit: "bg-orange-500/20 text-orange-400",
  unloading: "bg-yellow-500/20 text-yellow-400",
  awaiting_payment: "bg-purple-500/20 text-purple-400",
  completed: "bg-green-500/20 text-green-400",
  cancelled: "bg-red-500/20 text-red-400",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [drivers, setDrivers] = useState<Tables<"drivers">[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const [ordersRes, driversRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }),
        supabase.from("drivers").select("*"),
      ]);
      setOrders(ordersRes.data ?? []);
      setDrivers(driversRes.data ?? []);
    };
    fetchData();
  }, []);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    await supabase.from("orders").update({ driver_id: driverId }).eq("id", orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, driver_id: driverId } : o)));
  };

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-secondary" /> Замовлення
        </h1>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі</SelectItem>
              {Object.entries(statusLabels).map(([val, label]) => (
                <SelectItem key={val} value={val}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">№ ТТН</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Клієнт</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Маршрут</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Сума</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Статус</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Водій</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-muted-foreground">
                    Замовлень не знайдено
                  </td>
                </tr>
              ) : (
                filtered.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-medium font-mono text-xs">{order.order_number}</td>
                    <td className="p-4">{order.client_name}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-xs">
                        <MapPin className="w-3 h-3 text-secondary" />
                        {order.origin} → {order.destination}
                      </span>
                    </td>
                    <td className="p-4 font-semibold">
                      {order.total_price ? `${Number(order.total_price).toLocaleString("uk-UA")} ₴` : "—"}
                    </td>
                    <td className="p-4">
                      <Select
                        value={order.status}
                        onValueChange={(v) => updateOrderStatus(order.id, v)}
                      >
                        <SelectTrigger className="h-7 text-xs w-36 border-0 bg-transparent">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status] || ""}`}>
                            {statusLabels[order.status] || order.status}
                          </span>
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(statusLabels).map(([val, label]) => (
                            <SelectItem key={val} value={val}>{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="p-4">
                      <Select
                        value={order.driver_id || "none"}
                        onValueChange={(v) => assignDriver(order.id, v === "none" ? "" : v)}
                      >
                        <SelectTrigger className="h-7 text-xs w-36">
                          <SelectValue placeholder="Призначити" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— Не призначено —</SelectItem>
                          {drivers.map((d) => (
                            <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
