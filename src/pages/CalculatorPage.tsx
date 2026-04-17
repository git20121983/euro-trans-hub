import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight, Fuel, Info, MapPin, Route } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { searchCities, calculateDistance, type City } from "@/lib/cities";
import calcMapBg from "@/assets/calc-map-bg.jpg";

const FUEL_CONSUMPTION = 33;
const OVERHEAD_RATE = 1.15;
const FALLBACK_PRICE = 54.0;

const cargoTypes = [
  { value: "standard", label: "Стандартний вантаж", rate: 1 },
  { value: "grain", label: "Зернові", rate: 0.9 },
  { value: "oversized", label: "Негабаритний", rate: 1.8 },
  { value: "refrigerated", label: "Температурний", rate: 1.5 },
];

async function fetchFuelPrice(): Promise<{ price: number; date: string; isFallback: boolean }> {
  const today = new Date().toLocaleDateString("uk-UA", { day: "numeric", month: "long", year: "numeric" });
  try {
    const res = await fetch(
      `https://api.allorigins.win/raw?url=${encodeURIComponent("https://index.minfin.com.ua/ua/markets/fuel/detail/")}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (res.ok) {
      const html = await res.text();
      const match = html.match(/ДП[\s\S]*?<td[^>]*>([\d]+[.,][\d]+)/i);
      if (match) {
        const price = parseFloat(match[1].replace(",", "."));
        if (price > 20 && price < 120) return { price, date: today, isFallback: false };
      }
    }
  } catch { /* fallback */ }
  return { price: FALLBACK_PRICE, date: today, isFallback: true };
}

function CityAutocomplete({ id, label, placeholder, value, onChange }: {
  id: string; label: string; placeholder: string; value: string; onChange: (v: string) => void;
}) {
  const [suggestions, setSuggestions] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    const results = searchCities(v);
    setSuggestions(results);
    setOpen(results.length > 0);
  };

  const select = (city: City) => {
    onChange(city.name);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-1.5">
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          id={id}
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => { if (suggestions.length) setOpen(true); }}
          className="pl-9"
          autoComplete="off"
        />
      </div>
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((city) => (
            <button
              key={city.name}
              type="button"
              className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors flex items-center justify-between"
              onClick={() => select(city)}
            >
              <span className="font-medium">{city.name}</span>
              {city.region && <span className="text-xs text-muted-foreground">{city.region} обл.</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CalculatorPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [distance, setDistance] = useState("");
  const [autoDistance, setAutoDistance] = useState<number | null>(null);
  const [weight, setWeight] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const [fuelPrice, setFuelPrice] = useState<number>(FALLBACK_PRICE);
  const [fuelDate, setFuelDate] = useState("");
  const [fuelLoading, setFuelLoading] = useState(true);

  useEffect(() => {
    fetchFuelPrice().then(({ price, date }) => {
      setFuelPrice(price);
      setFuelDate(date);
      setFuelLoading(false);
    });
  }, []);

  // Auto-calculate distance when both cities are selected
  useEffect(() => {
    const dist = calculateDistance(from, to);
    if (dist !== null) {
      setAutoDistance(dist);
      setDistance(String(dist));
    } else {
      setAutoDistance(null);
    }
  }, [from, to]);

  const calculate = () => {
    if (!from || !to || !distance || !weight || !cargoType) return;
    const dist = parseFloat(distance);
    const rate = cargoTypes.find((c) => c.value === cargoType)?.rate ?? 1;
    const fuelCost = (dist / 100) * FUEL_CONSUMPTION * fuelPrice;
    const total = fuelCost * rate * OVERHEAD_RATE;
    setResult(Math.round(total));
  };

  return (
    <div className="pt-20">
      <section className="hero-gradient section-padding">
        <div className="container-custom text-center">
          <AnimatedSection>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              Калькулятор вартості
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
              Розрахуйте орієнтовну вартість перевезення онлайн
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="relative section-padding overflow-hidden">
        {/* Blurred map road background */}
        <div className="absolute inset-0 -z-10">
          <img
            src={calcMapBg}
            alt=""
            aria-hidden="true"
            loading="lazy"
            width={1920}
            height={1080}
            className="w-full h-full object-cover opacity-30 blur-md scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />
        </div>

        <div className="container-custom max-w-2xl">
          <AnimatedSection>
            <div className="glass-card-strong rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center">
                  <Calculator className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Розрахунок вартості</h2>
                  <p className="text-sm text-muted-foreground">Заповніть дані для отримання орієнтовної ціни</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-5">
                  <CityAutocomplete id="from" label="Звідки" placeholder="Почніть вводити місто" value={from} onChange={setFrom} />
                  <CityAutocomplete id="to" label="Куди" placeholder="Почніть вводити місто" value={to} onChange={setTo} />
                </div>

                {/* Distance with auto-calc indicator */}
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="distance">Відстань (км)</Label>
                    <div className="relative mt-1.5">
                      <Route className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="distance"
                        type="number"
                        placeholder="Авто або вручну"
                        value={distance}
                        onChange={(e) => { setDistance(e.target.value); setAutoDistance(null); }}
                        className="pl-9"
                      />
                    </div>
                    {autoDistance !== null && (
                      <p className="text-xs text-secondary mt-1 flex items-center gap-1">
                        <Info className="w-3 h-3" /> Розраховано автоматично: ~{autoDistance} км
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="weight">Вага (тонн)</Label>
                    <Input id="weight" type="number" placeholder="Наприклад: 20" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1.5" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label>Тип вантажу</Label>
                    <Select value={cargoType} onValueChange={setCargoType}>
                      <SelectTrigger className="mt-1.5">
                        <SelectValue placeholder="Оберіть тип" />
                      </SelectTrigger>
                      <SelectContent>
                        {cargoTypes.map((ct) => (
                          <SelectItem key={ct.value} value={ct.value}>{ct.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Тип палива</Label>
                    <Select defaultValue="diesel">
                      <SelectTrigger className="mt-1.5">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="diesel">Дизель (ДП)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fuel price info */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/10 border border-secondary/20">
                  <Fuel className="w-5 h-5 text-secondary shrink-0" />
                  <div className="text-sm">
                    {fuelLoading ? (
                      <span className="text-muted-foreground">Завантаження ціни палива…</span>
                    ) : (
                      <>
                        <span className="font-semibold text-foreground">Сьогоднішня ціна ДП: {fuelPrice.toFixed(2)} грн/л</span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Info className="w-3 h-3" /> Ціна оновлена за ринковими даними на {fuelDate}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <Button onClick={calculate} className="w-full accent-gradient text-secondary-foreground font-semibold border-0" size="lg">
                  Розрахувати <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                {result !== null && (
                  <div className="mt-6 p-6 rounded-xl bg-secondary/10 border border-secondary/30 text-center">
                    <p className="text-sm text-muted-foreground mb-2">Орієнтовна вартість перевезення:</p>
                    <p className="font-display text-4xl font-bold text-foreground">
                      {result.toLocaleString("uk-UA")} <span className="text-secondary">₴</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-3 space-y-1">
                      <span className="block">Витрата: {FUEL_CONSUMPTION} л/100 км · Ціна ДП: {fuelPrice.toFixed(2)} грн/л · +15% накладні</span>
                      <span className="block">* Остаточна ціна може відрізнятися. Зв'яжіться з нами для точного розрахунку.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
