import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Truck, LogIn, UserPlus } from "lucide-react";
import { toast } from "sonner";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Вхід успішний!");
        // Check role and redirect accordingly
        if (data.user) {
          const { data: roles } = await supabase
            .from("user_roles")
            .select("role")
            .eq("user_id", data.user.id);
          const roleList = roles?.map((r) => r.role) ?? [];
          if (roleList.includes("driver") && !roleList.includes("admin") && !roleList.includes("manager")) {
            navigate("/driver");
          } else if (roleList.includes("admin") || roleList.includes("manager")) {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, phone },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Реєстрація успішна! Перевірте пошту для підтвердження.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center hero-gradient px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl accent-gradient flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-secondary-foreground" />
          </div>
          <h1 className="font-display text-3xl font-bold text-primary-foreground">
            Euro Trans Logistics
          </h1>
          <p className="text-primary-foreground/60 mt-2">
            {isLogin ? "Увійдіть до свого акаунту" : "Створіть новий акаунт"}
          </p>
        </div>

        <div className="elevated-card rounded-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label htmlFor="fullName">Повне ім'я</Label>
                <Input
                  id="fullName"
                  placeholder="Іван Петренко"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1.5"
                  required={!isLogin}
                />
              </div>
            )}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
                required
                minLength={6}
              />
            </div>
            <Button
              type="submit"
              className="w-full accent-gradient text-secondary-foreground font-semibold border-0"
              size="lg"
              disabled={loading}
            >
              {loading ? "Зачекайте..." : isLogin ? (
                <><LogIn className="w-4 h-4 mr-2" /> Увійти</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" /> Зареєструватися</>
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isLogin ? "Немає акаунту? Зареєструватися" : "Вже є акаунт? Увійти"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
