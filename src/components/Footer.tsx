import { Link } from "react-router-dom";
import { Truck, Phone, Mail, MapPin, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="relative mt-12 border-t border-white/10 bg-background/60 backdrop-blur-xl">
      <div className="container-custom px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4 text-foreground">
              <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
                <Truck className="w-5 h-5 text-secondary-foreground" />
              </div>
              <span>Euro Trans Logistics</span>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Надійні логістичні рішення для вашого бізнесу. Перевезення по Україні та Європі.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Навігація</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/about" className="hover:text-secondary transition-colors">Про компанію</Link></li>
              <li><Link to="/services" className="hover:text-secondary transition-colors">Послуги</Link></li>
              <li><Link to="/calculator" className="hover:text-secondary transition-colors">Калькулятор</Link></li>
              <li><Link to="/tracking" className="hover:text-secondary transition-colors">Трекінг</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Контакти</h4>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=Первомайськ+Миколаївська+область"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 hover:text-secondary transition-colors group"
                >
                  <MapPin className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>
                    м. Первомайськ, Миколаївська обл., Україна
                    <ExternalLink className="inline-block w-3 h-3 ml-1 opacity-60 group-hover:opacity-100" />
                  </span>
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-secondary" />
                +380 (XX) XXX-XX-XX
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-secondary" />
                info@eurotranslog.ua
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-foreground">Графік роботи</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Пн-Пт: 08:00 – 18:00</li>
              <li>Сб: 09:00 – 14:00</li>
              <li>Нд: Вихідний</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 text-center text-xs text-muted-foreground/70">
          © {new Date().getFullYear()} Euro Trans Logistics · м. Первомайськ. Всі права захищені.
        </div>
      </div>
    </footer>
  );
}
