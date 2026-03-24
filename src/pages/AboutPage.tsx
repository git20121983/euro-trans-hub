import { Shield, Users, Truck, Award, MapPin } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

const timeline = [
  { year: "2014", text: "Заснування компанії у м. Первомайськ, Миколаївська область" },
  { year: "2016", text: "Розширення автопарку до 20 одиниць техніки" },
  { year: "2018", text: "Початок міжнародних перевезень по Європі" },
  { year: "2020", text: "Впровадження GPS-моніторингу та цифрових технологій" },
  { year: "2023", text: "Автопарк 50+ одиниць, 500+ постійних клієнтів" },
];

const fleet = [
  { type: "Тентовані напівпричепи", count: "20+", desc: "Для стандартних вантажів" },
  { type: "Зерновози", count: "15+", desc: "Для сипучих вантажів" },
  { type: "Негабаритна техніка", count: "8+", desc: "Для великогабаритних вантажів" },
  { type: "Рефрижератори", count: "5+", desc: "Для температурних вантажів" },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="hero-gradient section-padding">
        <div className="container-custom text-center">
          <AnimatedSection>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">
              Про компанію
            </h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
              Euro Trans Logistics — українська логістична компанія з базою у м. Первомайськ, 
              що забезпечує надійні вантажоперевезення по Україні та Європі.
            </p>
          </AnimatedSection>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Shield, title: "Надійність", desc: "Гарантуємо збереження вантажу" },
              { icon: Users, title: "Команда", desc: "Професіонали з багаторічним досвідом" },
              { icon: Award, title: "Якість", desc: "Відповідність європейським стандартам" },
              { icon: MapPin, title: "Локація", desc: "Стратегічне розташування у Первомайську" },
            ].map((v, i) => (
              <AnimatedSection key={v.title} delay={i * 0.1}>
                <div className="elevated-card rounded-xl p-6 text-center">
                  <v.icon className="w-10 h-10 text-secondary mx-auto mb-3" />
                  <h3 className="font-display font-semibold text-lg mb-1">{v.title}</h3>
                  <p className="text-sm text-muted-foreground">{v.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline */}
      <section className="section-padding bg-muted/50">
        <div className="container-custom">
          <AnimatedSection>
            <h2 className="font-display text-3xl font-bold text-center mb-12">Наша історія</h2>
          </AnimatedSection>
          <div className="max-w-2xl mx-auto space-y-0">
            {timeline.map((item, i) => (
              <AnimatedSection key={item.year} delay={i * 0.1}>
                <div className="flex gap-4 items-start pb-8 relative">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full accent-gradient flex items-center justify-center text-sm font-bold text-secondary-foreground shrink-0">
                      {item.year.slice(2)}
                    </div>
                    {i < timeline.length - 1 && <div className="w-0.5 h-full bg-border mt-2" />}
                  </div>
                  <div className="pt-2">
                    <span className="font-display font-bold text-secondary">{item.year}</span>
                    <p className="text-muted-foreground mt-1">{item.text}</p>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Fleet */}
      <section className="section-padding">
        <div className="container-custom">
          <AnimatedSection>
            <h2 className="font-display text-3xl font-bold text-center mb-4">Наш автопарк</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
              Сучасна техніка європейського класу для будь-яких завдань
            </p>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {fleet.map((f, i) => (
              <AnimatedSection key={f.type} delay={i * 0.1}>
                <div className="elevated-card rounded-xl p-6 text-center">
                  <Truck className="w-10 h-10 text-secondary mx-auto mb-3" />
                  <div className="font-display text-3xl font-bold text-foreground mb-1">{f.count}</div>
                  <h3 className="font-semibold mb-1">{f.type}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
