import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { uk } from "date-fns/locale";
import { CalendarIcon, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type Driver = Tables<"drivers">;
type Truck = Tables<"trucks">;
type Order = Tables<"orders">;

interface CreateOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const ACTIVE_STATUSES = ["new", "planning", "in_transit", "customs", "unloading"];

export default function CreateOrderModal({ open, onOpenChange, onCreated }: CreateOrderModalProps) {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // Form state
  const [clientName, setClientName] = useState("");
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [distance, setDistance] = useState("");
  const [cargoType, setCargoType] = useState("standard");
  const [cargoWeight, setCargoWeight] = useState("");
  const [driverId, setDriverId] = useState("");
  const [truckId, setTruckId] = useState("");
  const [departureDate, setDepartureDate] = useState<Date>();
  const [totalPrice, setTotalPrice] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setFetching(true);
    Promise.all([
      supabase.from("drivers").select("*").eq("status", "available"),
      supabase.from("trucks").select("*").eq("status", "available"),
      supabase.from("orders").select("id, driver_id, truck_id, status").in("status", ACTIVE_STATUSES),
    ]).then(([driversRes, trucksRes, ordersRes]) => {
      setDrivers(driversRes.data ?? []);
      setTrucks(trucksRes.data ?? []);
      setActiveOrders(ordersRes.data as Order[] ?? []);
      setFetching(false);
    });
  }, [open]);

  const busyDriverIds = useMemo(
    () => new Set(activeOrders.filter(o => o.driver_id).map(o => o.driver_id!)),
    [activeOrders]
  );
  const busyTruckIds = useMemo(
    () => new Set(activeOrders.filter(o => o.truck_id).map(o => o.truck_id!)),
    [activeOrders]
  );

  const availableDrivers = useMemo(
    () => drivers.filter(d => !busyDriverIds.has(d.id)),
    [drivers, busyDriverIds]
  );
  const availableTrucks = useMemo(
    () => trucks.filter(t => !busyTruckIds.has(t.id)),
    [trucks, busyTruckIds]
  );

  const resetForm = () => {
    setClientName(""); setOrigin(""); setDestination(""); setDistance("");
    setCargoType("standard"); setCargoWeight(""); setDriverId(""); setTruckId("");
    setDepartureDate(undefined); setTotalPrice(""); setClientPhone(""); setNotes("");
  };

  const isValid = clientName.trim() && origin.trim() && destination.trim() && Number(distance) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;

    // Double-check driver/truck not busy
    if (driverId && busyDriverIds.has(driverId)) {
      toast.error("Цей водій вже призначений на активний рейс");
      return;
    }
    if (truckId && busyTruckIds.has(truckId)) {
      toast.error("Ця машина вже на активному рейсі");
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("orders").insert({
      client_name: clientName.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      distance: Number(distance),
      cargo_type: cargoType,
      cargo_weight: cargoWeight ? Number(cargoWeight) : null,
      driver_id: driverId || null,
      truck_id: truckId || null,
      total_price: totalPrice ? Number(totalPrice) : null,
      client_phone: clientPhone.trim() || null,
      notes: notes.trim() || null,
      status: driverId ? "planning" : "new",
    });

    if (error) {
      console.error("Detailed error creating order:", error);
      toast.error(`Помилка: ${error.message || error.details || "Невідома помилка"}`);
      setLoading(false);
      return;
    }

    // Update driver/truck status if assigned
    if (driverId) {
      await supabase.from("drivers").update({ status: "on_trip" }).eq("id", driverId);
    }
    if (truckId) {
      await supabase.from("trucks").update({ status: "on_trip" }).eq("id", truckId);
    }

    toast.success("Рейс успішно створено!");
    resetForm();
    onOpenChange(false);
    onCreated();
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Створити новий рейс</DialogTitle>
          <DialogDescription>Заповніть дані для нового замовлення</DialogDescription>
        </DialogHeader>

        {fetching ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Client */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Клієнт *</Label>
                <Input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Назва клієнта" />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон</Label>
                <Input value={clientPhone} onChange={e => setClientPhone(e.target.value)} placeholder="+380..." />
              </div>
            </div>

            {/* Route */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Звідки *</Label>
                <Input value={origin} onChange={e => setOrigin(e.target.value)} placeholder="Місто відправлення" />
              </div>
              <div className="space-y-1.5">
                <Label>Куди *</Label>
                <Input value={destination} onChange={e => setDestination(e.target.value)} placeholder="Місто призначення" />
              </div>
            </div>

            {/* Cargo */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Відстань (км) *</Label>
                <Input type="number" value={distance} onChange={e => setDistance(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-1.5">
                <Label>Тип вантажу</Label>
                <Select value={cargoType} onValueChange={setCargoType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="standard">Стандартний</SelectItem>
                    <SelectItem value="dangerous">Небезпечний</SelectItem>
                    <SelectItem value="refrigerated">Рефрижератор</SelectItem>
                    <SelectItem value="oversized">Негабарит</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Вага (т)</Label>
                <Input type="number" value={cargoWeight} onChange={e => setCargoWeight(e.target.value)} placeholder="0" />
              </div>
            </div>

            {/* Driver & Truck */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Водій</Label>
                <Select value={driverId} onValueChange={setDriverId}>
                  <SelectTrigger><SelectValue placeholder="Оберіть водія" /></SelectTrigger>
                  <SelectContent>
                    {availableDrivers.length === 0 ? (
                      <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3 h-3" /> Немає вільних водіїв
                      </div>
                    ) : (
                      availableDrivers.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.full_name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Машина</Label>
                <Select value={truckId} onValueChange={setTruckId}>
                  <SelectTrigger><SelectValue placeholder="Оберіть машину" /></SelectTrigger>
                  <SelectContent>
                    {availableTrucks.length === 0 ? (
                      <div className="flex items-center gap-2 px-2 py-3 text-xs text-muted-foreground">
                        <AlertTriangle className="w-3 h-3" /> Немає вільних машин
                      </div>
                    ) : (
                      availableTrucks.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.plate_number} — {t.model}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date & Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Дата відправлення</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !departureDate && "text-muted-foreground")}>
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {departureDate ? format(departureDate, "dd MMM yyyy", { locale: uk }) : "Оберіть дату"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={departureDate} onSelect={setDepartureDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label>Ціна (₴)</Label>
                <Input type="number" value={totalPrice} onChange={e => setTotalPrice(e.target.value)} placeholder="0" />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label>Примітки</Label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Додаткова інформація..." />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Скасувати</Button>
          <Button onClick={handleSubmit} disabled={loading || !isValid || fetching}>
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Створити рейс
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
