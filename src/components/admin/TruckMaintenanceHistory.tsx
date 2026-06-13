import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, Wrench, Plus } from "lucide-react";
import { toast } from "sonner";
import MaintenanceLogModal from "./MaintenanceLogModal";

interface Props {
  truck: { id: string; plate_number: string; model: string | null; mileage: number | null };
}

interface LogRow {
  id: string;
  maintenance_date: string;
  current_mileage: number | null;
  category: string;
  sub_category: string | null;
  cost: number;
  notes: string | null;
}

const fmt = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 0 });

export default function TruckMaintenanceHistory({ truck }: Props) {
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("maintenance_logs")
      .select("id,maintenance_date,current_mileage,category,sub_category,cost,notes")
      .eq("vehicle_id", truck.id)
      .order("maintenance_date", { ascending: false });
    setLogs((data as LogRow[]) ?? []);
    setLoading(false);
  }, [truck.id]);

  useEffect(() => {
    fetchLogs();
    const ch = supabase
      .channel(`maint-${truck.id}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "maintenance_logs", filter: `vehicle_id=eq.${truck.id}` },
        () => fetchLogs())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [truck.id, fetchLogs]);

  const total = logs.reduce((s, x) => s + Number(x.cost || 0), 0);

  const remove = async (id: string) => {
    if (!confirm("Видалити цей запис?")) return;
    const { error } = await supabase.from("maintenance_logs").delete().eq("id", id);
    if (error) toast.error("Не вдалося видалити"); else toast.success("Запис видалено");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-secondary" />
          <p className="text-sm font-semibold">Історія ТО та ремонтів</p>
        </div>
        <Button size="sm" onClick={() => setOpenAdd(true)} className="gap-2">
          <Plus className="w-3.5 h-3.5" /> Додати
        </Button>
      </div>

      <div className="p-3 rounded-lg bg-muted/20 border border-border">
        <p className="text-[10px] text-muted-foreground uppercase">Усього витрачено на машину</p>
        <p className="text-lg font-bold text-secondary">{fmt(total)} ₴</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-6"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : logs.length === 0 ? (
        <p className="text-xs text-center py-6 text-muted-foreground">Записів про обслуговування немає</p>
      ) : (
        <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
          {logs.map((x) => (
            <div key={x.id} className="p-3 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                      {x.category}
                    </span>
                    {x.sub_category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                        {x.sub_category}
                      </span>
                    )}
                    <span className="text-sm font-semibold">{fmt(Number(x.cost))} ₴</span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground flex gap-3 flex-wrap">
                    <span>{new Date(x.maintenance_date).toLocaleDateString("uk-UA")}</span>
                    {x.current_mileage != null && <span>{fmt(x.current_mileage)} км</span>}
                  </div>
                  {x.notes && <p className="text-xs text-foreground mt-1 break-words">{x.notes}</p>}
                </div>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => remove(x.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <MaintenanceLogModal
        open={openAdd}
        onOpenChange={setOpenAdd}
        trucks={[truck]}
        defaultVehicleId={truck.id}
        onSaved={fetchLogs}
      />
    </div>
  );
}
