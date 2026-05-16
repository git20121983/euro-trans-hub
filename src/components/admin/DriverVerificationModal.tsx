import { useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Eye,
  Download,
  Link as LinkIcon,
  Send,
  Copy,
  FileWarning,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;

interface Props {
  driver: Driver | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onActioned: () => void;
  initialTab?: "overview" | "documents";
}

type DocDef = {
  key: keyof Driver;
  label: string;
  bucket: "driver-docs" | "driver-avatars";
  expiryKey?: keyof Driver;
};

const DOCS: DocDef[] = [
  { key: "license_front_url", label: "Посвідчення (передня сторона)", bucket: "driver-docs", expiryKey: "license_expiry" },
  { key: "license_back_url", label: "Посвідчення (зворотна сторона)", bucket: "driver-docs", expiryKey: "license_expiry" },
  { key: "selfie_url", label: "Селфі", bucket: "driver-docs" },
  { key: "id_card_url", label: "ID-картка / Паспорт", bucket: "driver-docs" },
  { key: "tacho_card_url", label: "Чіп-карта тахографа", bucket: "driver-docs", expiryKey: "tacho_expiry" },
  { key: "adr_certificate_url", label: "Сертифікат ADR", bucket: "driver-docs" },
  { key: "intl_passport_url", label: "Закордонний паспорт", bucket: "driver-docs", expiryKey: "intl_passport_expiry" },
  { key: "avatar_url", label: "Фото профілю", bucket: "driver-avatars" },
];

export default function DriverVerificationModal({ driver, open, onOpenChange, onActioned, initialTab = "overview" }: Props) {
  const { user } = useAuth();
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!driver || !open) { setUrls({}); return; }
    const docPaths = DOCS
      .filter(d => d.bucket === "driver-docs")
      .map(d => driver[d.key] as string | null)
      .filter(Boolean) as string[];

    const map: Record<string, string> = {};

    // Public URLs for avatar
    const avatarPath = driver.avatar_url;
    if (avatarPath) {
      const { data } = supabase.storage.from("driver-avatars").getPublicUrl(avatarPath);
      map[avatarPath] = data.publicUrl;
    }

    if (docPaths.length) {
      supabase.storage
        .from("driver-docs")
        .createSignedUrls(docPaths, 60 * 60 * 24)
        .then(({ data }) => {
          data?.forEach((d, i) => { if (d.signedUrl) map[docPaths[i]] = d.signedUrl; });
          setUrls({ ...map });
        });
    } else {
      setUrls(map);
    }
  }, [driver?.id, open]);

  const docItems = useMemo(() => {
    if (!driver) return [];
    return DOCS.map(d => {
      const path = driver[d.key] as string | null;
      const expiry = d.expiryKey ? (driver[d.expiryKey] as string | null) : null;
      return { ...d, path, url: path ? urls[path] : undefined, expiry };
    });
  }, [driver, urls]);

  if (!driver) return null;

  const approve = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("drivers")
      .update({ status: "available", verified_at: new Date().toISOString(), verified_by: user?.id })
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
    toast.info("Запит відхилено. Водій має перезаповнити дані.");
    onActioned();
    onOpenChange(false);
  };

  const copyText = async (text: string, label = "Скопійовано") => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label}!`);
    } catch {
      toast.error("Не вдалося скопіювати");
    }
  };

  const download = async (url: string, filename: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const a = document.createElement("a");
      const objUrl = URL.createObjectURL(blob);
      a.href = objUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const shareTelegram = (url: string, label: string) =>
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(`${driver.full_name} — ${label}`)}`, "_blank");
  const shareViber = (url: string, label: string) =>
    window.open(`viber://forward?text=${encodeURIComponent(`${driver.full_name} — ${label}: ${url}`)}`, "_blank");

  const isImage = (path: string) => /\.(jpe?g|png|webp|gif|heic)$/i.test(path);

  const showActions = driver.status === "on_verification";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{driver.full_name}</DialogTitle>
          <DialogDescription>Перевірка профілю та керування документами</DialogDescription>
        </DialogHeader>

        <TooltipProvider delayDuration={200}>
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="overview">Огляд</TabsTrigger>
            <TabsTrigger value="documents">Документи</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <InfoRow label="Телефон" value={driver.phone} onCopy={copyText} />
              <InfoRow label="№ посвідчення" value={driver.license_number} onCopy={copyText} />
              <InfoRow label="РНОКПП" value={driver.tax_id} onCopy={copyText} />
              <InfoRow label="Дата народження" value={driver.birth_date} />
              <InfoRow label="Посвідчення дійсне до" value={driver.license_expiry} />
              <InfoRow label="Медогляд до" value={driver.medical_expiry} />
              <InfoRow label="Тахограф до" value={driver.tacho_expiry} />
              <InfoRow label="Закордонний паспорт до" value={driver.intl_passport_expiry} />
              <InfoRow label="Досвід (років)" value={driver.years_experience?.toString() ?? null} />
              <InfoRow label="ADR" value={driver.adr_certified ? "Так" : "Ні"} />
              <InfoRow label="Контакт у разі НП" value={driver.emergency_contact} onCopy={copyText} />
              <InfoRow label="Адреса" value={driver.address} onCopy={copyText} />
            </div>

            {showActions && (
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
            )}
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {docItems.map(item => (
                <div key={item.key as string} className="rounded-lg border border-border bg-card p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {item.expiry && (
                        <p className="text-xs text-muted-foreground">Дійсно до: {item.expiry}</p>
                      )}
                    </div>
                  </div>

                  {item.path && item.url ? (
                    <>
                      <div className="rounded-md overflow-hidden border bg-muted/30 aspect-[3/2] flex items-center justify-center">
                        {isImage(item.path) ? (
                          <img src={item.url} alt={item.label} className="w-full h-full object-cover" />
                        ) : (
                          <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-secondary underline p-4">
                            Відкрити файл
                          </a>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        <ActionBtn tip="Переглянути" onClick={() => window.open(item.url, "_blank")}>
                          <Eye className="w-3.5 h-3.5" />
                        </ActionBtn>
                        <ActionBtn tip="Завантажити" onClick={() => download(item.url!, `${driver.full_name}-${item.label}`)}>
                          <Download className="w-3.5 h-3.5" />
                        </ActionBtn>
                        <ActionBtn tip="Копіювати посилання" onClick={() => copyText(item.url!, "Посилання скопійовано")}>
                          <LinkIcon className="w-3.5 h-3.5" />
                        </ActionBtn>
                        <ActionBtn tip="Поділитись у Telegram" onClick={() => shareTelegram(item.url!, item.label)}>
                          <Send className="w-3.5 h-3.5" />
                        </ActionBtn>
                        <ActionBtn tip="Поділитись у Viber" onClick={() => shareViber(item.url!, item.label)}>
                          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor"><path d="M12 2C6.5 2 2 6 2 11c0 2.6 1.3 5 3.4 6.6V22l3.5-2c1 .2 2 .4 3.1.4 5.5 0 10-4 10-9s-4.5-9-10-9z"/></svg>
                        </ActionBtn>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 aspect-[3/2] flex flex-col items-center justify-center text-amber-500 gap-1">
                      <FileWarning className="w-5 h-5" />
                      <span className="text-xs font-medium">Відсутній</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
        </TooltipProvider>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value, onCopy }: { label: string; value: string | null | undefined; onCopy?: (t: string, l?: string) => void }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="font-medium truncate">{value || "—"}</span>
      {value && onCopy && (
        <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onCopy(value, `${label} скопійовано`)}>
          <Copy className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}

function ActionBtn({ tip, onClick, children }: { tip: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button size="icon" variant="outline" className="h-7 w-7" onClick={onClick}>{children}</Button>
      </TooltipTrigger>
      <TooltipContent>{tip}</TooltipContent>
    </Tooltip>
  );
}
