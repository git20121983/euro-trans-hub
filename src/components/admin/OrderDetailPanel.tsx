import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Clock, FileText, Upload, MapPin, User, Phone,
  Package, Truck, Loader2, Download, File, DollarSign,
  Fuel, AlertTriangle, Trash2, Save, Wallet,
} from "lucide-react";
import { toast } from "sonner";
import ExpensesPanel, { toUah } from "@/components/expenses/ExpensesPanel";
import DemurrageTimer from "@/components/demurrage/DemurrageTimer";
import { getDemurrageSettings, LEG_LABEL } from "@/lib/demurrage";

interface DriverOption {
  id: string;
  full_name: string;
}

type Order = Tables<"orders">;

interface OrderEvent {
  id: string;
  order_id: string;
  user_id: string | null;
  event_type: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface StorageFile {
  name: string;
  id: string;
  created_at: string;
}

interface OrderDetailPanelProps {
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  driverName: string | null;
  truckPlate?: string | null;
  onOrderUpdate?: () => void;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  new: { label: "Нове", color: "bg-blue-500" },
  planning: { label: "Планування", color: "bg-cyan-500" },
  in_transit: { label: "В дорозі", color: "bg-orange-500" },
  customs: { label: "Митниця", color: "bg-violet-500" },
  unloading: { label: "Розвантаження", color: "bg-yellow-500" },
  awaiting_payment: { label: "Очікує оплати", color: "bg-purple-500" },
  completed: { label: "Завершено", color: "bg-green-500" },
};

const FUEL_RATE = 33; // л/100км
const DRIVER_SALARY_RATE = 6; // грн/км

export default function OrderDetailPanel({ order, open, onOpenChange, driverName, truckPlate, onOrderUpdate }: OrderDetailPanelProps) {
  const [events, setEvents] = useState<OrderEvent[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [actualFuelCost, setActualFuelCost] = useState("");
  const [tollCost, setTollCost] = useState("");
  const [allowanceAmount, setAllowanceAmount] = useState("");
  const [savingAllowance, setSavingAllowance] = useState(false);
  const [savingFinance, setSavingFinance] = useState(false);
  const [drivers, setDrivers] = useState<DriverOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string>("none");
  const [savingDriver, setSavingDriver] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [freeHoursInput, setFreeHoursInput] = useState("4");
  const [demurrageRateInput, setDemurrageRateInput] = useState("25");
  const [savingDemurrage, setSavingDemurrage] = useState(false);

  useEffect(() => {
    if (!order || !open) return;
    fetchEvents();
    fetchFiles();
    fetchDrivers();
    setActualFuelCost(order.actual_fuel_cost?.toString() ?? "");
    setTollCost(order.toll_cost?.toString() ?? "0");
    setAllowanceAmount(((order as unknown as { allowance_amount?: number }).allowance_amount ?? 0).toString());
    setSelectedDriverId(order.driver_id ?? "none");
    const d = getDemurrageSettings(order);
    setFreeHoursInput(String(d.freeHours));
    setDemurrageRateInput(String(d.rate));
  }, [order?.id, open]);

  const saveDemurrageSettings = async () => {
    if (!order) return;
    setSavingDemurrage(true);
    const { error } = await supabase
      .from("orders")
      .update({
        free_hours: parseFloat(freeHoursInput || "0"),
        demurrage_rate: parseFloat(demurrageRateInput || "0"),
      })
      .eq("id", order.id);
    if (error) toast.error("Помилка збереження умов простою");
    else {
      toast.success("Умови простою оновлено");
      onOrderUpdate?.();
    }
    setSavingDemurrage(false);
  };


  const fetchDrivers = async () => {
    const { data } = await supabase
      .from("drivers")
      .select("id, full_name")
      .order("full_name", { ascending: true });
    setDrivers((data as DriverOption[]) ?? []);
  };


  const fetchEvents = async () => {
    if (!order) return;
    setLoadingEvents(true);
    const { data } = await supabase
      .from("order_events")
      .select("*")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false });
    setEvents((data as OrderEvent[]) ?? []);
    setLoadingEvents(false);
  };

