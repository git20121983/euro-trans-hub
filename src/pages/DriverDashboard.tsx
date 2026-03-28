import { useEffect, useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Truck, MapPin, Camera, Shield, Package, CheckCircle,
  Navigation, Clock, Upload, FileText, ChevronRight, Loader2
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
  { id: "in_transit", label: "В дорозі", icon: Navigation, color: "bg-blue-600 hover:bg-blue-700 text-white", activeRing: "ring-blue-400" },
  { id: "customs", label: "Митниця", icon: Shield, color: "bg-violet-600 hover:bg-violet-700 text-white", activeRing: "ring-violet-400" },
  { id: "unloading", label: "Розвантаження", icon: Truck, color: "bg-yellow-600 hover:bg-yellow-700 text-white", activeRing: "ring-yellow-400" },
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

    // Find or create driver record
    let { data: driver } = await supabase
      .from("drivers")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (!driver) {
      // Auto-create driver profile
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
        console.error("Failed to create driver:", createError);
        toast.error("Не вдалося створити профіль водія. Зверніться до адміністратора.");
        setLoading(false);
        return;
      }
      driver = newDriver;
    }

    setDriverRecord(driver);

    // Fetch assigned orders (active ones)
    const { data: driverOrders } = await supabase
      .from("orders")
      .select("*")
      .eq("driver_id", driver.id)
      .not("status", "eq", "completed")
      .order("created_at", { ascending: false });

    setOrders(driverOrders ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchDriverData(user.id);
  }, [user, fetchDriverData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => fetchDriverData(user.id), 30000);
    return () => clearInterval(interval);
  }, [user, fetchDriverData]);

  const updateDriverStatus = async (newStatus: string) => {
    if (!driverRecord || updatingStatus) return;
    setUpdatingStatus(true);

    // Update driver status
    const { error: driverError } = await supabase
      .from("drivers")
      .update({ status: newStatus })
      .eq("id", driverRecord.id);

    if (driverError) {
      toast.error("Помилка оновлення статусу водія");
      setUpdatingStatus(false);
      return;
    }

    setDriverRecord((prev) => prev ? { ...prev, status: newStatus } : null);

    // If there's an active order, update its status too
    const activeOrder = orders[0];
    if (activeOrder) {
      const orderStatusMap: Record<string, string> = {
        available: activeOrder.status, // don't change order
        in_transit: "in_transit",
        customs: "customs",
        unloading: "unloading",
      };
      const newOrderStatus = orderStatusMap[newStatus];
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

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast.error("Помилка оновлення статусу");
      return;
    }

    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    const label = STATUS_FLOW.find((s) => s.id === newStatus)?.label ?? newStatus;
    toast.success(`Статус оновлено: ${label}`);
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
      toast.success("Фото ТТН завантажено!");
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4 sticky top-0 z-10">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <div>
            <h1 className="font-bold text-lg">🚛 Euro Trans</h1>
            <p className="text-xs text-muted-foreground">{driverRecord.full_name}</p>
          </div>
          <div className="text-right">
            <span className={`text-xs px-2 py-1 rounded-full ${
              driverRecord.status !== "available"
                ? "bg-green-500/20 text-green-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {DRIVER_STATUSES.find(s => s.id === driverRecord.status)?.label ?? "Вільний"}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handlePhotoUpload}
        />

        {/* Driver Status Buttons */}
        <div className="rounded-xl border border-border bg-card p-4">
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
                      ? `${status.color} ring-2 ${status.activeRing} ring-offset-2 ring-offset-background scale-[1.02]`
                      : "bg-muted/50 hover:bg-muted text-foreground"
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
                {/* Order header */}
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

                {/* Route card */}
                <div className="px-4 py-3 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Маршрут</p>
                  <div className="flex items-start gap-3">
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary" />
                      <div className="w-0.5 h-8 bg-border" />
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    </div>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="font-medium">{order.origin}</p>
                        <p className="text-xs text-muted-foreground">Завантаження</p>
                      </div>
                      <div>
                        <p className="font-medium text-muted-foreground">Митниця</p>
                        <p className="text-xs text-muted-foreground">Прикордонний перехід</p>
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
                  </div>
                </div>

                {/* Status progress */}
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

                {/* Action buttons */}
                <div className="px-4 py-3 border-t border-border space-y-2">
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

                  <Button
                    onClick={() => triggerPhotoUpload(order.id)}
                    variant="outline"
                    className="w-full"
                    size="lg"
                    disabled={uploading}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {uploading ? "Завантаження..." : "Завантажити фото ТТН"}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
