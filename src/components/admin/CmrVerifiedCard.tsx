import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BadgeCheck, AlertTriangle, Eye, FileText, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  orderId: string;
  orderNumber: string;
  cmrUrl?: string | null;
  stampVerified?: boolean | null;
  signatureVerified?: boolean | null;
  quality?: string | null;
  notes?: string | null;
  verifiedAt?: string | null;
  aiResult?: Record<string, unknown> | null;
}

const QUALITY_LABEL: Record<string, string> = {
  good: "добра", clear: "добра", blurry: "розмите", dark: "темне", cropped: "обрізане",
};

export default function CmrVerifiedCard({
  orderNumber, cmrUrl, stampVerified, signatureVerified, quality, notes, verifiedAt, aiResult,
}: Props) {
  const [open, setOpen] = useState(false);
  const [signed, setSigned] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open || !cmrUrl) return;
    setLoading(true);
    supabase.storage.from("cmr-documents").createSignedUrl(cmrUrl, 3600).then(({ data }) => {
      setSigned(data?.signedUrl ?? null);
      setLoading(false);
    });
  }, [open, cmrUrl]);

  if (!cmrUrl) return null;

  const fullyVerified = !!stampVerified && !!signatureVerified;
  const ai = (aiResult ?? {}) as { is_document?: boolean; notes?: string };

  return (
    <div
      className={`rounded-xl border p-3 space-y-2 ${
        fullyVerified ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"
      }`}
    >
      <div className="flex items-center gap-2">
        {fullyVerified
          ? <BadgeCheck className="w-4 h-4 text-emerald-400" />
          : <AlertTriangle className="w-4 h-4 text-amber-400" />}
        <span className={`text-xs font-semibold ${fullyVerified ? "text-emerald-300" : "text-amber-300"}`}>
          {fullyVerified ? "CMR AI-Verified" : "CMR потребує перевірки"}
        </span>
        {verifiedAt && (
          <span className="ml-auto text-[10px] text-muted-foreground">
            {new Date(verifiedAt).toLocaleString("uk-UA")}
          </span>
        )}
      </div>

      <div className="rounded-lg border border-border/50 bg-background/30 divide-y divide-border/40 text-[11px]">
        <Detail label="Це транспортний документ" ok={ai.is_document ?? true} />
        <Detail label="Печатка отримувача (гр. 24)" ok={!!stampVerified} />
        <Detail label="Підпис отримувача" ok={!!signatureVerified} />
        <div className="flex items-center justify-between px-2 py-1.5">
          <span className="text-muted-foreground">Якість фото</span>
          <span className="font-medium">{quality ? (QUALITY_LABEL[quality] ?? quality) : "—"}</span>
        </div>
        {(notes || ai.notes) && (
          <p className="px-2 py-1.5 text-muted-foreground">{notes || String(ai.notes)}</p>
        )}
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setOpen(true)}>
          <Eye className="w-3.5 h-3.5" /> Переглянути
        </Button>
        <Button size="sm" className="gap-1 text-xs" onClick={() => navigate("/admin/finance")}>
          <FileText className="w-3.5 h-3.5" /> Створити рахунок
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>CMR — {orderNumber}</DialogTitle>
          </DialogHeader>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : signed ? (
            <img src={signed} alt={`CMR ${orderNumber}`} className="w-full rounded-lg" />
          ) : (
            <p className="text-sm text-muted-foreground">Не вдалося завантажити документ</p>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Detail({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between px-2 py-1.5">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${ok ? "text-emerald-400" : "text-red-400"}`}>
        {ok ? "виявлено" : "не виявлено"}
      </span>
    </div>
  );
}
