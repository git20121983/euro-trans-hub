import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Globe, Shield, Clock, ArrowRight, MapPin, Package, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import heroImage from "@/assets/hero-logistics.jpg";

const stats = [
  { value: "2 000 000+", label: "Кілометрів подолано", icon: MapPin },
  { value: "150 000+", label: "Тонн перевезено", icon: Package },
  { value: "500+", label: "Задоволених клієнтів", icon: BarChart3 },
  { value: "10+", label: "Років досвіду", icon: Clock },
];

const advantages = [
  {
    icon: Globe,
    title: "Міжнародні маршрути",
    description: "Перевезення по всій Європі з дотриманням міжнародних стандартів.",
  },
  {
    icon: Shield,
    title: "Гарантія безпеки",
    description: "Страхування вантажу та GPS-моніторинг на всіх етапах доставки.",
  },
  {
    icon: Clock,
    title: "Точно в строк",
    description: "Дотримання термінів доставки — наш головний пріоритет.",
  },
  {
    icon: Truck,
    title: "Сучасний автопарк",
    description: "Нові вантажівки європейського класу для будь-якого типу вантажу.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt="Логістичний автопарк" className="w-full h-full object-cover" width={1920} height={1080} />
          <div className="absolute inset-0 hero-gradient opacity-85" />
        </div>

        <div className="relative z-10 container-custom px-4 sm:px-6 lg:px-8 pt-20">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-block px-4 py-1.5 rounded-full text-sm font-medium accent-gradient text-secondary-foreground mb-6">
                🚛 Надійний партнер у логістиці
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-tight mb-6 text-primary-foreground">
                Доставляємо{" "}
                <span className="text-gradient">впевненість</span>
                {" "}у кожному рейсі
              </h1>
              <p className="text-lg sm:text-xl text-primary-foreground/70 mb-8 max-w-xl">
                Euro Trans Logistics — ваш надійний логістичний партнер з м. Первомайськ. 
                Перевезення по Україні та Європі.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/calculator">
                <Button size="lg" className="accent-gradient text-secondary-foreground font-semibold text-base px-8 animate-pulse-glow border-0">
                  Розрахувати вартість <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/services">
                <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
                  Наші послуги
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative -mt-20 z-20 container-custom px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <AnimatedSection key={stat.label} delay={i * 0.1}>
              <div className="elevated-card rounded-xl p-6 text-center">
                <stat.icon className="w-8 h-8 text-secondary mx-auto mb-3" />
                <div className="font-display text-2xl sm:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Advantages */}
      <section className="section-padding">
        <div className="container-custom">
          <AnimatedSection>
            <div className="text-center mb-12">
              <h2 className="font-display text-3xl sm:text-4xl font-bold mb-4">Чому обирають нас</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Ми поєднуємо досвід, технології та відповідальність для найкращого результату.
              </p>
            </div>
          </AnimatedSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {advantages.map((adv, i) => (
              <AnimatedSection key={adv.title} delay={i * 0.1}>
                <div className="elevated-card rounded-xl p-6 h-full hover:scale-[1.02] transition-transform duration-300">
                  <div className="w-12 h-12 rounded-lg accent-gradient flex items-center justify-center mb-4">
                    <adv.icon className="w-6 h-6 text-secondary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">{adv.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{adv.description}</p>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <AnimatedSection>
        <section className="section-padding">
          <div className="container-custom">
            <div className="hero-gradient rounded-2xl p-8 sm:p-12 lg:p-16 text-center">
              <h2 className="font-display text-3xl sm:text-4xl font-bold text-primary-foreground mb-4">
                Готові до відправки?
              </h2>
              <p className="text-primary-foreground/70 mb-8 max-w-lg mx-auto">
                Розрахуйте вартість доставки онлайн або зв'яжіться з нами для індивідуальної пропозиції.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/calculator">
                  <Button size="lg" className="accent-gradient text-secondary-foreground font-semibold border-0">
                    Калькулятор вартості
                  </Button>
                </Link>
                <Link to="/contacts">
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                    Зв'язатися з нами
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </AnimatedSection>
    </div>
  );
}
