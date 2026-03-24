import { Package, Truck, Clock, CheckCircle2, MapPin, FileText, BarChart3, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/AnimatedSection";

const orders = [
  { id: "ETL-2026-001234", from: "Первомайськ", to: "Одеса", status: "В дорозі", date: "24.03.2026", type: "Стандартний" },
  { id: "ETL-2026-001198", from: "Первомайськ", to: "Київ", status: "Доставлено", date: "20.03.2026", type: "Зернові" },
  { id: "ETL-2026-001150", from: "Варшава", to: "Первомайськ", status: "Доставлено", date: "15.03.2026", type: "Міжнародний" },
  { id: "ETL-2026-001100", from: "Первомайськ", to: "Львів", status: "Доставлено", date: "10.03.2026", type: "Негабаритний" },
];

const statusColor: Record<string, string> = {
  "В дорозі": "bg-secondary/20 text-secondary",
  "Доставлено": "bg-green-100 text-green-700",
  "Очікує": "bg-muted text-muted-foreground",
};

export default function DashboardPage() {
  return (
    <div className="pt-20">
      <section className="hero-gradient py-12 px-4 sm:px-6 lg:px-8">
        <div className="container-custom">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-secondary/20 flex items-center justify-center">
              <User className="w-7 h-7 text-secondary" />
            </div>
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-primary-foreground">Особистий кабінет</h1>
              <p className="text-primary-foreground/70 text-sm">Вітаємо! Тут ви можете керувати замовленнями.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Package, label: "Всього замовлень", value: "24" },
              { icon: Truck, label: "В дорозі", value: "1" },
              { icon: CheckCircle2, label: "Доставлено", value: "22" },
              { icon: Clock, label: "Очікують", value: "1" },
            ].map((s, i) => (
              <AnimatedSection key={s.label} delay={i * 0.05}>
                <div className="elevated-card rounded-xl p-5">
                  <s.icon className="w-6 h-6 text-secondary mb-2" />
                  <div className="font-display text-2xl font-bold">{s.value}</div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>

          {/* Active shipment */}
          <AnimatedSection>
            <div className="elevated-card rounded-xl p-6 mb-8 border-l-4 border-l-secondary">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <Truck className="w-5 h-5 text-secondary" /> Активне відправлення
                </h3>
                <span className="px-3 py-1 rounded-full bg-secondary/20 text-secondary text-sm font-medium">В дорозі</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">ТТН</p>
                  <p className="font-semibold">ETL-2026-001234</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Маршрут</p>
                  <p className="font-semibold flex items-center gap-1">
                    Первомайськ <span className="text-muted-foreground">→</span> Одеса
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Орієнтовна доставка</p>
                  <p className="font-semibold">24.03.2026, 19:00</p>
                </div>
              </div>
              <div className="mt-4 bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full accent-gradient rounded-full" style={{ width: "65%" }} />
              </div>
              <p className="text-xs text-muted-foreground mt-1">65% маршруту пройдено</p>
            </div>
          </AnimatedSection>

          {/* Orders table */}
          <AnimatedSection>
            <div className="elevated-card rounded-xl overflow-hidden">
              <div className="p-6 border-b border-border flex items-center justify-between">
                <h3 className="font-display font-bold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-secondary" /> Історія замовлень
                </h3>
                <Button variant="outline" size="sm">
                  <BarChart3 className="w-4 h-4 mr-2" /> Звіт
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">№ ТТН</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Маршрут</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Тип</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Дата</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Статус</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-4 font-medium">{o.id}</td>
                        <td className="p-4 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-secondary" /> {o.from} → {o.to}
                        </td>
                        <td className="p-4 text-muted-foreground">{o.type}</td>
                        <td className="p-4 text-muted-foreground">{o.date}</td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusColor[o.status] || ""}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>
    </div>
  );
}
