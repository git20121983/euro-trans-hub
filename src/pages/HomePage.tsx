import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Truck, Globe, Shield, Clock, ArrowRight, MapPin, Package, BarChart3 } from "lucide-react";
import { motion } from "framer-motion";
import AnimatedSection from "@/components/AnimatedSection";
import heroImage from "@/assets/hero-trucks-sunset.jpg";

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
        {/* Background image */}
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt="Вантажівки Euro Trans Logistics на гірській дорозі під час заходу сонця"
            className="w-full h-full object-cover"
            width={1920}
            height={1080}
          />
          {/* Cinematic dark overlay for legibility */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 w-full container-custom px-4 sm:px-6 lg:px-8 pt-28 pb-16">
          <div className="max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium accent-gradient text-secondary-foreground mb-6 shadow-lg">
                🚛 Надійний партнер у логістиці
              </span>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl font-bold leading-[1.05] mb-6 text-white drop-shadow-lg">
                Доставляємо{" "}
                <span className="text-gradient">впевненість</span>
                {" "}у кожному рейсі
              </h1>
              <p className="text-lg sm:text-xl text-white/85 mb-8 max-w-xl leading-relaxed">
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
                <Button
                  size="lg"
                  className="accent-gradient text-secondary-foreground font-semibold text-base px-8 rounded-full shadow-xl shadow-secondary/30 hover:shadow-secondary/50 hover:scale-[1.02] transition-all border-0"
                >
                  Розрахувати вартість <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link to="/services">
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-full border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
                >
                  Наші послуги
                </Button>
              </Link>
            </motion.div>
          </div>

          {/* Glassmorphism stats inside hero */}
          <div className="mt-16 sm:mt-20 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.6 + i * 0.1 }}
                className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6 text-center hover:bg-white/15 hover:border-white/30 transition-colors shadow-xl"
              >
                <stat.icon className="w-6 h-6 sm:w-7 sm:h-7 text-secondary mx-auto mb-2 sm:mb-3" strokeWidth={1.5} />
                <div className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-xs sm:text-sm text-white/70 mt-1">{stat.label}</div>
              </motion.div>
            ))}
          </div>
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
                  <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground bg-primary-foreground/10 hover:bg-primary-foreground/20">
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
