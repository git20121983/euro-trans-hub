import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const cargoTypes = [
  { value: "standard", label: "Стандартний вантаж", rate: 1 },
  { value: "grain", label: "Зернові", rate: 0.9 },
  { value: "oversized", label: "Негабаритний", rate: 1.8 },
  { value: "refrigerated", label: "Температурний", rate: 1.5 },
];

export default function CalculatorPage() {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [weight, setWeight] = useState("");
  const [cargoType, setCargoType] = useState("");
  const [result, setResult] = useState<number | null>(null);

  const calculate = () => {
    if (!from || !to || !weight || !cargoType) return;
    const rate = cargoTypes.find((c) => c.value === cargoType)?.rate ?? 1;
    const base = parseFloat(weight) * 12 * rate + 2500;
    setResult(Math.round(base));
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

      <section className="section-padding">
        <div className="container-custom max-w-2xl">
          <AnimatedSection>
            <div className="elevated-card rounded-2xl p-8">
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
                  <div>
                    <Label htmlFor="from">Звідки</Label>
                    <Input id="from" placeholder="Місто відправлення" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1.5" />
                  </div>
                  <div>
                    <Label htmlFor="to">Куди</Label>
                    <Input id="to" placeholder="Місто призначення" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1.5" />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="weight">Вага (тонн)</Label>
                    <Input id="weight" type="number" placeholder="Наприклад: 20" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1.5" />
                  </div>
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
                </div>

                <Button onClick={calculate} className="w-full accent-gradient text-secondary-foreground font-semibold border-0" size="lg">
                  Розрахувати <ArrowRight className="ml-2 w-5 h-5" />
                </Button>

                {result !== null && (
                  <div className="mt-6 p-6 rounded-xl bg-muted text-center">
                    <p className="text-sm text-muted-foreground mb-2">Орієнтовна вартість:</p>
                    <p className="font-display text-4xl font-bold text-foreground">
                      {result.toLocaleString("uk-UA")} <span className="text-secondary">₴</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      * Остаточна ціна може відрізнятися. Зв'яжіться з нами для точного розрахунку.
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
