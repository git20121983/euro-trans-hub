import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, Phone, Truck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;

const statusLabels: Record<string, string> = {
  available: "Вільний",
  on_trip: "У рейсі",
  day_off: "Вихідний",
  sick_leave: "Лікарняний",
};

const statusColors: Record<string, string> = {
  available: "bg-green-500/20 text-green-400",
  on_trip: "bg-orange-500/20 text-orange-400",
  day_off: "bg-blue-500/20 text-blue-400",
  sick_leave: "bg-red-500/20 text-red-400",
};

export default function AdminDrivers() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Tables<"trucks">[]>([]);

  useEffect(() => {
    Promise.all([
      supabase.from("drivers").select("*").order("full_name"),
      supabase.from("trucks").select("*"),
    ]).then(([driversRes, trucksRes]) => {
      setDrivers(driversRes.data ?? []);
      setTrucks(trucksRes.data ?? []);
    });
  }, []);

  const getTruck = (truckId: string | null) =>
    trucks.find((t) => t.id === truckId);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold flex items-center gap-2">
        <Users className="w-6 h-6 text-secondary" /> Водії
      </h1>

      {drivers.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
          Водіїв не знайдено. Додайте через базу даних.
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium text-muted-foreground">ПІБ</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Телефон</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Статус</th>
                <th className="text-left p-4 font-medium text-muted-foreground">Закріплене авто</th>
              </tr>
            </thead>
            <tbody>
              {drivers.map((driver) => {
                const truck = getTruck(driver.assigned_truck_id);
                return (
                  <tr key={driver.id} className="border-b border-border last:border-0 hover:bg-muted/10 transition-colors">
                    <td className="p-4 font-medium">{driver.full_name}</td>
                    <td className="p-4">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <Phone className="w-3 h-3" /> {driver.phone}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[driver.status] || ""}`}>
                        {statusLabels[driver.status] || driver.status}
                      </span>
                    </td>
                    <td className="p-4">
                      {truck ? (
                        <span className="flex items-center gap-1 text-xs">
                          <Truck className="w-3 h-3 text-secondary" />
                          {truck.plate_number} ({truck.model})
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">—</span>
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
