import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, Shield, MapPin, ExternalLink } from "lucide-react";
import { CUSTOMS_BY_REGION, CUSTOMS_REGIONS } from "@/lib/customsCheckpoints";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  saving?: boolean;
  onConfirm: (data: { region: string; checkpoint: string; country: string; coords?: string }) => void;
}

export default function CustomsSelectModal({ open, onOpenChange, saving, onConfirm }: Props) {
  const [region, setRegion] = useState<string>("");
  const [checkpoint, setCheckpoint] = useState<string>("");

  const points = region ? CUSTOMS_BY_REGION[region] ?? [] : [];
  const selected = points.find((p) => p.name === checkpoint);

  const handleConfirm = () => {
    if (!region || !selected) return;
    onConfirm({ region, checkpoint: selected.name, country: selected.country, coords: selected.coords });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRegion(""); setCheckpoint(""); } }}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-violet-400" /> Вибір митниці
          </DialogTitle>
          <DialogDescription>
            Оберіть область та пункт пропуску, на якому ви знаходитесь.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label>Область</Label>
            <Select value={region} onValueChange={(v) => { setRegion(v); setCheckpoint(""); }}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Оберіть область" />
              </SelectTrigger>
              <SelectContent>
                {CUSTOMS_REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Митний пост / пункт пропуску</Label>
            <Select value={checkpoint} onValueChange={setCheckpoint} disabled={!region}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder={region ? "Оберіть пункт пропуску" : "Спочатку оберіть область"} />
              </SelectTrigger>
              <SelectContent>
                {points.map((p) => (
                  <SelectItem key={p.name} value={p.name}>
                    {p.name} — {p.country}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selected && (
            <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-3 flex items-start gap-2">
              <MapPin className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-foreground">{selected.name}</p>
                <p className="text-xs text-muted-foreground">{region} обл. · {selected.country}</p>
              </div>
              {selected.coords && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${selected.coords}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-violet-400 shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex flex-col gap-2 pt-2 sm:flex-row">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
            Скасувати
          </Button>
          <Button onClick={handleConfirm} disabled={!selected || saving} className="w-full sm:w-auto">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Підтвердити
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
