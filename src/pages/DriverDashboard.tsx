import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Truck, MapPin, Camera, Shield, Package, CheckCircle,
  Navigation, Clock, Upload, FileText, ChevronRight, Loader2, ExternalLink, Fuel,
  ThumbsUp, ThumbsDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type Driver = Tables<"drivers">;

const STATUS_FLOW = [
  { id: "new", label: "Нове", icon: Package },
  { id: "planning", label: "Планування", icon: Clock },
  { id: "in_transit", label: "В дорозі", icon: Navigation },
  { id: "customs", label: "Митниця", icon: Shield },
  { id: "unloading", label: "Розвантаження", icon: Truck },
  { id: "awaiting_payment", label: "Очікує оплати", icon: FileText },
  { id: "completed", label: "Завершено", icon: CheckCircle },
];

const DRIVER_STATUSES = [
  { id: "available", label: "Вільний", icon: CheckCircle, color: "bg-green-600 hover:bg-green-700 text-white", activeRing: "ring-green-400" },
  { id: "loading", label: "На завантаженні", icon: Package, color: "bg-cyan-600 hover:bg-cyan-700 text-white", activeRing: "ring-cyan-400" },
  { id: "in_transit", label: "В дорозі", icon: Navigation, color: "bg-blue-600 hover:bg-blue-700 text-white", activeRing: "ring-blue-400" },
  { id: "customs", label: "Митниця", icon: Shield, color: "bg-violet-600 hover:bg-violet-700 text-white", activeRing: "ring-violet-400" },
];

const CUSTOMS_POINTS = [
  { name: "МП «Ягодин»", address: "Волинська обл., смт Ягодин", coords: "51.5015,23.6306" },
  { name: "МП «Краковець»", address: "Львівська обл., с. Краковець", coords: "49.9830,23.1690" },
  { name: "МП «Рава-Руська»", address: "Львівська обл., м. Рава-Руська", coords: "50.2310,23.6280" },
  { name: "МП «Порубне»", address: "Чернівецька обл., с. Порубне", coords: "48.1780,25.7870" },
];

