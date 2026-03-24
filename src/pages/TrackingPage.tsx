import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Package, MapPin, CheckCircle2, Truck, Clock } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const mockStatuses = [
  { time: "24.03.2026, 08:00", text: "Вантаж прийнято на складі", location: "Первомайськ", done: true },
  { time: "24.03.2026, 10:30", text: "Завантажено на транспорт", location: "Первомайськ", done: true },
  { time: "24.03.2026, 14:00", text: "В дорозі", location: "Траса Е40", done: true },
  { time: "24.03.2026, 18:00", text: "Прибуття на розвантаження", location: "Одеса", done: false },
  { time: "24.03.2026, 19:00", text: "Доставлено отримувачу", location: "Одеса", done: false },
];

export default function TrackingPage() {
  const [ttn, setTtn] = useState("");
  const [tracking, setTracking] = useState(false);

  const handleTrack = () => {
    if (ttn.trim()) setTracking(true);
  };

  return (
    <div className="pt-20">
      <section className="hero-gradient section-padding">
        <div className="container-custom text-center">
          <AnimatedSection>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              Відстеження вантажу
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
              Введіть номер ТТН для перевірки статусу вашого відправлення
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom max-w-2xl">
          <AnimatedSection>
            <div className="elevated-card rounded-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl accent-gradient flex items-center justify-center">
                  <Search className="w-6 h-6 text-secondary-foreground" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold">Пошук за ТТН</h2>
                  <p className="text-sm text-muted-foreground">Введіть номер товарно-транспортної накладної</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="ttn" className="sr-only">Номер ТТН</Label>
                  <Input
                    id="ttn"
                    placeholder="Наприклад: ETL-2026-001234"
                    value={ttn}
                    onChange={(e) => { setTtn(e.target.value); setTracking(false); }}
                  />
                </div>
                <Button onClick={handleTrack} className="accent-gradient text-secondary-foreground border-0">
                  <Search className="w-4 h-4 mr-2" /> Знайти
                </Button>
              </div>
            </div>
          </AnimatedSection>

          {tracking && (
            <AnimatedSection>
              <div className="elevated-card rounded-2xl p-8 mt-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-sm text-muted-foreground">ТТН</p>
                    <p className="font-display font-bold text-lg">{ttn}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium flex items-center gap-1.5">
                    <Truck className="w-4 h-4" /> В дорозі
                  </span>
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground mb-6 p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary" /> Первомайськ</div>
                  <div className="flex-1 border-t border-dashed border-border mx-4" />
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-secondary" /> Одеса</div>
                </div>

                <div className="space-y-0">
                  {mockStatuses.map((s, i) => (
                    <div key={i} className="flex gap-4 items-start pb-6 relative">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                          s.done ? "accent-gradient" : "bg-muted"
                        }`}>
                          {s.done ? (
                            <CheckCircle2 className="w-4 h-4 text-secondary-foreground" />
                          ) : (
                            <Clock className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        {i < mockStatuses.length - 1 && (
                          <div className={`w-0.5 flex-1 mt-2 ${s.done ? "bg-secondary" : "bg-border"}`} />
                        )}
                      </div>
                      <div className="pt-1">
                        <p className={`font-medium text-sm ${s.done ? "text-foreground" : "text-muted-foreground"}`}>{s.text}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{s.time} · {s.location}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </AnimatedSection>
          )}
        </div>
      </section>
    </div>
  );
}
