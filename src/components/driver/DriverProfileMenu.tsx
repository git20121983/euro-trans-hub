import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Truck as TruckIcon,
  Phone,
  LogOut,
  Route,
  CheckCircle2,
  ShieldCheck,
  Clock,
  AlertCircle,
  Camera,
  Loader2,
  Upload,
} from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;
type Truck = Tables<"trucks">;

interface Props {
  driver: Driver;
  onUpdated: (d: Driver) => void;
}

const extraSchema = z.object({
  years_experience: z.coerce.number().int().min(0).max(60),
  medical_expiry: z.string().min(1, "Вкажіть дату"),
  emergency_contact: z.string().trim().min(5, "Вкажіть контакт").max(120),
  tax_id: z.string().trim().regex(/^\d{10}$/, "РНОКПП — рівно 10 цифр"),
  tacho_expiry: z.string().min(1, "Вкажіть термін дії чіп-карти"),
  intl_passport_expiry: z.string().optional().or(z.literal("")),
});

type DocKey =
  | "id_card_url"
  | "tacho_card_url"
  | "adr_certificate_url"
  | "intl_passport_url"
  | "license_front_url"
  | "license_back_url";

export default function DriverProfileMenu({ driver, onUpdated }: Props) {
  const { signOut } = useAuth();
  const [truck, setTruck] = useState<Truck | null>(null);
  const [stats, setStats] = useState({ totalKm: 0, completed: 0 });
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState<DocKey | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPublicUrl, setAvatarPublicUrl] = useState<string | null>(null);

  const docRefs = useRef<Record<DocKey, HTMLInputElement | null>>({
    id_card_url: null,
    tacho_card_url: null,
    adr_certificate_url: null,
    intl_passport_url: null,
    license_front_url: null,
    license_back_url: null,
  });
  const [docPreviews, setDocPreviews] = useState<Record<string, string>>({});
  const avatarRef = useRef<HTMLInputElement>(null);

  const [yearsExp, setYearsExp] = useState<string>(driver.years_experience?.toString() ?? "");
  const [medExpiry, setMedExpiry] = useState(driver.medical_expiry ?? "");
  const [emergency, setEmergency] = useState(driver.emergency_contact ?? "");
  const [taxId, setTaxId] = useState(driver.tax_id ?? "");
  const [tachoExpiry, setTachoExpiry] = useState(driver.tacho_expiry ?? "");
  const [adrCertified, setAdrCertified] = useState(!!driver.adr_certified);
  const [intlExpiry, setIntlExpiry] = useState(driver.intl_passport_expiry ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Resolve avatar URL
  useEffect(() => {
    if (driver.avatar_url) {
      const { data } = supabase.storage.from("driver-avatars").getPublicUrl(driver.avatar_url);
      setAvatarPublicUrl(`${data.publicUrl}?t=${Date.now()}`);
    } else {
      setAvatarPublicUrl(null);
    }
  }, [driver.avatar_url]);

  // Resolve signed previews for driver-docs files
  useEffect(() => {
    const paths = [
      driver.license_front_url,
      driver.license_back_url,
      driver.selfie_url,
      driver.id_card_url,
      driver.tacho_card_url,
      driver.adr_certificate_url,
      driver.intl_passport_url,
    ].filter(Boolean) as string[];
    if (!paths.length) {
      setDocPreviews({});
      return;
    }
    supabase.storage
      .from("driver-docs")
      .createSignedUrls(paths, 3600)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((d, i) => {
          if (d.signedUrl) map[paths[i]] = d.signedUrl;
        });
        setDocPreviews(map);
      });
  }, [
    driver.license_front_url,
    driver.license_back_url,
    driver.selfie_url,
    driver.id_card_url,
    driver.tacho_card_url,
    driver.adr_certificate_url,
    driver.intl_passport_url,
  ]);

  useEffect(() => {
    (async () => {
      if (driver.assigned_truck_id) {
        const { data } = await supabase
          .from("trucks")
          .select("*")
          .eq("id", driver.assigned_truck_id)
          .maybeSingle();
        setTruck(data ?? null);
      }
      const { data: completed } = await supabase
        .from("orders")
        .select("distance")
        .eq("driver_id", driver.id)
        .eq("status", "completed");
      const totalKm = (completed ?? []).reduce((s, o) => s + Number(o.distance ?? 0), 0);
      setStats({ totalKm, completed: completed?.length ?? 0 });
    })();
  }, [driver.id, driver.assigned_truck_id]);

  // Verification %
  const checks = useMemo(() => {
    return [
      { key: "avatar_url", label: "Фото профілю", ok: !!driver.avatar_url },
      { key: "birth_date", label: "Дата народження", ok: !!driver.birth_date },
      { key: "address", label: "Адреса", ok: !!driver.address },
      { key: "license_expiry", label: "Термін посвідчення", ok: !!driver.license_expiry },
      { key: "license_front_url", label: "Фото посв. (лиц.)", ok: !!driver.license_front_url },
      { key: "license_back_url", label: "Фото посв. (зворот)", ok: !!driver.license_back_url },
      { key: "selfie_url", label: "Селфі", ok: !!driver.selfie_url },
      { key: "id_card_url", label: "Фото паспорта/ID", ok: !!driver.id_card_url },
      { key: "tax_id", label: "РНОКПП", ok: !!driver.tax_id },
      { key: "tacho_card_url", label: "Чіп-карта тахографа", ok: !!driver.tacho_card_url && !!driver.tacho_expiry },
      { key: "adr", label: "Допуск ADR", ok: driver.adr_certified ? !!driver.adr_certificate_url : true },
      { key: "intl_passport_url", label: "Закордонний паспорт", ok: !!driver.intl_passport_url },
      { key: "years_experience", label: "Стаж", ok: driver.years_experience != null },
      { key: "medical_expiry", label: "Медогляд", ok: !!driver.medical_expiry },
      { key: "emergency_contact", label: "Екстрений контакт", ok: !!driver.emergency_contact },
    ];
  }, [driver]);

  const completion = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
  const isVerified = !!driver.verified_at && completion === 100;
  const isUnderReview = driver.status === "on_verification";

  const initials = (driver.full_name || "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase();

  const ringColor = isVerified
    ? "stroke-green-500"
    : isUnderReview
    ? "stroke-amber-500"
    : "stroke-red-500";
  const statusBadge = isVerified
    ? { icon: ShieldCheck, label: "Верифіковано", cls: "bg-green-500/15 text-green-300 border-green-500/30" }
    : isUnderReview
    ? { icon: Clock, label: "На перевірці", cls: "bg-amber-500/15 text-amber-300 border-amber-500/30" }
    : { icon: AlertCircle, label: `${completion}% завершено`, cls: "bg-red-500/15 text-red-300 border-red-500/30" };
  const StatusIcon = statusBadge.icon;

  const handleAvatarUpload = async (file: File) => {
    setUploadingAvatar(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${driver.id}/avatar.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("driver-avatars")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingAvatar(false);
      toast.error(`Помилка: ${upErr.message}`);
      return;
    }
    const { data, error } = await supabase
      .from("drivers")
      .update({ avatar_url: path })
      .eq("id", driver.id)
      .select("*")
      .single();
    setUploadingAvatar(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) onUpdated(data);
    toast.success("Фото профілю оновлено");
  };

  const handleDocUpload = async (key: DocKey, fileName: string, file: File) => {
    setUploadingDoc(key);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${driver.id}/${fileName}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from("driver-docs")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });
    if (upErr) {
      setUploadingDoc(null);
      toast.error(`Помилка: ${upErr.message}`);
      return;
    }
    const { data, error } = await supabase
      .from("drivers")
      .update({ [key]: path } as Partial<Driver>)
      .eq("id", driver.id)
      .select("*")
      .single();
    setUploadingDoc(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) onUpdated(data);
    toast.success("Документ завантажено");
  };

  const submitExtra = async () => {
    const result = extraSchema.safeParse({
      years_experience: yearsExp,
      medical_expiry: medExpiry,
      emergency_contact: emergency,
      tax_id: taxId,
      tacho_expiry: tachoExpiry,
      intl_passport_expiry: intlExpiry,
    });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => (errs[e.path[0] as string] = e.message));
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    const updates: Partial<Driver> = {
      years_experience: result.data.years_experience,
      medical_expiry: result.data.medical_expiry,
      emergency_contact: result.data.emergency_contact,
      tax_id: result.data.tax_id,
      tacho_expiry: result.data.tacho_expiry,
      adr_certified: adrCertified,
      intl_passport_expiry: intlExpiry || null,
    };

    const willBeComplete =
      !!driver.avatar_url &&
      !!driver.birth_date &&
      !!driver.address &&
      !!driver.license_expiry &&
      !!driver.license_front_url &&
      !!driver.license_back_url &&
      !!driver.selfie_url &&
      !!driver.id_card_url &&
      !!driver.tacho_card_url &&
      !!driver.intl_passport_url &&
      (!adrCertified || !!driver.adr_certificate_url);

    if (willBeComplete && !driver.verified_at) {
      updates.status = "on_verification";
      updates.details_submitted_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from("drivers")
      .update(updates)
      .eq("id", driver.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    if (data) onUpdated(data);
    toast.success(willBeComplete && !driver.verified_at ? "Надіслано на перевірку" : "Збережено");
    setOpenDialog(false);
  };

  const radius = 18;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (completion / 100) * circ;

  // Reusable doc upload row
  const DocRow = ({
    docKey,
    fileName,
    label,
    hint,
    accept = "image/*",
    capture = "environment" as const,
  }: {
    docKey: DocKey;
    fileName: string;
    label: string;
    hint?: string;
    accept?: string;
    capture?: "environment" | "user";
  }) => {
    const url = driver[docKey];
    const isUploading = uploadingDoc === docKey;
    const previewUrl = url ? docPreviews[url] : null;
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        {hint && <p className="text-[11px] text-muted-foreground -mt-1">{hint}</p>}
        <input
          ref={(el) => (docRefs.current[docKey] = el)}
          type="file"
          accept={accept}
          capture={capture}
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleDocUpload(docKey, fileName, f);
            e.target.value = "";
          }}
        />
        {previewUrl && (
          <a href={previewUrl} target="_blank" rel="noreferrer" className="block">
            <img
              src={previewUrl}
              alt={label}
              className="rounded-md border border-border w-full aspect-[3/2] object-cover"
            />
          </a>
        )}
        <Button
          type="button"
          variant={url ? "outline" : "default"}
          className="w-full"
          disabled={isUploading}
          onClick={() => docRefs.current[docKey]?.click()}
        >
          {isUploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Завантаження...</>
          ) : url ? (
            <><Upload className="w-4 h-4 mr-2" /> Замінити фото</>
          ) : (
            <><Camera className="w-4 h-4 mr-2" /> Зробити фото</>
          )}
        </Button>
      </div>
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="relative outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full">
            <Avatar className="w-11 h-11 border border-white/15">
              {avatarPublicUrl && <AvatarImage src={avatarPublicUrl} alt={driver.full_name} />}
              <AvatarFallback className="bg-primary/20 text-primary font-semibold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
            <svg className="absolute -inset-1 w-[calc(100%+8px)] h-[calc(100%+8px)] -rotate-90 pointer-events-none" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r={radius} fill="none" className="stroke-white/10" strokeWidth="2.5" />
              <circle
                cx="22"
                cy="22"
                r={radius}
                fill="none"
                className={ringColor}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeDasharray={circ}
                strokeDashoffset={offset}
              />
            </svg>
            {isVerified && (
              <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-background flex items-center justify-center">
                <CheckCircle2 className="w-2.5 h-2.5 text-white" />
              </span>
            )}
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-72 bg-card/95 backdrop-blur-xl border-white/10">
          <DropdownMenuLabel className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar className="w-10 h-10">
                {avatarPublicUrl && <AvatarImage src={avatarPublicUrl} alt={driver.full_name} />}
                <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-semibold text-sm truncate">{driver.full_name}</p>
                <p className="text-[11px] text-muted-foreground flex items-center gap-1 truncate">
                  <Phone className="w-3 h-3 shrink-0" /> {driver.phone}
                </p>
              </div>
            </div>
            <div className={`mt-3 inline-flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-full border ${statusBadge.cls}`}>
              <StatusIcon className="w-3 h-3" />
              {statusBadge.label}
            </div>
          </DropdownMenuLabel>

          <DropdownMenuSeparator />

          <div className="px-2 py-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
              Мій автомобіль
            </p>
            {truck ? (
              <div className="px-2 py-1.5 rounded-md bg-white/[0.03] flex items-center gap-2">
                <TruckIcon className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{truck.model}</p>
                  <p className="text-[11px] text-muted-foreground font-mono">{truck.plate_number}</p>
                </div>
              </div>
            ) : (
              <div className="px-2 py-1.5 text-xs text-muted-foreground italic">Авто не призначено</div>
            )}
          </div>

          <DropdownMenuSeparator />

          <div className="px-2 py-2 grid grid-cols-2 gap-2">
            <div className="px-2 py-2 rounded-md bg-white/[0.03] flex items-center gap-2">
              <Route className="w-4 h-4 text-blue-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Всього км</p>
                <p className="text-sm font-semibold">{stats.totalKm.toLocaleString("uk-UA")}</p>
              </div>
            </div>
            <div className="px-2 py-2 rounded-md bg-white/[0.03] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground">Рейсів</p>
                <p className="text-sm font-semibold">{stats.completed}</p>
              </div>
            </div>
          </div>

          {!isVerified && (
            <>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => setOpenDialog(true)}
                >
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  Дозаповнити профіль
                </Button>
              </div>
            </>
          )}

          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={signOut}
            className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Вийти
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Full registration dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-primary" />
              Повна реєстрація
            </DialogTitle>
            <DialogDescription>
              Заповніть профіль для отримання статусу «Верифіковано» ({completion}%)
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Avatar uploader */}
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border bg-muted/20 p-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-primary/30">
                  {avatarPublicUrl && <AvatarImage src={avatarPublicUrl} alt={driver.full_name} />}
                  <AvatarFallback className="bg-primary/20 text-primary text-xl font-semibold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <input
                ref={avatarRef}
                type="file"
                accept="image/*"
                capture="user"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleAvatarUpload(f);
                  e.target.value = "";
                }}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingAvatar}
                onClick={() => avatarRef.current?.click()}
              >
                <Camera className="w-4 h-4 mr-2" />
                {driver.avatar_url ? "Змінити фото профілю" : "Завантажити фото профілю"}
              </Button>
            </div>

            {/* Checklist */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 space-y-1.5">
              {checks.map((c) => (
                <div key={c.key} className="flex items-center gap-2 text-xs">
                  {c.ok ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  )}
                  <span className={c.ok ? "text-foreground" : "text-muted-foreground"}>
                    {c.label}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <p className="text-sm font-semibold">Посвідчення водія</p>
              <DocRow
                docKey="license_front_url"
                fileName="license_front"
                label="Фото посвідчення (Передня сторона)"
                hint="Сфотографуйте передню частину з вашим фото"
              />
              <DocRow
                docKey="license_back_url"
                fileName="license_back"
                label="Фото посвідчення (Зворотна сторона)"
                hint="Сфотографуйте зворотну частину з категоріями"
              />
            </div>

            <DocRow docKey="id_card_url" fileName="id_card" label="Паспорт / ID-картка" />

            <div className="space-y-2">
              <Label htmlFor="taxid">РНОКПП (ідентифікаційний код) *</Label>
              <Input
                id="taxid"
                inputMode="numeric"
                maxLength={10}
                value={taxId}
                onChange={(e) => setTaxId(e.target.value.replace(/\D/g, ""))}
                placeholder="1234567890"
              />
              {errors.tax_id && <p className="text-xs text-destructive">{errors.tax_id}</p>}
            </div>

            <DocRow docKey="tacho_card_url" fileName="tacho_card" label="Чіп-карта водія (тахограф)" />
            <div className="space-y-2">
              <Label htmlFor="tachoexp">Чіп-карта дійсна до *</Label>
              <Input
                id="tachoexp"
                type="date"
                value={tachoExpiry}
                onChange={(e) => setTachoExpiry(e.target.value)}
              />
              {errors.tacho_expiry && <p className="text-xs text-destructive">{errors.tacho_expiry}</p>}
            </div>

            <div className="rounded-lg border border-border p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adr" className="text-sm">Допуск ADR (небезпечні вантажі)</Label>
                  <p className="text-[11px] text-muted-foreground">Сертифікат на перевезення ADR</p>
                </div>
                <Switch id="adr" checked={adrCertified} onCheckedChange={setAdrCertified} />
              </div>
              {adrCertified && (
                <DocRow docKey="adr_certificate_url" fileName="adr_certificate" label="Фото сертифіката ADR" />
              )}
            </div>

            <DocRow docKey="intl_passport_url" fileName="intl_passport" label="Закордонний паспорт" />
            <div className="space-y-2">
              <Label htmlFor="intlexp">Закордонний паспорт дійсний до</Label>
              <Input
                id="intlexp"
                type="date"
                value={intlExpiry}
                onChange={(e) => setIntlExpiry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="yexp">Стаж водіння (років)</Label>
              <Input
                id="yexp"
                type="number"
                min={0}
                max={60}
                value={yearsExp}
                onChange={(e) => setYearsExp(e.target.value)}
                placeholder="5"
              />
              {errors.years_experience && <p className="text-xs text-destructive">{errors.years_experience}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="medexp">Медогляд дійсний до</Label>
              <Input
                id="medexp"
                type="date"
                value={medExpiry}
                onChange={(e) => setMedExpiry(e.target.value)}
              />
              {errors.medical_expiry && <p className="text-xs text-destructive">{errors.medical_expiry}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="emerg">Екстрений контакт</Label>
              <Input
                id="emerg"
                value={emergency}
                onChange={(e) => setEmergency(e.target.value)}
                placeholder="Ім'я, телефон родича"
              />
              {errors.emergency_contact && <p className="text-xs text-destructive">{errors.emergency_contact}</p>}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(false)}>Закрити</Button>
            <Button onClick={submitExtra} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Зберегти
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
