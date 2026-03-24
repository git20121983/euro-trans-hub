import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, MessageCircle, Send } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";
import { useToast } from "@/hooks/use-toast";

export default function ContactsPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Дякуємо!", description: "Ваше повідомлення відправлено. Ми зв'яжемося з вами найближчим часом." });
    setName(""); setEmail(""); setMessage("");
  };

  return (
    <div className="pt-20">
      <section className="hero-gradient section-padding">
        <div className="container-custom text-center">
          <AnimatedSection>
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-primary-foreground mb-4">Контакти</h1>
            <p className="text-primary-foreground/70 max-w-2xl mx-auto text-lg">
              Зв'яжіться з нами будь-яким зручним способом
            </p>
          </AnimatedSection>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Info */}
            <AnimatedSection>
              <div className="space-y-6">
                <h2 className="font-display text-2xl font-bold">Наші контакти</h2>

                {[
                  { icon: MapPin, title: "Адреса", text: "вул. Одеська, 45, м. Первомайськ, Миколаївська обл., 55201" },
                  { icon: Phone, title: "Телефон", text: "+380 (XX) XXX-XX-XX" },
                  { icon: Mail, title: "Email", text: "info@eurotranslog.ua" },
                  { icon: Clock, title: "Графік", text: "Пн-Пт: 08:00-18:00, Сб: 09:00-14:00" },
                ].map((c) => (
                  <div key={c.title} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-lg accent-gradient flex items-center justify-center shrink-0">
                      <c.icon className="w-5 h-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold">{c.title}</p>
                      <p className="text-sm text-muted-foreground">{c.text}</p>
                    </div>
                  </div>
                ))}

                <div className="pt-4">
                  <p className="font-semibold mb-3">Месенджери</p>
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                      <MessageCircle className="w-4 h-4" /> Viber
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Send className="w-4 h-4" /> Telegram
                    </Button>
                  </div>
                </div>

                {/* Google Maps Embed */}
                <div className="rounded-xl overflow-hidden border border-border h-72">
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
              </div>
            </AnimatedSection>

            {/* Form */}
            <AnimatedSection delay={0.1}>
              <div className="elevated-card rounded-2xl p-8">
                <h2 className="font-display text-2xl font-bold mb-6">Зворотний зв'язок</h2>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <Label htmlFor="name">Ваше ім'я</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Іван Петренко" className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ivan@example.com" className="mt-1.5" required />
                  </div>
                  <div>
                    <Label htmlFor="msg">Повідомлення</Label>
                    <Textarea id="msg" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Опишіть ваше питання..." className="mt-1.5 min-h-[120px]" required />
                  </div>
                  <Button type="submit" className="w-full accent-gradient text-secondary-foreground font-semibold border-0" size="lg">
                    Відправити повідомлення
                  </Button>
                </form>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>
    </div>
  );
}
