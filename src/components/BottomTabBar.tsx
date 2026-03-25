import { Link, useLocation } from "react-router-dom";
import { Home, Package, User, HelpCircle } from "lucide-react";

const tabs = [
  { label: "Головна", path: "/", icon: Home },
  { label: "Замовлення", path: "/tracking", icon: Package },
  { label: "Профіль", path: "/dashboard", icon: User },
  { label: "Допомога", path: "/contacts", icon: HelpCircle },
];

export default function BottomTabBar() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-lg border-t border-border/50 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = tab.path === "/" ? pathname === "/" : pathname.startsWith(tab.path);
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-secondary" : "text-foreground/40"
              }`}
            >
              <tab.icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : ""}`} />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
