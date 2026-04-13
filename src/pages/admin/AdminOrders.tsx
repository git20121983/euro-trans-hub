import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Package, Plus } from "lucide-react";
import { DragDropContext, Droppable, type DropResult } from "@hello-pangea/dnd";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import OrderDetailPanel from "@/components/admin/OrderDetailPanel";
import OrderCard from "@/components/admin/OrderCard";
import CreateOrderModal from "@/components/admin/CreateOrderModal";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";

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

interface DriverInfo {
  id: string;
  full_name: string;
}

interface TruckInfo {
  id: string;
  plate_number: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<DriverInfo[]>([]);
  const [trucks, setTrucks] = useState<TruckInfo[]>([]);
  const [docsMap, setDocsMap] = useState<Record<string, number>>({});
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const isMobile = useIsMobile();

  const fetchData = useCallback(async () => {
    const [ordersRes, driversRes, trucksRes] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("drivers").select("id, full_name"),
      supabase.from("trucks").select("id, plate_number"),
    ]);
    const ordersData = ordersRes.data ?? [];
    setOrders(ordersData);
    setDrivers(driversRes.data ?? []);
    setTrucks(trucksRes.data ?? []);

    const docCounts: Record<string, number> = {};
    for (const order of ordersData.slice(0, 50)) {
      const { data: files } = await supabase.storage
        .from("order-documents")
        .list(order.id, { limit: 1 });
      if (files && files.length > 0) {
        docCounts[order.id] = files.length;
      }
    }
    setDocsMap(docCounts);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onDragEnd = useCallback(async (result: DropResult) => {
    const { draggableId, destination } = result;
    if (!destination) return;

    const newStatus = destination.droppableId;
    const order = orders.find((o) => o.id === draggableId);
    if (!order || order.status === newStatus) return;

    setOrders((prev) =>
      prev.map((o) => (o.id === draggableId ? { ...o, status: newStatus } : o))
    );

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", draggableId);

    if (error) {
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

  const getTruckPlate = (truckId: string | null) => {
    if (!truckId) return null;
    return trucks.find((t) => t.id === truckId)?.plate_number ?? null;
  };

  const getOrdersByStatus = (status: string) =>
    orders.filter((o) => o.status === status);

  const handleOrderUpdate = () => {
    fetchData();
  };

  const renderCard = (order: Order, index: number) => {
    const driverName = getDriverName(order.driver_id);
    const truckPlate = getTruckPlate(order.truck_id);
    return (
      <OrderCard
        key={order.id}
        order={order}
        index={index}
        isSelected={selectedOrder?.id === order.id}
        driverName={driverName}
        truckPlate={truckPlate}
        docsCount={docsMap[order.id] ?? 0}
        onClick={() => {
          setSelectedOrder(order);
          setDetailOpen(true);
        }}
      />
    );
  };

  const renderColumn = (col: typeof KANBAN_COLUMNS[number], className?: string) => {
    const colOrders = getOrdersByStatus(col.id);
    return (
      <div key={col.id} className={className ?? "flex-shrink-0 min-w-[320px] w-[320px] flex flex-col max-h-full"}>
        <div className="flex items-center gap-2 mb-3 px-2 py-1.5 rounded-lg bg-card border border-border flex-shrink-0">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${col.dotColor}`} />
          <span className="font-display font-semibold text-sm text-foreground truncate">{col.label}</span>
          <span className="ml-auto flex-shrink-0 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            {colOrders.length}
          </span>
        </div>
        <Droppable droppableId={col.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`min-h-[200px] flex-1 overflow-y-auto rounded-xl border border-border p-2 space-y-2 transition-colors kanban-column-scroll ${
                snapshot.isDraggingOver ? "bg-secondary/10 border-secondary/40" : "bg-card"
              }`}
            >
              {colOrders.map((order, index) => renderCard(order, index))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Sticky header */}
      <div className="flex items-center justify-between pb-3 flex-shrink-0">
        <h1 className="font-display text-xl sm:text-2xl font-bold flex items-center gap-2">
          <Package className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" /> Замовлення
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Всього: {orders.length}</span>
          <Button size="sm" onClick={() => setCreateOpen(true)} className="gap-1.5">
            <Plus className="w-4 h-4" /> Новий рейс
          </Button>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        {isMobile ? (
          /* Mobile: Tab bar + single column */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex overflow-x-auto gap-1 pb-2 flex-shrink-0 -mx-1 px-1 scrollbar-none">
              {KANBAN_COLUMNS.map((col, i) => {
                const count = getOrdersByStatus(col.id).length;
                return (
                  <button
                    key={col.id}
                    onClick={() => setActiveTab(i)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
                      activeTab === i
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-card border border-border text-muted-foreground"
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${col.dotColor}`} />
                    {col.label}
                    {count > 0 && (
                      <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${
                        activeTab === i ? "bg-secondary-foreground/20" : "bg-muted"
                      }`}>
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto pt-1">
              {renderColumn(KANBAN_COLUMNS[activeTab], "w-full")}
            </div>
          </div>
        ) : (
          /* Desktop: horizontal scroll kanban */
          <div className="flex gap-3 overflow-x-auto pb-4 pr-4 rounded-xl bg-muted/30 p-3 flex-1 min-h-0 kanban-scroll">
            {KANBAN_COLUMNS.map((col) => renderColumn(col))}
          </div>
        )}
      </DragDropContext>

      <OrderDetailPanel
        order={selectedOrder}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        driverName={selectedOrder ? getDriverName(selectedOrder.driver_id) : null}
        truckPlate={selectedOrder ? getTruckPlate(selectedOrder.truck_id) : null}
        onOrderUpdate={handleOrderUpdate}
      />
      <CreateOrderModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleOrderUpdate}
      />
    </div>
  );
}
