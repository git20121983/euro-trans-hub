import { useEffect, useState, useMemo, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Wrench, Plus, Loader2, Trash2, Search } from "lucide-react";
import { toast } from "sonner";
import MaintenanceLogModal from "@/components/admin/MaintenanceLogModal";
import TruckMaintenanceHistory from "@/components/admin/TruckMaintenanceHistory";
import { MAINTENANCE_CATEGORY_LIST } from "@/lib/maintenanceCategories";

interface Truck { id: string; plate_number: string; model: string | null; mileage: number | null }
interface LogRow {
  id: string;
  vehicle_id: string;
  maintenance_date: string;
  current_mileage: number | null;
  category: string;
  sub_category: string | null;
  cost: number;
  notes: string | null;
}

const fmt = (n: number) => n.toLocaleString("uk-UA", { maximumFractionDigits: 0 });

export default function AdminMaintenance() {
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAdd, setOpenAdd] = useState(false);
  const [filterTruck, setFilterTruck] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [historyTruck, setHistoryTruck] = useState<Truck | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [{ data: t }, { data: l }] = await Promise.all([
      supabase.from("trucks").select("id,plate_number,model,mileage").order("plate_number"),
      supabase.from("maintenance_logs").select("*").order("maintenance_date", { ascending: false }),
    ]);
    setTrucks((t as Truck[]) ?? []);
    setLogs((l as LogRow[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const ch = supabase
      .channel("maintenance-all")
      .on("postgres_changes", { event: "*", schema: "public", table: "maintenance_logs" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchAll]);

  const truckMap = useMemo(() => {
    const m = new Map<string, Truck>();
    trucks.forEach((t) => m.set(t.id, t));
    return m;
  }, [trucks]);

  const filtered = useMemo(() => {
    return logs.filter((x) => {
      if (filterTruck !== "all" && x.vehicle_id !== filterTruck) return false;
      if (filterCategory !== "all" && x.category !== filterCategory) return false;
      if (search) {
        const t = truckMap.get(x.vehicle_id);
        const hay = `${t?.plate_number ?? ""} ${t?.model ?? ""} ${x.category} ${x.sub_category ?? ""} ${x.notes ?? ""}`.toLowerCase();
        if (!hay.includes(search.toLowerCase())) return false;
      }
      return true;
    });
  }, [logs, filterTruck, filterCategory, search, truckMap]);

  const totalCost = filtered.reduce((s, x) => s + Number(x.cost || 0), 0);

  const remove = async (id: string) => {
    if (!confirm("Видалити цей запис?")) return;
    const { error } = await supabase.from("maintenance_logs").delete().eq("id", id);
    if (error) toast.error("Не вдалося видалити"); else toast.success("Запис видалено");
  };

  return (
    <div className="h-full overflow-auto space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Wrench className="w-6 h-6 text-secondary" /> Обслуговування машин
        </h1>
        <Button onClick={() => setOpenAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Додати запис про ТО
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase">Записів</p>
          <p className="text-xl font-bold">{filtered.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase">Сума витрат</p>
          <p className="text-xl font-bold text-secondary">{fmt(totalCost)} ₴</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase">Машин у парку</p>
          <p className="text-xl font-bold">{trucks.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase">Сер. чек</p>
          <p className="text-xl font-bold">{filtered.length ? fmt(totalCost / filtered.length) : 0} ₴</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Пошук..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterTruck} onValueChange={setFilterTruck}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Усі машини</SelectItem>
            {trucks.map((t) => <SelectItem key={t.id} value={t.id}>{t.plate_number}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Усі категорії</SelectItem>
            {MAINTENANCE_CATEGORY_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">Записів не знайдено</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/30 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left p-3">Дата</th>
                  <th className="text-left p-3">Машина</th>
                  <th className="text-left p-3">Категорія</th>
                  <th className="text-left p-3">Деталізація</th>
                  <th className="text-right p-3">Пробіг</th>
                  <th className="text-right p-3">Сума</th>
                  <th className="text-left p-3">Коментар</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((x) => {
                  const t = truckMap.get(x.vehicle_id);
                  return (
                    <tr key={x.id} className="border-t border-border hover:bg-muted/10">
                      <td className="p-3 whitespace-nowrap">{new Date(x.maintenance_date).toLocaleDateString("uk-UA")}</td>
                      <td className="p-3">
                        <button
                          className="text-left font-medium hover:text-secondary"
                          onClick={() => t && setHistoryTruck(t)}
                        >
                          {t?.plate_number ?? "—"}
                        </button>
                        {t?.model && <div className="text-[11px] text-muted-foreground">{t.model}</div>}
                      </td>
                      <td className="p-3">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary/15 text-secondary font-medium">
                          {x.category}
                        </span>
                      </td>
                      <td className="p-3 text-muted-foreground">{x.sub_category ?? "—"}</td>
                      <td className="p-3 text-right whitespace-nowrap">{x.current_mileage != null ? `${fmt(x.current_mileage)} км` : "—"}</td>
                      <td className="p-3 text-right font-semibold whitespace-nowrap">{fmt(Number(x.cost))} ₴</td>
                      <td className="p-3 text-xs text-muted-foreground max-w-[260px] truncate">{x.notes ?? "—"}</td>
                      <td className="p-3">
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-red-400 hover:text-red-500" onClick={() => remove(x.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <MaintenanceLogModal open={openAdd} onOpenChange={setOpenAdd} trucks={trucks} onSaved={fetchAll} />

      <Dialog open={!!historyTruck} onOpenChange={(o) => !o && setHistoryTruck(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {historyTruck?.plate_number} {historyTruck?.model ? `— ${historyTruck.model}` : ""}
            </DialogTitle>
            <DialogDescription>Технічна історія машини</DialogDescription>
          </DialogHeader>
          {historyTruck && <TruckMaintenanceHistory truck={historyTruck} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
