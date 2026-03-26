import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Truck, Wrench, Gauge } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

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

  useEffect(() => {
    supabase.from("trucks").select("*").order("plate_number").then(({ data }) => {
      setTrucks(data ?? []);
    });
  }, []);

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

            return (
              <div key={truck.id} className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-display font-bold text-lg">{truck.plate_number}</p>
                    <p className="text-sm text-muted-foreground">{truck.model}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[truck.status] || ""}`}>
                    {statusLabels[truck.status] || truck.status}
                  </span>
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
                      <p className="text-muted-foreground text-xs">Наступне ТО</p>
                      <p className="font-medium">{truck.next_service || "—"}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border text-xs">
                  <span className="text-muted-foreground">Витрата: </span>
                  <span className="font-medium">{consumption} л/100км</span>
                  <span className={`ml-2 ${effColor}`}>({efficiency})</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
