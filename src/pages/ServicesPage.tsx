import { Globe, MapPin, Truck, Wheat, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AnimatedSection from "@/components/AnimatedSection";

const services = [
  {
    icon: Globe,
    title: "Міжнародні перевезення",
    description: "Доставка вантажів по всій Європі. Митне оформлення, страхування, супровід документів.",
    features: ["Країни ЄС", "Митне оформлення", "Страхування вантажу", "GPS-моніторинг"],
  },
  {
    icon: MapPin,
    title: "Внутрішні рейси по Україні",
    description: "Швидка та надійна доставка по всій території України з будь-якої точки.",
    features: ["Вся Україна", "Доставка до дверей", "Збірні вантажі", "Термінова доставка"],
  },
  {
    icon: Truck,
    title: "Негабаритні вантажі",
    description: "Перевезення великогабаритних та важковагових вантажів зі спеціальною технікою.",
    features: ["Спеціалізована техніка", "Супровід", "Дозволи та погодження", "Індивідуальний маршрут"],
  },
  {
    icon: Wheat,
    title: "Зерновози",
    description: "Перевезення зернових та сипучих вантажів власним парком зерновозів.",
    features: ["Зернові культури", "Сипучі матеріали", "Великий парк", "Сезонна логістика"],
  },
];

export default function ServicesPage() {
  return (
    <div className="pt-20">
      <section className="hero-gradient section-padding">
        <div className="container-custom text-center">
          <AnimatedSection>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">Наші послуги</h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
              Повний спектр логістичних рішень для вашого бізнесу
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8">
            {services.map((s, i) => (
              <AnimatedSection key={s.title} delay={i * 0.1}>
                <div className="elevated-card rounded-xl p-8 h-full flex flex-col hover:scale-[1.01] transition-transform duration-300">
                  <div className="w-14 h-14 rounded-xl accent-gradient flex items-center justify-center mb-5">
                    <s.icon className="w-7 h-7 text-secondary-foreground" />
                  </div>
                  <h3 className="font-display text-xl font-bold mb-3">{s.title}</h3>
                  <p className="text-muted-foreground mb-5 flex-1">{s.description}</p>
                  <ul className="grid grid-cols-2 gap-2 mb-6">
                    {s.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link to="/calculator">
                    <Button variant="outline" className="w-full">
                      Розрахувати вартість <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
