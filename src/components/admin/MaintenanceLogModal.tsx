import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { MAINTENANCE_CATEGORIES, MAINTENANCE_CATEGORY_LIST } from "@/lib/maintenanceCategories";

interface Truck { id: string; plate_number: string; model: string | null; mileage: number | null }

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  trucks: Truck[];
  defaultVehicleId?: string;
  onSaved?: () => void;
}

export default function MaintenanceLogModal({ open, onOpenChange, trucks, defaultVehicleId, onSaved }: Props) {
  const [vehicleId, setVehicleId] = useState<string>(defaultVehicleId ?? "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState<string>("");
  const [category, setCategory] = useState<string>(MAINTENANCE_CATEGORY_LIST[0]);
  const [subCategory, setSubCategory] = useState<string>(MAINTENANCE_CATEGORIES[MAINTENANCE_CATEGORY_LIST[0]][0]);
  const [cost, setCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setVehicleId(defaultVehicleId ?? trucks[0]?.id ?? "");
      setDate(new Date().toISOString().slice(0, 10));
      setMileage("");
      setCategory(MAINTENANCE_CATEGORY_LIST[0]);
      setSubCategory(MAINTENANCE_CATEGORIES[MAINTENANCE_CATEGORY_LIST[0]][0]);
      setCost("");
      setNotes("");
    }
  }, [open, defaultVehicleId, trucks]);

  useEffect(() => {
    const truck = trucks.find((t) => t.id === vehicleId);
    if (truck && !mileage) setMileage(String(truck.mileage ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  useEffect(() => {
    setSubCategory(MAINTENANCE_CATEGORIES[category]?.[0] ?? "");
  }, [category]);

  const save = async () => {
    if (!vehicleId) { toast.error("Оберіть машину"); return; }
    const costNum = parseFloat(cost);
    if (!costNum || costNum <= 0) { toast.error("Вкажіть суму витрат"); return; }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("maintenance_logs").insert({
      vehicle_id: vehicleId,
      maintenance_date: date,
      current_mileage: mileage ? parseInt(mileage, 10) : null,
      category,
      sub_category: subCategory || null,
      cost: costNum,
      notes: notes || null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(`Помилка: ${error.message}`);
    } else {
      toast.success("Запис про ТО додано");
      onSaved?.();
      onOpenChange(false);
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Додати запис про ТО</DialogTitle>
          <DialogDescription>Технічне обслуговування та ремонт машини</DialogDescription>
        </DialogHeader>

        <div className="grid gap-3">
          <div>
            <Label className="text-xs">Машина</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Оберіть машину" /></SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.plate_number} {t.model ? `— ${t.model}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Дата обслуговування</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">Пробіг, км</Label>
              <Input type="number" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="0" className="mt-1" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Категорія</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {MAINTENANCE_CATEGORY_LIST.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Деталізація</Label>
              <Select value={subCategory} onValueChange={setSubCategory}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {(MAINTENANCE_CATEGORIES[category] ?? []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Сума витрат, ₴</Label>
            <Input type="number" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className="mt-1" />
          </div>

          <div>
            <Label className="text-xs">Коментар / що саме замінено</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1" placeholder="Опис робіт, артикулі, СТО..." />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Скасувати</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
