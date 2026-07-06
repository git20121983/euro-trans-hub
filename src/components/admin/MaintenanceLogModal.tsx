import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectSeparator,
} from "@/components/ui/select";
import { Loader2, Plus } from "lucide-react";
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

const CUSTOM_VAL = "__custom__";
const LS_CAT_KEY = "maint:customCategories";
const LS_SUB_KEY = "maint:customSubCategories"; // {[parentCat]: string[]}

function loadCustomCats(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_CAT_KEY) || "[]"); } catch { return []; }
}
function loadCustomSubs(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(LS_SUB_KEY) || "{}"); } catch { return {}; }
}
function saveCustomCat(c: string) {
  const list = loadCustomCats();
  if (!list.includes(c)) {
    list.push(c);
    localStorage.setItem(LS_CAT_KEY, JSON.stringify(list));
  }
}
function saveCustomSub(parent: string, s: string) {
  const all = loadCustomSubs();
  const list = all[parent] || [];
  if (!list.includes(s)) {
    all[parent] = [...list, s];
    localStorage.setItem(LS_SUB_KEY, JSON.stringify(all));
  }
}

export default function MaintenanceLogModal({ open, onOpenChange, trucks, defaultVehicleId, onSaved }: Props) {
  const [vehicleId, setVehicleId] = useState<string>(defaultVehicleId ?? "");
  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [mileage, setMileage] = useState<string>("");
  const [category, setCategory] = useState<string>(MAINTENANCE_CATEGORY_LIST[0]);
  const [customCategory, setCustomCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>(MAINTENANCE_CATEGORIES[MAINTENANCE_CATEGORY_LIST[0]][0]);
  const [customSubCategory, setCustomSubCategory] = useState<string>("");
  const [cost, setCost] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const [customCats, setCustomCats] = useState<string[]>([]);
  const [customSubs, setCustomSubs] = useState<Record<string, string[]>>({});

  useEffect(() => {
    if (open) {
      setCustomCats(loadCustomCats());
      setCustomSubs(loadCustomSubs());
      setVehicleId(defaultVehicleId ?? trucks[0]?.id ?? "");
      setDate(new Date().toISOString().slice(0, 10));
      setMileage("");
      setCategory(MAINTENANCE_CATEGORY_LIST[0]);
      setCustomCategory("");
      setSubCategory(MAINTENANCE_CATEGORIES[MAINTENANCE_CATEGORY_LIST[0]][0]);
      setCustomSubCategory("");
      setCost("");
      setNotes("");
    }
  }, [open, defaultVehicleId, trucks]);

  useEffect(() => {
    const truck = trucks.find((t) => t.id === vehicleId);
    if (truck && !mileage) setMileage(String(truck.mileage ?? ""));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId]);

  // When category changes, reset sub
  useEffect(() => {
    if (category === CUSTOM_VAL) {
      setSubCategory(CUSTOM_VAL);
      return;
    }
    const builtin = MAINTENANCE_CATEGORIES[category] ?? [];
    const extras = customSubs[category] ?? [];
    const first = builtin[0] ?? extras[0] ?? "";
    setSubCategory(first || CUSTOM_VAL);
    setCustomSubCategory("");
  }, [category, customSubs]);

  const allCategoryOptions = useMemo(() => {
    const merged = [...MAINTENANCE_CATEGORY_LIST];
    customCats.forEach((c) => { if (!merged.includes(c)) merged.push(c); });
    return merged;
  }, [customCats]);

  const subOptions = useMemo(() => {
    if (category === CUSTOM_VAL) return [];
    const builtin = MAINTENANCE_CATEGORIES[category] ?? [];
    const extras = customSubs[category] ?? [];
    return [...builtin, ...extras.filter((s) => !builtin.includes(s))];
  }, [category, customSubs]);

  const save = async () => {
    if (!vehicleId) { toast.error("Оберіть машину"); return; }
    const costNum = parseFloat(cost);
    if (!costNum || costNum <= 0) { toast.error("Вкажіть суму витрат"); return; }

    const finalCategory = category === CUSTOM_VAL ? customCategory.trim() : category;
    if (!finalCategory) { toast.error("Вкажіть категорію"); return; }

    const finalSub = subCategory === CUSTOM_VAL ? customSubCategory.trim() : subCategory;

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("maintenance_logs").insert({
      vehicle_id: vehicleId,
      maintenance_date: date,
      current_mileage: mileage ? parseInt(mileage, 10) : null,
      category: finalCategory,
      sub_category: finalSub || null,
      cost: costNum,
      notes: notes || null,
      created_by: user?.id ?? null,
    });
    if (error) {
      toast.error(`Помилка: ${error.message}`);
    } else {
      // Persist custom values for reuse
      if (category === CUSTOM_VAL && customCategory.trim()) {
        saveCustomCat(customCategory.trim());
      }
      if (subCategory === CUSTOM_VAL && customSubCategory.trim()) {
        saveCustomSub(finalCategory, customSubCategory.trim());
      }
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

        <div className="flex flex-col gap-4">
          {/* Vehicle */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Машина</Label>
            <Select value={vehicleId} onValueChange={setVehicleId}>
              <SelectTrigger className="h-10 px-3"><SelectValue placeholder="Оберіть машину" /></SelectTrigger>
              <SelectContent>
                {trucks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.plate_number} {t.model ? `— ${t.model}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date + Mileage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Дата обслуговування</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 px-3" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Пробіг, км</Label>
              <Input type="number" inputMode="numeric" value={mileage} onChange={(e) => setMileage(e.target.value)} placeholder="0" className="h-10 px-3" />
            </div>
          </div>

          {/* Category + Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Категорія</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10 px-3"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {allCategoryOptions.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectSeparator />
                  <SelectItem value={CUSTOM_VAL}>
                    <span className="flex items-center gap-1.5"><Plus className="w-3 h-3" /> Додати свій варіант</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {category === CUSTOM_VAL && (
                <Input
                  autoFocus
                  className="h-10 px-3 mt-1.5"
                  placeholder="Назва категорії"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              )}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs">Підкатегорія</Label>
              <Select value={subCategory} onValueChange={setSubCategory} disabled={category === CUSTOM_VAL && !customCategory.trim()}>
                <SelectTrigger className="h-10 px-3"><SelectValue placeholder="Оберіть" /></SelectTrigger>
                <SelectContent>
                  {subOptions.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  {subOptions.length > 0 && <SelectSeparator />}
                  <SelectItem value={CUSTOM_VAL}>
                    <span className="flex items-center gap-1.5"><Plus className="w-3 h-3" /> Додати свій варіант</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              {subCategory === CUSTOM_VAL && (
                <Input
                  className="h-10 px-3 mt-1.5"
                  placeholder="Назва підкатегорії"
                  value={customSubCategory}
                  onChange={(e) => setCustomSubCategory(e.target.value)}
                />
              )}
            </div>
          </div>

          {/* Cost */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Сума витрат, ₴</Label>
            <Input type="number" inputMode="decimal" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="0" className="h-10 px-3" />
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs">Коментар / що саме замінено</Label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-0 px-3 py-2" placeholder="Опис робіт, артикулі, СТО..." />
          </div>
        </div>

        <DialogFooter className="pt-4 gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Скасувати</Button>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Зберегти"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