export default function DriverDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [driverRecord, setDriverRecord] = useState<Driver | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const fetchDriverData = useCallback(async (userId: string) => {
    setLoading(true);

    // Find existing driver record (unique constraint prevents duplicates)
    let { data: driver } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!driver) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, phone")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: newDriver, error: createError } = await supabase
        .from("drivers")
        .insert({
          user_id: userId,
          full_name: profile?.full_name ?? "Водій",
          phone: profile?.phone ?? "",
          status: "available",
        })
        .select("*")
        .single();

      if (createError) {
        // If unique constraint violation, fetch the existing record
        if (createError.code === "23505") {
          const { data: existing } = await supabase
            .from("drivers")
            .select("*")
            .eq("user_id", userId)
            .single();
          driver = existing;
        } else {
          console.error("Failed to create driver:", createError);
          toast.error("Не вдалося створити профіль водія.");
          setLoading(false);
          return;
        }
      } else {
        driver = newDriver;
      }
    }

    setDriverRecord(driver);

    if (driver) {
      const { data: driverOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", driver.id)
        .not("status", "eq", "completed")
        .order("created_at", { ascending: false });

      setOrders(driverOrders ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDriverData(user.id);
  }, [user, fetchDriverData]);

  // Realtime: orders
  useEffect(() => {
    if (!driverRecord) return;

    const channel = supabase
      .channel('driver-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `driver_id=eq.${driverRecord.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newOrder = payload.new as Order;
            setOrders((prev) => [newOrder, ...prev.filter(o => o.id !== newOrder.id)]);
            toast.info(`🚛 Новий рейс: ${newOrder.origin} → ${newOrder.destination}`, {
              duration: 8000,
              description: `Клієнт: ${newOrder.client_name} | ${newOrder.distance} км`,
            });
            if (Notification.permission === 'granted') {
              new Notification('Euro Trans — Новий рейс', {
                body: `${newOrder.origin} → ${newOrder.destination}\n${newOrder.client_name}`,
              });
            } else if (Notification.permission === 'default') {
              Notification.requestPermission();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Order;
            setOrders((prev) =>
              prev.map((o) => (o.id === updated.id ? updated : o))
                .filter((o) => o.status !== 'completed')
            );
          } else if (payload.eventType === 'DELETE') {
            setOrders((prev) => prev.filter((o) => o.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driverRecord]);

  // Realtime: driver record (status synced from admin or other sources)
  useEffect(() => {
    if (!driverRecord) return;

    const channel = supabase
      .channel('driver-self')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'drivers',
          filter: `id=eq.${driverRecord.id}`,
        },
        (payload) => {
          const updated = payload.new as Driver;
          setDriverRecord(updated);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [driverRecord?.id]);

  // Map order status → driver status
  const orderToDriverStatus = (orderStatus: string): string => {
    const map: Record<string, string> = {
      in_transit: "in_transit",
      customs: "customs",
      unloading: "loading",
      completed: "available",
      cancelled: "available",
    };
    return map[orderStatus] ?? driverRecord?.status ?? "available";
  };

  // Map driver status → order status
  const driverToOrderStatus = (driverStatus: string): string | null => {
    const map: Record<string, string> = {
      in_transit: "in_transit",
      customs: "customs",
      loading: "unloading",
    };
    return map[driverStatus] ?? null;
  };

  const updateDriverStatus = async (newStatus: string) => {
    if (!driverRecord || updatingStatus) return;
    setUpdatingStatus(true);

    const { error: driverError } = await supabase
      .from("drivers")
      .update({ status: newStatus })
      .eq("id", driverRecord.id);

    if (driverError) {
      toast.error(`Помилка оновлення статусу водія: ${driverError.message}`);
      console.error("Driver status update error:", driverError);
      setUpdatingStatus(false);
      return;
    }

    setDriverRecord((prev) => prev ? { ...prev, status: newStatus } : null);

    // Sync active order status
    const activeOrder = orders.find(o => !["completed", "cancelled"].includes(o.status));
    if (activeOrder) {
      const newOrderStatus = driverToOrderStatus(newStatus);
      if (newOrderStatus && newOrderStatus !== activeOrder.status) {
        const { error: orderError } = await supabase
          .from("orders")
          .update({ status: newOrderStatus })
          .eq("id", activeOrder.id);

        if (!orderError) {
          setOrders((prev) =>
            prev.map((o) => o.id === activeOrder.id ? { ...o, status: newOrderStatus } : o)
          );
        }
      }
    }

    const label = DRIVER_STATUSES.find((s) => s.id === newStatus)?.label ?? newStatus;
    toast.success(`Статус: ${label}`);
    setUpdatingStatus(false);
  };

  const syncDriverStatusFromOrder = async (newOrderStatus: string) => {
    if (!driverRecord) return;
    const newDriverStatus = orderToDriverStatus(newOrderStatus);
    if (newDriverStatus !== driverRecord.status) {
      const { error } = await supabase
        .from("drivers")
        .update({ status: newDriverStatus })
        .eq("id", driverRecord.id);
      if (!error) {
        setDriverRecord((prev) => prev ? { ...prev, status: newDriverStatus } : null);
      }
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error(`Помилка оновлення статусу рейсу: ${error.message}`);
      return;
    }

    // If completed, remove from list; otherwise update
    if (newStatus === "completed" || newStatus === "cancelled") {
      setOrders((prev) => prev.filter((o) => o.id !== orderId));
    } else {
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
    }

    // Sync driver status to match trip state
    await syncDriverStatusFromOrder(newStatus);

    const label = STATUS_FLOW.find((s) => s.id === newStatus)?.label ?? newStatus;
    toast.success(`Статус оновлено: ${label}`);
  };

  const acceptOrder = async (orderId: string) => {
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "driver_accepted",
      description: "Водій прийняв рейс",
    });
    await updateOrderStatus(orderId, "in_transit");
    toast.success("✅ Рейс прийнято!");
  };

  const rejectOrder = async (orderId: string) => {
    // Log rejection event
    await supabase.from("order_events").insert({
      order_id: orderId,
      event_type: "driver_rejected",
      description: "Водій відхилив рейс",
    });

    // Clear driver from order, reset status to 'new'
    const { error } = await supabase
      .from("orders")
      .update({ driver_id: null, status: "new" })
      .eq("id", orderId);

    if (error) {
      toast.error("Помилка відхилення рейсу");
      return;
    }

    // Reset own driver status to available
    if (driverRecord) {
      await supabase.from("drivers").update({ status: "available" }).eq("id", driverRecord.id);
      setDriverRecord((prev) => prev ? { ...prev, status: "available" } : null);
    }

    setOrders((prev) => prev.filter((o) => o.id !== orderId));
    toast.info("Рейс відхилено. Диспетчер отримає повідомлення.");
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedOrderId) return;

    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${selectedOrderId}/${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("order-documents")
      .upload(path, file, { cacheControl: "3600" });

    setUploading(false);
    if (error) {
      toast.error("Помилка завантаження файлу");
    } else {
      toast.success("Фото завантажено!");
      await supabase.from("order_events").insert({
        order_id: selectedOrderId,
        event_type: "document_upload",
        description: `Водій завантажив документ: ${file.name}`,
      });
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const triggerPhotoUpload = (orderId: string) => {
    setSelectedOrderId(orderId);
    fileInputRef.current?.click();
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground mx-auto" />
          <p className="text-sm text-muted-foreground">Завантаження даних водія...</p>
        </div>
      </div>
    );
  }

  if (!driverRecord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">Не вдалося створити профіль</h2>
          <p className="text-sm text-muted-foreground">
            Зверніться до адміністратора для прив'язки вашого акаунту.
          </p>
        </div>
      </div>
    );
  }

  const getNextStatus = (current: string) => {
    const idx = STATUS_FLOW.findIndex((s) => s.id === current);
    if (idx < 0 || idx >= STATUS_FLOW.length - 1) return null;
    return STATUS_FLOW[idx + 1];
  };

  const getStatusIdx = (status: string) =>
    STATUS_FLOW.findIndex((s) => s.id === status);

  const activeOrder = orders[0];
  const isOnCustoms = driverRecord.status === "customs";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background/70 backdrop-blur-xl border-b border-white/10 px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-bold text-lg text-foreground">🚛 Euro Trans</h1>
            <p className="text-xs text-muted-foreground">{driverRecord.full_name}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium backdrop-blur-md border ${
              driverRecord.status === "available"
                ? "bg-green-500/15 text-green-300 border-green-500/30"
                : driverRecord.status === "in_transit"
                ? "bg-blue-500/15 text-blue-300 border-blue-500/30"
                : driverRecord.status === "customs"
                ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                : "bg-white/5 text-muted-foreground border-white/10"
            }`}>
              {DRIVER_STATUSES.find(s => s.id === driverRecord.status)?.label ?? "Вільний"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Driver Status Buttons */}
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Ваш статус
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DRIVER_STATUSES.map((status) => {
              const isActive = driverRecord.status === status.id;
              const Icon = status.icon;
              return (
                <Button
                  key={status.id}
                  onClick={() => updateDriverStatus(status.id)}
                  disabled={updatingStatus}
                  className={`h-16 text-sm font-medium transition-all ${
                    isActive
                      ? `${status.color} ring-2 ${status.activeRing} ring-offset-2 ring-offset-background scale-[1.02] shadow-lg`
                      : "bg-white/[0.04] hover:bg-white/[0.08] text-foreground border border-white/10 backdrop-blur-md"
                  }`}
                  variant={isActive ? "default" : "outline"}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Icon className="w-5 h-5" />
                    <span>{status.label}</span>
                  </div>
                </Button>
              );
            })}
          </div>
        </div>

        {/* Customs Block */}
        {isOnCustoms && (
          <div className="rounded-xl border border-violet-500/30 bg-violet-500/5 p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Shield className="w-4 h-4 text-violet-400" />
              Митні пункти пропуску
            </p>
            <div className="space-y-2">
              {CUSTOMS_POINTS.map((cp) => (
                <div key={cp.name} className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
                  <div>
                    <p className="text-sm font-medium">{cp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{cp.address}</p>
                  </div>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${cp.coords}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-violet-400">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Orders */}
        {orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Активних рейсів немає</h2>
            <p className="text-sm text-muted-foreground">
              Очікуйте призначення від диспетчера
            </p>
          </div>
        ) : (
          orders.map((order) => {
            const nextStatus = getNextStatus(order.status);
            const statusIdx = getStatusIdx(order.status);

            return (
              <div key={order.id} className="rounded-xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border bg-muted/20">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted-foreground">
                      {order.order_number}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-secondary/20 text-secondary">
                      {STATUS_FLOW.find((s) => s.id === order.status)?.label ?? order.status}
                    </span>
                  </div>
                  <p className="font-semibold mt-1">{order.client_name}</p>
                </div>

                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Маршрут</p>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">{order.origin}</p>
                        <p className="text-xs text-muted-foreground">Завантаження</p>
                      </div>
                      <div>
                        <p className="font-medium">{order.destination}</p>
                        <p className="text-xs text-muted-foreground">Розвантаження</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                    <MapPin className="w-3 h-3" />
                    <span>{order.distance} км</span>
                    {order.cargo_type && (
                      <>
                        <span>•</span>
                        <span>{order.cargo_type}</span>
                      </>
                    )}
                    {order.total_price && (
                      <>
                        <span>•</span>
                        <span className="text-green-400 font-medium">{Number(order.total_price).toLocaleString("uk-UA")} ₴</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="px-4 py-2 border-t border-border">
                  <div className="flex items-center gap-1">
                    {STATUS_FLOW.slice(0, -1).map((step, i) => (
                      <div key={step.id} className="flex items-center flex-1">
                        <div
                          className={`h-1.5 flex-1 rounded-full transition-colors ${
                            i <= statusIdx ? "bg-secondary" : "bg-muted"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-border space-y-2">
                  {/* Accept / Reject for newly assigned orders */}
                  {order.status === "planning" ? (
                    <div className="space-y-2">
                      <p className="text-xs text-center text-muted-foreground font-medium">
                        Підтвердіть призначений рейс
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          onClick={() => acceptOrder(order.id)}
                          size="lg"
                          className="w-full bg-green-600 hover:bg-green-700 text-white"
                        >
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Прийняти
                        </Button>
                        <Button
                          onClick={() => rejectOrder(order.id)}
                          size="lg"
                          variant="destructive"
                          className="w-full"
                        >
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Відхилити
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {nextStatus && (
                        <Button
                          onClick={() => updateOrderStatus(order.id, nextStatus.id)}
                          className="w-full"
                          size="lg"
                        >
                          <ChevronRight className="w-4 h-4 mr-2" />
                          {nextStatus.label}
                        </Button>
                      )}
                    </>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      onClick={() => triggerPhotoUpload(order.id)}
                      variant="outline"
                      className="w-full"
                      disabled={uploading}
                    >
                      <Camera className="w-4 h-4 mr-2" />
                      {uploading ? "..." : "Фото ТТН"}
                    </Button>
                    <Button
                      onClick={() => triggerPhotoUpload(order.id)}
                      variant="outline"
                      className="w-full"
                      disabled={uploading}
                    >
                      <Fuel className="w-4 h-4 mr-2" />
                      {uploading ? "..." : "Фото чека"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
