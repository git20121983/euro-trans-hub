import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Truck, Plus, ShieldCheck, Clock, AlertCircle, FolderOpen } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import AddDriverModal from "@/components/admin/AddDriverModal";
import DriverVerificationModal from "@/components/admin/DriverVerificationModal";

type Driver = Tables<"drivers">;

const statusLabels: Record<string, string> = {
  available: "Вільний",
  on_trip: "У рейсі",
  in_transit: "В дорозі",
  loading: "Завантаження",
  customs: "Митниця",
  day_off: "Вихідний",
  sick_leave: "Лікарняний",
  pending_details: "Очікує заповнення",
  on_verification: "На верифікації",
};

const statusColors: Record<string, string> = {
  available: "bg-green-500/20 text-green-400",
  on_trip: "bg-orange-500/20 text-orange-400",
  in_transit: "bg-blue-500/20 text-blue-400",
  loading: "bg-cyan-500/20 text-cyan-400",
  customs: "bg-violet-500/20 text-violet-400",
  day_off: "bg-blue-500/20 text-blue-400",
  sick_leave: "bg-red-500/20 text-red-400",
  pending_details: "bg-slate-500/20 text-slate-300",
  on_verification: "bg-amber-500/20 text-amber-400",
};

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Tables<"trucks">[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [verifying, setVerifying] = useState<Driver | null>(null);
  const isMobile = useIsMobile();

  const loadData = useCallback(() => {
    Promise.all([
      supabase.from("drivers").select("*").order("full_name"),
      supabase.from("trucks").select("*"),
    ]).then(([driversRes, trucksRes]) => {
      setDrivers(driversRes.data ?? []);
      setTrucks(trucksRes.data ?? []);
    });
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Realtime: notify on new verification requests
  useEffect(() => {
    const channel = supabase
      .channel("admin-drivers-verify")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "drivers" },
        (payload) => {
          const updated = payload.new as Driver;
          const old = payload.old as Driver;
          if (updated.status === "on_verification" && old.status !== "on_verification") {
            toast.info(`🔔 ${updated.full_name} надав документи на перевірку`, { duration: 8000 });
          }
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "drivers" },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadData]);

  const getTruck = (truckId: string | null) => trucks.find((t) => t.id === truckId);

  const pendingVerification = drivers.filter((d) => d.status === "on_verification");

  return (
    <div className="space-y-6 max-w-[100vw] overflow-hidden">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6 text-secondary" /> Водії
        </h1>
        <Button onClick={() => setShowAdd(true)} size={isMobile ? "sm" : "default"}>
          <Plus className="w-4 h-4 mr-1" /> Додати водія
        </Button>
      </div>

      {pendingVerification.length > 0 && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm">
              {pendingVerification.length} {pendingVerification.length === 1 ? "водій надав" : "водіїв надали"} документи на перевірку
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Перевірте документи та активуйте обліковий запис
            </p>
          </div>
        </div>
      )}

      <AddDriverModal
        open={showAdd}
        onOpenChange={setShowAdd}
        onCreated={loadData}
        trucks={trucks}
        existingDrivers={drivers}
      />

      <DriverVerificationModal
        driver={verifying}
        open={!!verifying}
        onOpenChange={(o) => !o && setVerifying(null)}
        onActioned={loadData}
      />

      {drivers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Водіїв не знайдено. Натисніть «Додати водія» щоб створити першого.
        </div>
      ) : isMobile ? (
        <div className="space-y-3">
          {drivers.map((driver) => {
            const truck = getTruck(driver.assigned_truck_id);
            const needsVerify = driver.status === "on_verification";
            return (
              <div key={driver.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium break-words min-w-0">{driver.full_name}</span>
                  <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[driver.status] || ""}`}>
                    {statusLabels[driver.status] || driver.status}
                  </span>
                </div>
                <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 text-sm text-secondary">
                  <Phone className="w-3.5 h-3.5" />
                  {driver.phone}
                </a>
                {truck && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Truck className="w-3.5 h-3.5 text-secondary" />
                    {truck.plate_number} ({truck.model})
                  </div>
                )}
                {needsVerify && (
                  <Button size="sm" onClick={() => setVerifying(driver)} className="w-full mt-2 bg-amber-600 hover:bg-amber-700">
                    <ShieldCheck className="w-4 h-4 mr-1.5" /> Перевірити документи
                  </Button>
                )}
                {driver.status === "pending_details" && (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Очікуємо реєстрації водія за телефоном
                  </p>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">ПІБ</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Телефон</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Посвідчення</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Статус</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Авто</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Дії</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const truck = getTruck(driver.assigned_truck_id);
                const needsVerify = driver.status === "on_verification";
                return (
                  <tr key={driver.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-medium break-words max-w-[200px]">{driver.full_name}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
                        <Phone className="w-3 h-3" /> {driver.phone}
                      </span>
                    </td>
                    <td className="p-4 text-xs text-muted-foreground">{driver.license_number ?? "—"}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${statusColors[driver.status] || ""}`}>
                        {statusLabels[driver.status] || driver.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {truck ? (
                        <span className="flex items-center gap-1 text-xs whitespace-nowrap">
                          <Truck className="w-3 h-3 text-secondary" />
                          {truck.plate_number}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {needsVerify && (
                        <Button size="sm" onClick={() => setVerifying(driver)} className="bg-amber-600 hover:bg-amber-700">
                          <ShieldCheck className="w-3.5 h-3.5 mr-1.5" /> Перевірити
                        </Button>
                      )}
                    </td>
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