  const fetchFiles = async () => {
    if (!order) return;
    setLoadingFiles(true);
    const { data } = await supabase.storage
      .from("order-documents")
      .list(order.id, { limit: 100, sortBy: { column: "created_at", order: "desc" } });
    setFiles((data as StorageFile[]) ?? []);
    setLoadingFiles(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !order) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${order.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("order-documents")
      .upload(path, file, { cacheControl: "3600" });
    if (error) {
      toast.error("Помилка завантаження");
    } else {
      toast.success("Документ завантажено!");
      await supabase.from("order_events").insert({
        order_id: order.id,
        event_type: "document_upload",
        description: `Завантажено документ: ${file.name}`,
      });
      fetchFiles();
      fetchEvents();
    }
    setUploading(false);
    e.target.value = "";
  };

  const getFileUrl = (fileName: string) => {
    if (!order) return "";
    const { data } = supabase.storage
      .from("order-documents")
      .getPublicUrl(`${order.id}/${fileName}`);
    return data.publicUrl;
  };

  const isImage = (name: string) =>
    /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(name);

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("uk-UA", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  // Finance calculations
  const distance = order?.distance ? Number(order.distance) : 0;
  const fuelPrice = order?.fuel_price ? Number(order.fuel_price) : 55;
  const plannedFuelCost = (distance / 100) * FUEL_RATE * fuelPrice;
  const driverSalary = distance * DRIVER_SALARY_RATE;
  const toll = order?.toll_cost ? Number(order.toll_cost) : 0;
  const freight = order?.total_price ? Number(order.total_price) : 0;
  const demurrageSettings = getDemurrageSettings(order);
  const demurrageAmount = Number(order?.demurrage_amount ?? 0);
  const demurrageUah = toUah(demurrageAmount, demurrageSettings.currency);
  const totalPrice = freight + demurrageUah;
  const totalExpenses = plannedFuelCost + driverSalary + toll;
  const netProfit = totalPrice - totalExpenses;
  const margin = totalPrice > 0 ? (netProfit / totalPrice) * 100 : 0;

  const actualFuel = order?.actual_fuel_cost ? Number(order.actual_fuel_cost) : null;
  const fuelOverspend = actualFuel !== null ? ((actualFuel - plannedFuelCost) / plannedFuelCost) * 100 : null;

  const saveFinanceData = async () => {
    if (!order) return;
    setSavingFinance(true);
    const { error } = await supabase
      .from("orders")
      .update({
        actual_fuel_cost: actualFuelCost ? parseFloat(actualFuelCost) : null,
        toll_cost: tollCost ? parseFloat(tollCost) : 0,
        fuel_cost: plannedFuelCost,
        driver_salary: driverSalary,
        net_profit: netProfit,
      })
      .eq("id", order.id);
    if (error) {
      toast.error("Помилка збереження");
    } else {
      toast.success("Фінанси оновлено!");
      onOrderUpdate?.();
    }
    setSavingFinance(false);
  };

  const saveAllowance = async () => {
    if (!order) return;
    setSavingAllowance(true);
    const value = allowanceAmount ? parseFloat(allowanceAmount) : 0;
    const { error } = await supabase
      .from("orders")
      .update({ allowance_amount: value } as never)
      .eq("id", order.id);
    if (error) toast.error("Помилка збереження авансу");
    else {
      toast.success("Аванс збережено");
      onOrderUpdate?.();
    }
    setSavingAllowance(false);
  };

  const saveDriverAssignment = async () => {
    if (!order) return;
    setSavingDriver(true);
    const newDriverId = selectedDriverId === "none" ? null : selectedDriverId;
    const { error } = await supabase
      .from("orders")
      .update({ driver_id: newDriverId })
      .eq("id", order.id);
    if (error) {
      toast.error("Помилка зміни водія");
    } else {
      const name = newDriverId
        ? drivers.find((d) => d.id === newDriverId)?.full_name ?? "—"
        : "Не призначено";
      toast.success(`Водія оновлено: ${name}`);
      await supabase.from("order_events").insert({
        order_id: order.id,
        event_type: "driver_change",
        description: `Водій змінено: ${name}`,
      });
      onOrderUpdate?.();
    }
    setSavingDriver(false);
  };

  const deleteOrder = async () => {
    if (!order) return;
    setDeleting(true);
    const { error } = await supabase.from("orders").delete().eq("id", order.id);
    if (error) {
      toast.error("Помилка видалення рейсу");
      setDeleting(false);
    } else {
      toast.success(`Рейс ${order.order_number} видалено`);
      setDeleting(false);
      onOpenChange(false);
      onOrderUpdate?.();
    }
  };

  const statusInfo = order ? STATUS_LABELS[order.status] ?? { label: order.status, color: "bg-muted" } : null;


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        {order && (
          <>
            <SheetHeader className="pb-4 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{order.order_number}</span>
                {statusInfo && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full text-white ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                )}
              </div>
              <SheetTitle className="text-left">{order.client_name}</SheetTitle>
            </SheetHeader>

            <div className="py-4 space-y-3 border-b border-border">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-green-400" />
                  <span>{order.origin}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5 text-red-400" />
                  <span>{order.destination}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Package className="w-3.5 h-3.5" />
                  <span>{order.distance} км • {order.cargo_type}</span>
                </div>
                {driverName && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="w-3.5 h-3.5" />
                    <span>{driverName}</span>
                  </div>
                )}
                {truckPlate && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Truck className="w-3.5 h-3.5" />
                    <span>{truckPlate}</span>
                  </div>
                )}
                {order.client_phone && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="w-3.5 h-3.5" />
                    <span>{order.client_phone}</span>
                  </div>
                )}
                {totalPrice > 0 && (
                  <div className="flex items-center gap-2 font-semibold text-green-400">
                    <span>{totalPrice.toLocaleString("uk-UA")} ₴</span>
                  </div>
                )}
              </div>
              {order.notes && (
                <p className="text-xs text-muted-foreground bg-muted/30 p-2 rounded-lg">
                  {order.notes}
                </p>
              )}
            </div>

