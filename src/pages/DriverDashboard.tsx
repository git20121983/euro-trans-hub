import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import {
  Truck, MapPin, Camera, Shield, Package, CheckCircle,
  Navigation, Clock, Upload, FileText, ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;

const STATUS_FLOW = [
  { id: "new", label: "Нове", icon: Package },
  { id: "planning", label: "Планування", icon: Clock },
  { id: "in_transit", label: "В дорозі", icon: Navigation },
  { id: "customs", label: "Митниця", icon: Shield },
  { id: "unloading", label: "Розвантаження", icon: Truck },
  { id: "awaiting_payment", label: "Очікує оплати", icon: FileText },
  { id: "completed", label: "Завершено", icon: CheckCircle },
];

export default function DriverDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [driverRecord, setDriverRecord] = useState<Tables<"drivers"> | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchDriverData = async () => {
      // Find driver record linked to this user
      const { data: driver } = await supabase
        .from("drivers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!driver) {
        setLoading(false);
        return;
      }

      setDriverRecord(driver);

      // Fetch assigned orders
      const { data: driverOrders } = await supabase
        .from("orders")
        .select("*")
        .eq("driver_id", driver.id)
        .not("status", "eq", "completed")
        .order("created_at", { ascending: false });

      setOrders(driverOrders ?? []);
      setLoading(false);
    };

    fetchDriverData();
  }, [user]);

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Завантаження...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!driverRecord) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Truck className="w-12 h-12 text-muted-foreground mx-auto" />
          <h2 className="text-xl font-bold">Профіль водія не знайдено</h2>
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
              orders.length > 0
                ? "bg-green-500/20 text-green-400"
                : "bg-muted text-muted-foreground"
            }`}>
              {orders.length > 0 ? "В рейсі" : "Вільний"}
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

        {orders.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Package className="w-12 h-12 text-muted-foreground mx-auto" />
            <h2 className="text-lg font-semibold">Немає активних рейсів</h2>
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
                  {/* Quick status buttons */}
                  {order.status === "in_transit" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "customs")}
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                      size="lg"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Я на митниці
                    </Button>
                  )}

                  {order.status === "customs" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, "unloading")}
                      className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                      size="lg"
                    >
                      <Truck className="w-4 h-4 mr-2" />
                      Прибув на розвантаження
                    </Button>
                  )}

                  {nextStatus && order.status !== "in_transit" && order.status !== "customs" && (
                    <Button
                      onClick={() => updateOrderStatus(order.id, nextStatus.id)}
                      variant="outline"
                      className="w-full"
                      size="lg"
                    >
                      <ChevronRight className="w-4 h-4 mr-2" />
                      {nextStatus.label}
                    </Button>
                  )}

                  {/* Upload photo */}
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
