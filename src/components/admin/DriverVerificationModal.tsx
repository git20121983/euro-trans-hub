import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;

interface Props {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onActioned: () => void;
}

export default function DriverVerificationModal({ driver, open, onOpenChange, onActioned }: Props) {
  const { user } = useAuth();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!driver || !open) return;
    const paths = [driver.license_front_url, driver.license_back_url, driver.selfie_url].filter(Boolean) as string[];
    if (!paths.length) return;
    supabase.storage
      .from("driver-docs")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((d, i) => { if (d.signedUrl) map[paths[i]] = d.signedUrl; });
        setUrls(map);
      });
  }, [driver?.id, open]);

  if (!driver) return null;

  const approve = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("drivers")
      .update({
        status: "available",
        verified_at: new Date().toISOString(),
        verified_by: user?.id,
      })
      .eq("id", driver.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`Водія ${driver.full_name} активовано`);
    onActioned();
    onOpenChange(false);
  };

  const reject = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("drivers")
      .update({ status: "pending_details" })
      .eq("id", driver.id);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.info(`Запит відхилено. Водій має перезаповнити дані.`);
    onActioned();
    onOpenChange(false);
  };

  const photoFields: Array<[string, string | null]> = [
    ["Лицьовий бік посвідчення", driver.license_front_url],
    ["Зворотній бік посвідчення", driver.license_back_url],
    ["Селфі", driver.selfie_url],
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Перевірка водія: {driver.full_name}</DialogTitle>
          <DialogDescription>Перевірте дані та документи перед активацією</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Телефон:</span> <span className="font-medium">{driver.phone}</span></div>
            <div><span className="text-muted-foreground">Посвідчення:</span> <span className="font-medium">{driver.license_number}</span></div>
            <div><span className="text-muted-foreground">Дата народження:</span> <span className="font-medium">{driver.birth_date ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Дійсне до:</span> <span className="font-medium">{driver.license_expiry ?? "—"}</span></div>
            <div className="col-span-2"><span className="text-muted-foreground">Адреса:</span> <span className="font-medium">{driver.address ?? "—"}</span></div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {photoFields.map(([label, path]) => (
              <div key={label} className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">{label}</p>
                {path && urls[path] ? (
                  <a href={urls[path]} target="_blank" rel="noreferrer">
                    <img src={urls[path]} alt={label} className="rounded-lg border w-full aspect-[3/2] object-cover" />
                  </a>
                ) : (
                  <div className="rounded-lg border bg-muted/30 aspect-[3/2] flex items-center justify-center text-xs text-muted-foreground">
                    Не завантажено
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={reject} disabled={saving} className="flex-1">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Відхилити
            </Button>
            <Button onClick={approve} disabled={saving} className="flex-1 bg-green-600 hover:bg-green-700">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Схвалити
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
