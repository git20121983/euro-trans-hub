import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, MapPin, User, GripVertical, Phone } from "lucide-react";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import OrderDetailPanel from "@/components/admin/OrderDetailPanel";

type Order = Tables<"orders">;

const KANBAN_COLUMNS = [
  { id: "new", label: "Нові", color: "bg-blue-500", dotColor: "bg-blue-400" },
  { id: "planning", label: "Планування", color: "bg-cyan-500", dotColor: "bg-cyan-400" },
  { id: "in_transit", label: "В дорозі", color: "bg-orange-500", dotColor: "bg-orange-400" },
  { id: "customs", label: "Митниця", color: "bg-violet-500", dotColor: "bg-violet-400" },
  { id: "unloading", label: "Розвантаження", color: "bg-yellow-500", dotColor: "bg-yellow-400" },
  { id: "awaiting_payment", label: "Очікує оплати", color: "bg-purple-500", dotColor: "bg-purple-400" },
  { id: "completed", label: "Завершено", color: "bg-green-500", dotColor: "bg-green-400" },
] as const;

const statusBadgeColors: Record<string, string> = {
  new: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  planning: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  in_transit: "bg-orange-500/20 text-orange-300 border-orange-500/30",
  customs: "bg-violet-500/20 text-violet-300 border-violet-500/30",
  unloading: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  awaiting_payment: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  completed: "bg-green-500/20 text-green-300 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-300 border-red-500/30",
};

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
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

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;
    const order = orders.find((o) => o.id === draggableId);
    if (!order || order.status === newStatus) return;

    // Optimistic update
    setOrders((prev) =>
      prev.map((o) => (o.id === draggableId ? { ...o, status: newStatus } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", draggableId);

    if (error) {
      // Revert
      setOrders((prev) =>
        prev.map((o) => (o.id === draggableId ? { ...o, status: order.status } : o))
      );
      toast.error("Помилка оновлення статусу");
    } else {
      const colLabel = KANBAN_COLUMNS.find((c) => c.id === newStatus)?.label ?? newStatus;
      toast.success(`Замовлення переведено: ${colLabel}`);
    }
  }, [orders]);

  const getDriverName = (driverId: string | null) => {
    if (!driverId) return null;
    return drivers.find((d) => d.id === driverId)?.full_name ?? null;
  };

  const getOrdersByStatus = (status: string) =>
    orders.filter((o) => o.status === status);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Package className="w-6 h-6 text-secondary" /> Замовлення — Kanban
        </h1>
        <div className="text-sm text-muted-foreground">
          Всього: {orders.length}
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-2 px-2">
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = getOrdersByStatus(col.id);
            return (
              <div key={col.id} className="flex-shrink-0 w-[280px]">
                {/* Column header */}
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${col.dotColor}`} />
                  <span className="font-display font-semibold text-sm">{col.label}</span>
                  <span className="ml-auto text-xs text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">
                    {colOrders.length}
                  </span>
                </div>

                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`min-h-[200px] rounded-xl border border-border p-2 space-y-2 transition-colors ${
                        snapshot.isDraggingOver
                          ? "bg-secondary/10 border-secondary/40"
                          : "bg-card/50"
                      }`}
                    >
                      {colOrders.map((order, index) => {
                        const driverName = getDriverName(order.driver_id);
                        return (
                          <Draggable key={order.id} draggableId={order.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`rounded-lg border border-border bg-card p-3 space-y-2 transition-shadow ${
                                  snapshot.isDragging
                                    ? "shadow-lg shadow-secondary/20 border-secondary/50"
                                    : "hover:border-muted-foreground/30"
                                }`}
                              >
                                {/* Drag handle + order number */}
                                <div className="flex items-center gap-1.5">
                                  <div {...provided.dragHandleProps} className="text-muted-foreground/50 hover:text-muted-foreground cursor-grab">
                                    <GripVertical className="w-3.5 h-3.5" />
                                  </div>
                                  <span className="font-mono text-[10px] text-muted-foreground">
                                    {order.order_number}
                                  </span>
                                </div>

                                {/* Client */}
                                <p className="font-medium text-sm truncate">
                                  {order.client_name}
                                </p>

                                {/* Route */}
                                <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                                  <MapPin className="w-3 h-3 mt-0.5 text-secondary flex-shrink-0" />
                                  <span className="line-clamp-2">
                                    {order.origin} → {order.destination}
                                  </span>
                                </div>

                                {/* Bottom row */}
                                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                                  {order.total_price ? (
                                    <span className="text-xs font-semibold text-green-400">
                                      {Number(order.total_price).toLocaleString("uk-UA")} ₴
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}

                                  {driverName ? (
                                    <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">
                                      <User className="w-2.5 h-2.5" />
                                      {driverName}
                                    </span>
                                  ) : (
                                    <span className="text-[10px] text-orange-400/70 bg-orange-500/10 px-1.5 py-0.5 rounded">
                                      Без водія
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
