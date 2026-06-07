import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Truck, Wifi, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const navItems = [
  { label: "Головна", path: "/" },
  { label: "Про компанію", path: "/about" },
  { label: "Послуги", path: "/services" },
  { label: "Калькулятор", path: "/calculator" },
  { label: "Трекінг", path: "/tracking" },
  { label: "Контакти", path: "/contacts" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [online, setOnline] = useState(true);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Simple DB connection probe
  useEffect(() => {
    let mounted = true;
    const ping = async () => {
      try {
        const { error } = await supabase.from("orders").select("id", { head: true, count: "exact" }).limit(1);
        if (mounted) setOnline(!error);
      } catch {
        if (mounted) setOnline(false);
      }
    };
    ping();
    const id = setInterval(ping, 30000);
    return () => { mounted = false; clearInterval(id); };
  }, []);

  const useLight = isHome && !scrolled;
  const navBg = useLight
    ? "bg-transparent border-b border-transparent"
    : "bg-background/60 backdrop-blur-xl border-b border-white/10 shadow-[0_2px_24px_-12px_rgba(0,0,0,0.6)]";

  const brandText = useLight ? "text-white" : "text-foreground";
  const navLinkBase = useLight
    ? "text-white/75 hover:text-white hover:bg-white/10"
    : "text-muted-foreground hover:text-foreground hover:bg-white/5";
  const navLinkActive = useLight
    ? "bg-white/15 text-white"
    : "bg-white/10 text-foreground";

  const userInitials = user?.email?.slice(0, 2).toUpperCase() ?? "ET";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navBg}`}>
      <div className="container-custom flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl accent-gradient flex items-center justify-center shadow-[0_0_20px_-4px_hsl(30_95%_55%/0.6)] group-hover:scale-105 transition-transform">
              <Truck className="w-[18px] h-[18px] text-secondary-foreground" strokeWidth={2.5} />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-background" />
          </div>
          <div className="flex flex-col leading-none">
            <span className={`font-display font-extrabold text-lg tracking-tight ${brandText}`}>
              Euro Trans<span className="text-secondary">.</span>
            </span>
            <span className={`text-[10px] uppercase tracking-[0.18em] ${useLight ? "text-white/60" : "text-muted-foreground"}`}>
              Logistics
            </span>
          </div>
        </Link>

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-0.5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                location.pathname === item.path ? navLinkActive : navLinkBase
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Right cluster */}
        <div className="hidden lg:flex items-center gap-3">
          {/* Connection status */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              useLight
                ? "border-white/20 bg-white/10 text-white/90"
                : "border-white/10 bg-white/[0.04] text-muted-foreground"
            }`}
            title={online ? "Підключено до бази" : "Немає з'єднання"}
          >
            <span className="relative flex w-2 h-2">
              {online && (
                <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
              )}
              <span className={`relative inline-flex w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-500"}`} />
            </span>
            {online ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            <span className="hidden xl:inline">{online ? "Online" : "Offline"}</span>
          </div>

          <Link to="/auth">
            <Button size="sm" className="accent-gradient text-secondary-foreground border-0 shadow-md rounded-full px-4">
              CRM Вхід
            </Button>
          </Link>

          <Link to={user ? "/dashboard" : "/auth"} className="ml-1">
            <Avatar className={`w-9 h-9 border-2 transition-all ${useLight ? "border-white/30 hover:border-white/60" : "border-white/15 hover:border-secondary"}`}>
              <AvatarFallback className="bg-gradient-to-br from-secondary to-amber-600 text-secondary-foreground text-xs font-bold">
                {userInitials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>

        {/* Mobile right */}
        <div className="flex lg:hidden items-center gap-2">
          <span
            className={`w-2 h-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-500"}`}
            title={online ? "Online" : "Offline"}
          />
          <button
            onClick={() => setOpen(!open)}
            className={`p-2 rounded-lg ${useLight ? "text-white hover:bg-white/10" : "text-foreground hover:bg-white/5"}`}
            aria-label="Меню"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-background/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-medium ${
                  location.pathname === item.path
                    ? "bg-white/10 text-foreground"
                    : "text-muted-foreground hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full mt-2 rounded-full">Особистий кабінет</Button>
            </Link>
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full mt-1 accent-gradient text-secondary-foreground border-0 rounded-full">CRM Вхід</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
