import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Camera, Loader2, ScanLine, CheckCircle2, XCircle, AlertTriangle, Send,
} from "lucide-react";

export interface CmrResult {
  is_document: boolean;
  stamp_verified: boolean;
  signature_verified: boolean;
  quality: "good" | "blurry" | "dark" | "cropped";
  notes: string;
}

const QUALITY_LABEL: Record<string, string> = {
  good: "Якість добра",
  blurry: "Фото розмите",
  dark: "Замало світла",
  cropped: "Документ обрізаний",
};

interface Props {
  orderId: string;
  orderNumber: string;
  cmrUrl?: string | null;
  stampVerified?: boolean | null;
  signatureVerified?: boolean | null;
  onVerified?: () => void;
}

export default function CmrScanner({
  orderId, orderNumber, cmrUrl, stampVerified, signatureVerified, onVerified,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<CmrResult | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);

  const alreadyVerified = !!cmrUrl && !!stampVerified && !!signatureVerified;

  const pick = (f: File | null) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setUploadedPath(null);
    setPreview(URL.createObjectURL(f));
  };

  const scan = async () => {
    if (!file) return;
    setScanning(true);
    try {
      const path = `order_${orderId}_cmr.jpg`;
      const { error: upErr } = await supabase.storage
        .from("cmr-documents")
        .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });
      if (upErr) throw new Error(upErr.message);
      setUploadedPath(path);

      const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Не вдалося прочитати фото"));
        reader.readAsDataURL(file);
      });

      const { data, error } = await supabase.functions.invoke("verify-cmr", {
        body: { imageBase64 },
      });
      if (error) throw new Error(error.message);
      const res = data as CmrResult;
      setResult(res);

      if (res.is_document && res.stamp_verified && res.signature_verified && res.quality === "good") {
        await commit(path, res);
      } else {
        toast.warning("Перевірте документ перед відправкою");
      }
    } catch (e) {
      toast.error("Не вдалося перевірити документ", { description: String(e).slice(0, 120) });
    } finally {
      setScanning(false);
    }
  };

  const commit = async (path: string, res: CmrResult | null) => {
    setSaving(true);
    const { error } = await supabase
      .from("orders")
      .update({
        cmr_document_url: path,
        cmr_stamp_verified: !!res?.stamp_verified,
        cmr_signature_verified: !!res?.signature_verified,
        cmr_quality: res?.quality ?? null,
        cmr_notes: res?.notes ?? null,
        cmr_verified_at: new Date().toISOString(),
        status: "awaiting_payment",
      } as never)
      .eq("id", orderId);

    if (error) {
      toast.error("Не вдалося зберегти документ");
    } else {
      await supabase.from("order_events").insert({
        order_id: orderId,
        event_type: "cmr_scan",
        description: res?.stamp_verified && res?.signature_verified
          ? "CMR завантажено та підтверджено AI (печатка + підпис)"
          : "CMR завантажено водієм (без повного AI-підтвердження)",
        metadata: (res ?? {}) as never,
      });
      toast.success(`CMR по рейсу ${orderNumber} надіслано в офіс`);
      setPreview(null);
      setFile(null);
      onVerified?.();
    }
    setSaving(false);
  };

  if (alreadyVerified && !preview) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <p className="text-xs text-emerald-300 font-medium">CMR надіслано та підтверджено</p>
        <Button variant="ghost" size="sm" className="ml-auto text-xs" onClick={() => inputRef.current?.click()}>
          Перезняти
        </Button>
        <input
          ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
          onChange={(e) => pick(e.target.files?.[0] ?? null)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <ScanLine className="w-3 h-3" /> Сканування CMR / ТТН
      </p>

      <input
        ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden"
        onChange={(e) => pick(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-xl border border-white/10 bg-black">
          <img src={preview} alt="Скан CMR" className="w-full max-h-72 object-contain" />
          {/* Рамка кадрування */}
          <div className="pointer-events-none absolute inset-4 rounded-lg border-2 border-dashed border-amber-400/70" />
          {scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/70">
              <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
              <p className="text-xs text-white">AI перевіряє печатку та підпис…</p>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-white/15 bg-white/5 p-6 flex flex-col items-center gap-2 hover:bg-white/10 transition"
        >
          <Camera className="w-6 h-6 text-amber-400" />
          <span className="text-sm font-semibold">Сканувати CMR</span>
          <span className="text-[11px] text-muted-foreground text-center">
            Розмістіть аркуш повністю в кадрі, при денному світлі
          </span>
        </button>
      )}

      {result && (
        <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2 text-xs">
          <Row ok={result.is_document} label="Це транспортний документ" />
          <Row ok={result.stamp_verified} label="Печатка отримувача" />
          <Row ok={result.signature_verified} label="Підпис" />
          <div className="flex items-center gap-2">
            {result.quality === "good"
              ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              : <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
            <span>{QUALITY_LABEL[result.quality] ?? result.quality}</span>
          </div>
          {result.notes && <p className="text-muted-foreground">{result.notes}</p>}
        </div>
      )}

      {preview && (
        <div className="flex gap-2">
          {!result ? (
            <Button className="flex-1" onClick={scan} disabled={scanning}>
              {scanning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ScanLine className="w-4 h-4 mr-2" />}
              Перевірити та надіслати
            </Button>
          ) : (
            <Button
              className="flex-1"
              variant="secondary"
              disabled={saving}
              onClick={() => uploadedPath && commit(uploadedPath, result)}
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Все одно надіслати
            </Button>
          )}
          <Button variant="ghost" onClick={() => inputRef.current?.click()} disabled={scanning || saving}>
            Перезняти
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2">
      {ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}
      <span>{label}</span>
    </div>
  );
}
