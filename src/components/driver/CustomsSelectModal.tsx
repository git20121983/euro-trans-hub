import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Shield, MapPin, ExternalLink, Search } from "lucide-react";
import { CUSTOMS_BY_REGION, CUSTOMS_REGIONS, CustomsCheckpoint } from "@/lib/customsCheckpoints";

interface SearchablePoint extends CustomsCheckpoint {
  region: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  saving?: boolean;
  onConfirm: (data: { region: string; checkpoint: string; country: string; coords?: string }) => void;
}

export default function CustomsSelectModal({ open, onOpenChange, saving, onConfirm }: Props) {
  const [region, setRegion] = useState<string>("");
  const [checkpoint, setCheckpoint] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const allPoints = useMemo<SearchablePoint[]>(() => {
    return CUSTOMS_REGIONS.flatMap((r) =>
      (CUSTOMS_BY_REGION[r] ?? []).map((p) => ({ ...p, region: r }))
    );
  }, []);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const filteredPoints = useMemo<SearchablePoint[]>(() => {
    if (!normalizedSearch) return [];
    return allPoints.filter((p) =>
      p.name.toLowerCase().includes(normalizedSearch) ||
      p.country.toLowerCase().includes(normalizedSearch) ||
      p.region.toLowerCase().includes(normalizedSearch)
    );
  }, [allPoints, normalizedSearch]);

  const points = region ? CUSTOMS_BY_REGION[region] ?? [] : [];
  const selected = allPoints.find((p) => p.region === region && p.name === checkpoint);

  const handleConfirm = () => {
    if (!region || !selected) return;
    onConfirm({ region, checkpoint: selected.name, country: selected.country, coords: selected.coords });
  };

  const handleSelectCheckpoint = (name: string) => {
    if (normalizedSearch && filteredPoints.length > 0) {
      const found = filteredPoints.find((p) => p.name === name);
      if (found) {
        setRegion(found.region);
        setCheckpoint(found.name);
        return;
      }
    }
    setCheckpoint(name);
  };

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setRegion(""); setCheckpoint(""); setSearchQuery(""); } }}>
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
            <Label htmlFor="customs-search">Пошук пункту пропуску</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="customs-search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Наприклад: Краковець, Румунія..."
                className="pl-9 h-10"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground"
                >
                  Очистити
                </button>
              )}
            </div>
          </div>

          {normalizedSearch ? (
            <div className="flex flex-col gap-1.5">
              <Label>Результати пошуку ({filteredPoints.length})</Label>
              {filteredPoints.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2">Нічого не знайдено. Спробуйте інший запит.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-lg border border-border divide-y divide-border/60">
                  {filteredPoints.map((p) => {
                    const active = p.region === region && p.name === checkpoint;
                    return (
                      <button
                        key={`${p.region}-${p.name}`}
                        type="button"
                        onClick={() => { setRegion(p.region); setCheckpoint(p.name); }}
                        className={`w-full text-left px-3 py-2 transition-colors ${active ? "bg-violet-500/15" : "hover:bg-muted/50"}`}
                      >
                        <p className="text-sm font-medium text-foreground">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.region} обл. · {p.country}</p>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <>
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
                    <SelectValue placeholder={region ? "Оберіть пункт пропуску" : "Спочатку оберіть область або скористайтесь пошуком"} />
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
            </>
          )}


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
