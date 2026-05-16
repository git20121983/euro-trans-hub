import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { z } from "zod";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, CheckCircle, Loader2, Upload, ArrowRight, ArrowLeft, Clock, Truck } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Driver = Tables<"drivers">;

interface Props {
  driver: Driver;
  onUpdated: (d: Driver) => void;
}

const detailsSchema = z.object({
  birth_date: z.string().min(1, "Вкажіть дату народження"),
  address: z.string().trim().min(5, "Введіть повну адресу").max(300),
  license_expiry: z.string().min(1, "Вкажіть термін дії посвідчення"),
});

type PhotoKey = "license_front_url" | "license_back_url" | "selfie_url";

const PHOTO_FIELDS: Array<{ key: PhotoKey; label: string; fileName: string; hint: string }> = [
  { key: "license_front_url", label: "Лицьовий бік посвідчення", fileName: "license_front", hint: "Фото з боку з фотографією" },
  { key: "license_back_url", label: "Зворотній бік посвідчення", fileName: "license_back", hint: "Фото з боку з категоріями" },
  { key: "selfie_url", label: "Фото профілю (селфі)", fileName: "selfie", hint: "Чітке фото обличчя" },
];

export default function DriverOnboarding({ driver, onUpdated }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(driver.birth_date ? (allPhotosDone(driver) ? 3 : 2) : 1);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<PhotoKey | null>(null);

  const [birthDate, setBirthDate] = useState(driver.birth_date ?? "");
  const [address, setAddress] = useState(driver.address ?? "");
  const [licenseExpiry, setLicenseExpiry] = useState(driver.license_expiry ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputs = useRef<Record<PhotoKey, HTMLInputElement | null>>({
    license_front_url: null,
    license_back_url: null,
    selfie_url: null,
  });

  const isOnVerification = driver.status === "on_verification";
  const progress = isOnVerification ? 100 : step === 1 ? 33 : step === 2 ? 66 : 100;

  function allPhotosDone(d: Driver) {
    return !!(d.license_front_url && d.license_back_url && d.selfie_url);
  }

  const saveStep1 = async () => {
    const result = detailsSchema.safeParse({ birth_date: birthDate, address, license_expiry: licenseExpiry });
    if (!result.success) {
      const errs: Record<string, string> = {};
      result.error.errors.forEach((e) => { errs[e.path[0] as string] = e.message; });
      setErrors(errs);
      return;
    }
    setErrors({});
    setSaving(true);
    const { data, error } = await supabase
      .from("drivers")
      .update({ birth_date: birthDate, address, license_expiry: licenseExpiry })
      .eq("id", driver.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(`Помилка: ${error.message}`);
      return;
    }
    if (data) onUpdated(data);
    setStep(2);
  };

  const handleUpload = async (key: PhotoKey, fileName: string, file: File) => {
    setUploadingKey(key);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${driver.id}/${fileName}.${ext}`;

    const { error: upErr } = await supabase.storage
      .from("driver-docs")
      .upload(path, file, { cacheControl: "3600", upsert: true, contentType: file.type });

    if (upErr) {
      setUploadingKey(null);
      toast.error(`Помилка завантаження: ${upErr.message}`);
      return;
    }

    const update: Partial<Driver> = { [key]: path };
    const { data, error } = await supabase
      .from("drivers")
      .update(update)
      .eq("id", driver.id)
      .select("*")
      .single();

    setUploadingKey(null);
    if (error) {
      toast.error(`Помилка збереження: ${error.message}`);
      return;
    }
    if (data) onUpdated(data);
    toast.success("Фото завантажено");
  };

  const submitForVerification = async () => {
    setSaving(true);
    const { data, error } = await supabase
      .from("drivers")
      .update({
        status: "on_verification",
        details_submitted_at: new Date().toISOString(),
      })
      .eq("id", driver.id)
      .select("*")
      .single();
    setSaving(false);
    if (error) {
      toast.error(`Помилка: ${error.message}`);
      return;
    }
    if (data) onUpdated(data);
    toast.success("Дані надіслано на перевірку");
  };

  // Verification waiting screen
  if (isOnVerification) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center mx-auto animate-pulse">
            <Clock className="w-10 h-10 text-amber-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-2">Очікуйте на перевірку</h2>
            <p className="text-muted-foreground">
              Ваші документи отримані. Адміністратор перевірить їх найближчим часом і відкриє доступ до системи.
            </p>
          </div>
          <Progress value={100} className="h-2" />
          <p className="text-xs text-muted-foreground">Зазвичай перевірка займає до 24 годин</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-background/70 backdrop-blur-xl border-b border-white/10 px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto space-y-3">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-primary" />
            <h1 className="font-bold">Завершення профілю</h1>
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Крок {step} з 3</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-24 animate-fade-in">
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Особисті дані</h2>
              <p className="text-sm text-muted-foreground">Заповніть свої контактні дані</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="birth_date">Дата народження *</Label>
              <Input id="birth_date" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              {errors.birth_date && <p className="text-xs text-destructive">{errors.birth_date}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Адреса проживання *</Label>
              <Input
                id="address"
                placeholder="м. Київ, вул. Хрещатик, 1"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
              {errors.address && <p className="text-xs text-destructive">{errors.address}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="license_expiry">Термін дії посвідчення *</Label>
              <Input
                id="license_expiry"
                type="date"
                value={licenseExpiry}
                onChange={(e) => setLicenseExpiry(e.target.value)}
              />
              {errors.license_expiry && <p className="text-xs text-destructive">{errors.license_expiry}</p>}
            </div>

            <Button onClick={saveStep1} disabled={saving} className="w-full" size="lg">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ArrowRight className="w-4 h-4 mr-2" />}
              Далі
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Документи</h2>
              <p className="text-sm text-muted-foreground">Зробіть фото або завантажте з галереї</p>
            </div>

            {PHOTO_FIELDS.map((f) => {
              const url = driver[f.key];
              const isUploading = uploadingKey === f.key;
              return (
                <div key={f.key} className="rounded-xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium text-sm">{f.label}</p>
                      <p className="text-xs text-muted-foreground">{f.hint}</p>
                    </div>
                    {url && <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />}
                  </div>

                  <input
                    ref={(el) => (fileInputs.current[f.key] = el)}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUpload(f.key, f.fileName, file);
                      e.target.value = "";
                    }}
                  />

                  <Button
                    onClick={() => fileInputs.current[f.key]?.click()}
                    disabled={isUploading}
                    variant={url ? "outline" : "default"}
                    className="w-full"
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
            })}

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Назад
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!allPhotosDone(driver)}
                className="flex-1"
              >
                Далі <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold">Підтвердження</h2>
              <p className="text-sm text-muted-foreground">Перевірте дані перед відправкою</p>
            </div>

            <div className="rounded-xl border border-border bg-card p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">ПІБ:</span><span className="font-medium">{driver.full_name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Телефон:</span><span className="font-medium">{driver.phone}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Посвідчення:</span><span className="font-medium">{driver.license_number}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Дата народження:</span><span className="font-medium">{driver.birth_date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Адреса:</span><span className="font-medium text-right">{driver.address}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Дійсне до:</span><span className="font-medium">{driver.license_expiry}</span></div>
              <div className="flex items-center gap-1 pt-2 text-green-600">
                <CheckCircle className="w-4 h-4" /> Усі 3 фото завантажено
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                <ArrowLeft className="w-4 h-4 mr-2" /> Назад
              </Button>
              <Button onClick={submitForVerification} disabled={saving} className="flex-1">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Надіслати на перевірку
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
