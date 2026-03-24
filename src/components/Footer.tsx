import { Link } from "react-router-dom";
import { Truck, Phone, Mail, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container-custom section-padding">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 font-display font-bold text-xl mb-4">
              <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <span>Euro Trans Logistics</span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Надійні логістичні рішення для вашого бізнесу. Перевезення по Україні та Європі.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Навігація</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><Link to="/about" className="hover:text-secondary transition-colors">Про компанію</Link></li>
              <li><Link to="/services" className="hover:text-secondary transition-colors">Послуги</Link></li>
              <li><Link to="/calculator" className="hover:text-secondary transition-colors">Калькулятор</Link></li>
              <li><Link to="/tracking" className="hover:text-secondary transition-colors">Трекінг</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4">Контакти</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary shrink-0" />
                вул. Одеська, 45, м. Первомайськ, Миколаївська обл., 55201
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
            <h4 className="font-display font-semibold mb-4">Графік роботи</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li>Пн-Пт: 08:00 - 18:00</li>
              <li>Сб: 09:00 - 14:00</li>
              <li>Нд: Вихідний</li>
            </ul>
          </div>
        </div>

        {/* Map */}
        <div className="mt-10 rounded-xl overflow-hidden border border-primary-foreground/10 h-48">
          <iframe
            title="Euro Trans Logistics — Первомайськ"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d42240.45!2d36.62!3d48.045!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40c5a5c0e5a4f5b7%3A0x4a0f5c5f5b5f5b5f!2z0J_QtdGA0LLQvtC80LDQudGB0YzQug!5e0!3m2!1suk!2sua!4v1700000000000"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="w-full h-full"
          />
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/10 text-center text-sm text-primary-foreground/50">
          © {new Date().getFullYear()} Euro Trans Logistics. Всі права захищені.
        </div>
      </div>
    </footer>
  );
}
