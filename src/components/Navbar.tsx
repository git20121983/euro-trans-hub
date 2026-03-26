import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-lg border-b border-border/50">
      <div className="container-custom flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 font-display font-bold text-xl">
          <div className="w-9 h-9 rounded-lg accent-gradient flex items-center justify-center">
            <Truck className="w-5 h-5 text-secondary-foreground" />
          </div>
          <span className="text-foreground">Euro Trans</span>
          <span className="text-secondary">Logistics</span>
        </Link>

        {/* Desktop */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                location.pathname === item.path
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="outline" size="sm">Особистий кабінет</Button>
          </Link>
          <Link to="/auth">
            <Button size="sm" className="accent-gradient text-secondary-foreground border-0">CRM Вхід</Button>
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="lg:hidden p-2 text-foreground"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden bg-card border-b border-border">
          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setOpen(false)}
                className={`block px-3 py-2 rounded-md text-sm font-medium ${
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link to="/dashboard" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full mt-2">Особистий кабінет</Button>
            </Link>
            <Link to="/auth" onClick={() => setOpen(false)}>
              <Button size="sm" className="w-full mt-1 accent-gradient text-secondary-foreground border-0">CRM Вхід</Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