            <Tabs defaultValue="details" className="mt-4">
              <TabsList className="w-full">
                <TabsTrigger value="details" className="flex-1 gap-1 text-xs">
                  <Package className="w-3.5 h-3.5" />
                  Деталі
                </TabsTrigger>
                <TabsTrigger value="timeline" className="flex-1 gap-1 text-xs">
                  <Clock className="w-3.5 h-3.5" />
                  Історія
                </TabsTrigger>
                <TabsTrigger value="documents" className="flex-1 gap-1 text-xs">
                  <FileText className="w-3.5 h-3.5" />
                  Docs ({files.length})
                </TabsTrigger>
                <TabsTrigger value="finance" className="flex-1 gap-1 text-xs">
                  <DollarSign className="w-3.5 h-3.5" />
                  Фінанси
                </TabsTrigger>
              </TabsList>

              {/* Details */}
              <TabsContent value="details" className="mt-4 space-y-3">
                {/* Editable driver assignment */}
                <div className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                  <Label className="text-[10px] text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <User className="w-3 h-3" /> Водій
                  </Label>
                  <div className="flex gap-2">
                    <Select value={selectedDriverId} onValueChange={setSelectedDriverId}>
                      <SelectTrigger className="flex-1 bg-background text-foreground">
                        <SelectValue placeholder="Оберіть водія" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Не призначено</SelectItem>
                        {drivers.map((d) => (
                          <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      onClick={saveDriverAssignment}
                      disabled={savingDriver || selectedDriverId === (order.driver_id ?? "none")}
                      className="gap-1"
                    >
                      {savingDriver ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Зберегти
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Тип вантажу", value: order.cargo_type },
                    { label: "Вага", value: order.cargo_weight ? `${order.cargo_weight} т` : "—" },
                    { label: "Відстань", value: `${order.distance} км` },
                    { label: "Авто", value: truckPlate ?? "Не призначено" },
                    { label: "Створено", value: formatDate(order.created_at) },
                  ].map((item) => (
                    <div key={item.label} className="p-2 rounded-lg bg-muted/20 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">{item.label}</p>
                      <p className="text-sm font-medium mt-0.5 text-foreground">{item.value}</p>
                    </div>
                  ))}
                </div>

                {/* Danger zone */}
                <div className="pt-3 mt-3 border-t border-border">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="w-full gap-2" disabled={deleting}>
                        <Trash2 className="w-4 h-4" />
                        {deleting ? "Видалення..." : "Видалити рейс"}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Видалити рейс?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Ви впевнені, що хочете видалити рейс {order.order_number}? Цю дію неможливо скасувати.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Скасувати</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={deleteOrder}
                          className="bg-red-500 hover:bg-red-600 text-white"
                        >
                          Видалити
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TabsContent>


              {/* Timeline */}
              <TabsContent value="timeline" className="mt-4">
                {loadingEvents ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Подій поки немає
                  </div>
                ) : (
                  <div className="relative space-y-0">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border" />
                    {events.map((ev) => {
                      const isStatus = ev.event_type === "status_change";
                      const isDoc = ev.event_type === "document_upload";
                      return (
                        <div key={ev.id} className="relative flex gap-3 pb-4">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                            isStatus ? "bg-secondary/20 text-secondary" :
                            isDoc ? "bg-blue-500/20 text-blue-400" :
                            "bg-muted text-muted-foreground"
                          }`}>
                            {isStatus ? <Truck className="w-3 h-3" /> :
                             isDoc ? <FileText className="w-3 h-3" /> :
                             <Clock className="w-3 h-3" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{ev.description}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {formatDate(ev.created_at)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Documents */}
              <TabsContent value="documents" className="mt-4 space-y-3">
                <label className="block">
                  <Button variant="outline" className="w-full gap-2" disabled={uploading} asChild>
                    <span>
                      <Upload className="w-4 h-4" />
                      {uploading ? "Завантаження..." : "Завантажити документ (ТТН, CMR)"}
                      <input
                        type="file"
                        accept="image/*,.pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileUpload}
                      />
                    </span>
                  </Button>
                </label>

                {loadingFiles ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : files.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">
                    Документів поки немає
                  </div>
                ) : (
                  <div className="space-y-2">
                    {files.map((file) => {
                      const url = getFileUrl(file.name);
                      const img = isImage(file.name);
                      return (
                        <div key={file.id ?? file.name} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors">
                          {img ? (
                            <div className="w-12 h-12 rounded overflow-hidden bg-muted flex-shrink-0">
                              <img src={url} alt={file.name} className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="w-12 h-12 rounded bg-muted flex items-center justify-center flex-shrink-0">
                              <File className="w-5 h-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {formatDate(file.created_at)}
                            </p>
                          </div>
                          <a href={url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Download className="w-4 h-4" />
                            </Button>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* Finance */}
              <TabsContent value="finance" className="mt-4 space-y-4">
                {/* Driver allowance */}
                <div className="space-y-2 p-3 rounded-lg border border-border bg-muted/10">
                  <Label className="text-xs flex items-center gap-1.5 text-muted-foreground uppercase tracking-wider">
                    <Wallet className="w-3 h-3" /> Видано аванс водію, ₴
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      inputMode="decimal"
                      value={allowanceAmount}
                      onChange={(e) => setAllowanceAmount(e.target.value)}
                      placeholder="0"
                    />
                    <Button size="sm" onClick={saveAllowance} disabled={savingAllowance} className="gap-1">
                      {savingAllowance ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                      Зберегти
                    </Button>
                  </div>
                </div>

                {/* Trip expenses */}
                <div className="pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                    Дорожні витрати
                  </p>
                  <ExpensesPanel
                    orderId={order.id}
                    driverId={order.driver_id}
                    allowance={parseFloat(allowanceAmount || "0")}
                    canAdd
                  />
                </div>

                {/* Demurrage / простій */}
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Простій (демередж)
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Безкоштовні години</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="mt-1"
                        value={freeHoursInput}
                        onChange={(e) => setFreeHoursInput(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Ставка, {demurrageSettings.currency}/год</Label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        className="mt-1"
                        value={demurrageRateInput}
                        onChange={(e) => setDemurrageRateInput(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full gap-1" onClick={saveDemurrageSettings} disabled={savingDemurrage}>
                    {savingDemurrage ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    Зберегти умови простою
                  </Button>

                  {(["loading", "unloading"] as const).map((leg) => {
                    const o = order as unknown as Record<string, string | null>;
                    const arrivedAt = o[`${leg}_arrived_at`];
                    if (!arrivedAt) return null;
                    return (
                      <DemurrageTimer
                        key={leg}
                        label={LEG_LABEL[leg]}
                        arrivedAt={arrivedAt}
                        finishedAt={o[`${leg}_finished_at`]}
                        freeHours={parseFloat(freeHoursInput || "0")}
                        rate={parseFloat(demurrageRateInput || "0")}
                        currency={demurrageSettings.currency}
                      />
                    );
                  })}

                  {demurrageAmount > 0 ? (
                    <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                      <p className="text-[10px] uppercase text-muted-foreground">До рахунку клієнта</p>
                      <p className="text-sm font-semibold text-amber-300">
                        +{demurrageAmount.toLocaleString("uk-UA")} {demurrageSettings.currency}
                        {" "}≈ {demurrageUah.toLocaleString("uk-UA", { maximumFractionDigits: 0 })} ₴
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Простій {Number((order as unknown as { demurrage_hours?: number }).demurrage_hours ?? 0)} год понад ліміт
                      </p>
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Простою немає — додаткових нарахувань не буде.</p>
                  )}
                </div>


                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Планові витрати
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <Fuel className="w-3 h-3" />
                        <span className="text-[10px] uppercase">Паливо (план)</span>
                      </div>
                      <p className="text-sm font-semibold">{plannedFuelCost.toLocaleString("uk-UA", { maximumFractionDigits: 0 })} ₴</p>
                      <p className="text-[10px] text-muted-foreground">{FUEL_RATE} л/100км × {fuelPrice} ₴/л</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/20 border border-border">
                      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
                        <User className="w-3 h-3" />
                        <span className="text-[10px] uppercase">ЗП водія</span>
                      </div>
                      <p className="text-sm font-semibold">{driverSalary.toLocaleString("uk-UA")} ₴</p>
                      <p className="text-[10px] text-muted-foreground">{DRIVER_SALARY_RATE} ₴/км × {distance} км</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-3 rounded-lg bg-muted/20 border border-border">
                      <p className="text-[10px] text-muted-foreground uppercase">Дохід</p>
                      <p className="text-sm font-semibold text-green-400">{totalPrice.toLocaleString("uk-UA")} ₴</p>
                    </div>
                    <div className={`p-3 rounded-lg border ${netProfit >= 0 ? "bg-green-500/5 border-green-500/20" : "bg-red-500/5 border-red-500/20"}`}>
                      <p className="text-[10px] text-muted-foreground uppercase">Чистий прибуток</p>
                      <p className={`text-sm font-semibold ${netProfit >= 0 ? "text-green-400" : "text-red-400"}`}>
                        {netProfit.toLocaleString("uk-UA", { maximumFractionDigits: 0 })} ₴
                      </p>
                      <p className="text-[10px] text-muted-foreground">Маржа: {margin.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-border">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Фактичні витрати
                  </p>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs">Фактичні витрати на паливо, ₴</Label>
                      <Input
                        type="number"
                        placeholder={plannedFuelCost.toFixed(0)}
                        value={actualFuelCost}
                        onChange={(e) => setActualFuelCost(e.target.value)}
                        className="mt-1"
                      />
                      {actualFuelCost && fuelOverspend !== null && (
                        <div className={`flex items-center gap-1 mt-1 text-xs ${
                          fuelOverspend > 5 ? "text-red-400" : fuelOverspend > 0 ? "text-yellow-400" : "text-green-400"
                        }`}>
                          {fuelOverspend > 5 && <AlertTriangle className="w-3 h-3" />}
                          <span>
                            {fuelOverspend > 0 ? `+${fuelOverspend.toFixed(1)}% перевитрата` : `${fuelOverspend.toFixed(1)}% економія`}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Дорожні збори (toll), ₴</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={tollCost}
                        onChange={(e) => setTollCost(e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <Button onClick={saveFinanceData} disabled={savingFinance} className="w-full" size="sm">
                      {savingFinance ? "Збереження..." : "Зберегти фінанси"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
