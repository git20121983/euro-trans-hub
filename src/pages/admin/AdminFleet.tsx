import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Wrench, Gauge, AlertTriangle, History } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import TruckMaintenanceHistory from "@/components/admin/TruckMaintenanceHistory";

type TruckRow = Tables<"trucks">;

const statusLabels: Record<string, string> = {
  available: "Вільний",
  in_transit: "В рейсі",
  maintenance: "На ТО",
};

const statusColors: Record<string, string> = {
  available: "bg-green-500/20 text-green-400",
  in_transit: "bg-orange-500/20 text-orange-400",
  maintenance: "bg-red-500/20 text-red-400",
};

export default function AdminFleet() {
  const [trucks, setTrucks] = useState<TruckRow[]>([]);
  const [historyTruck, setHistoryTruck] = useState<TruckRow | null>(null);

  useEffect(() => {
    supabase.from("trucks").select("*").order("plate_number").then(({ data }) => {
      setTrucks(data ?? []);
    });
  }, []);

  const getServiceHealth = (truck: TruckRow) => {
    const mileage = truck.mileage ?? 0;
    const lastServiceMileage = (truck as any).last_service_mileage ?? 0;
    const kmSinceService = mileage - lastServiceMileage;
    const needsService = kmSinceService >= 30000;
    return { kmSinceService, needsService };
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <Truck className="w-6 h-6 text-secondary" /> Автопарк
      </h1>

      {trucks.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Автопарк порожній. Додайте вантажівки через базу даних.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trucks.map((truck) => {
            const consumption = truck.fuel_consumption ?? 33;
            const efficiency = consumption <= 33 ? "Норма" : "Вище норми";
            const effColor = consumption <= 33 ? "text-green-400" : "text-orange-400";
            const { kmSinceService, needsService } = getServiceHealth(truck);

            return (
              <div key={truck.id} className={`rounded-xl border bg-card p-5 space-y-3 ${
                needsService ? "border-red-500/50" : "border-border"
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-lg">{truck.plate_number}</p>
                    <p className="text-sm text-muted-foreground">{truck.model}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[truck.status] || ""}`}>
                      {statusLabels[truck.status] || truck.status}
                    </span>
                    {needsService && (
                      <span className="flex items-center gap-1 text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">
                        <AlertTriangle className="w-3 h-3" />
                        Потребує ТО
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Пробіг</p>
                      <p className="font-medium">{(truck.mileage ?? 0).toLocaleString("uk-UA")} км</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground text-xs">Після ТО</p>
                      <p className={`font-medium ${needsService ? "text-red-400" : ""}`}>
                        {kmSinceService.toLocaleString("uk-UA")} км
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border text-xs">
                  <span className="text-muted-foreground">Витрата: </span>
                  <span className="font-medium">{consumption} л/100км</span>
                  <span className={`ml-2 ${effColor}`}>({efficiency})</span>
                </div>

                <Button size="sm" variant="outline" className="w-full gap-2" onClick={() => setHistoryTruck(truck)}>
                  <History className="w-3.5 h-3.5" /> Історія ТО
                </Button>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!historyTruck} onOpenChange={(o) => !o && setHistoryTruck(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {historyTruck?.plate_number} {historyTruck?.model ? `— ${historyTruck.model}` : ""}
            </DialogTitle>
            <DialogDescription>Технічна історія машини</DialogDescription>
          </DialogHeader>
          {historyTruck && (
            <TruckMaintenanceHistory
              truck={{
                id: historyTruck.id,
                plate_number: historyTruck.plate_number,
                model: historyTruck.model,
                mileage: historyTruck.mileage,
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
