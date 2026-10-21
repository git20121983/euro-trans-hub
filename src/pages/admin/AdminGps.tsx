import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Navigation } from "lucide-react";

interface Unit { id: number; name: string; lat: number | null; lng: number | null; speed: number; time: string | null }
interface OrderLite { order_number: string; origin: string; destination: string; status: string; truck: { plate_number: string } | null }

const norm = (s: string) => s.replace(/[\s-]/g, "").toUpperCase();

export default function AdminGps() {
  const mapEl = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [orders, setOrders] = useState<OrderLite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fitted = useRef(false);

  const load = async () => {
    setLoading(true);
    const [{ data, error: err }, { data: o }] = await Promise.all([
      supabase.functions.invoke("wialon-units"),
      supabase.from("orders").select("order_number,origin,destination,status,truck:trucks(plate_number)")
        .in("status", ["planning", "customs", "in_transit", "unloading"]),
    ]);
    setOrders((o ?? []) as unknown as OrderLite[]);
    if (err) setError(err.message);
    else { setError(data?.error ?? null); setUnits(data?.units ?? []); }
    setLoading(false);
  };

  useEffect(() => {
    if (!mapEl.current || map.current) return;
    map.current = L.map(mapEl.current).setView([49.5, 24], 5);
    L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: "© OpenStreetMap © CARTO",
    }).addTo(map.current);
    layer.current = L.layerGroup().addTo(map.current);
    load();
    const t = setInterval(load, 30000);
    return () => { clearInterval(t); map.current?.remove(); map.current = null; };
  }, []);

  const orderFor = (u: Unit) => orders.find((o) => o.truck && norm(u.name).includes(norm(o.truck.plate_number)));

  useEffect(() => {
    if (!layer.current || !map.current) return;
    layer.current.clearLayers();
    const pts: L.LatLngExpression[] = [];
    units.forEach((u) => {
      if (u.lat == null || u.lng == null) return;
      const moving = u.speed > 3;
      const ord = orderFor(u);
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:16px;height:16px;border-radius:50%;background:${moving ? "#10b981" : "#f59e0b"};border:2px solid #fff;box-shadow:0 0 8px rgba(0,0,0,.6)"></div>`,
        iconSize: [16, 16], iconAnchor: [8, 8],
      });
      L.marker([u.lat, u.lng], { icon }).addTo(layer.current!).bindPopup(
        `<b>${u.name}</b><br>${u.speed} км/год${u.time ? `<br>${new Date(u.time).toLocaleString("uk-UA")}` : ""}${ord ? `<br><b>${ord.order_number}</b>: ${ord.origin} → ${ord.destination}` : ""}`,
      );
      pts.push([u.lat, u.lng]);
    });
    if (pts.length && !fitted.current) { map.current.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 9 }); fitted.current = true; }
  }, [units, orders]);

  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Navigation className="w-5 h-5 text-primary" /> GPS-трекінг</h1>
          <p className="text-xs text-muted-foreground">Wialon · оновлення кожні 30 с · {units.length} машин</p>
        </div>
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />} Оновити
        </Button>
      </div>
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">{error}</div>}
      <div className="grid lg:grid-cols-[1fr_280px] gap-4 flex-1 min-h-[500px]">
        <div ref={mapEl} className="rounded-xl border border-border overflow-hidden min-h-[500px] z-0" />
        <div className="rounded-xl border border-border bg-card/50 overflow-y-auto max-h-[600px] divide-y divide-border">
          {units.length === 0 && <p className="p-4 text-sm text-muted-foreground">Немає даних</p>}
          {units.map((u) => {
            const ord = orderFor(u);
            return (
              <button key={u.id} className="w-full text-left p-3 hover:bg-muted/40"
                onClick={() => u.lat != null && map.current?.setView([u.lat, u.lng!], 11)}>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${u.speed > 3 ? "bg-emerald-500" : "bg-amber-500"}`} />
                  <span className="text-sm font-semibold">{u.name}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{u.speed} км/год</span>
                </div>
                {ord && <p className="text-[11px] text-muted-foreground mt-1">{ord.order_number}: {ord.origin} → {ord.destination}</p>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
