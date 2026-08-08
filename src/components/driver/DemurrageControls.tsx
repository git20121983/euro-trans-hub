import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, PackageCheck, Timer } from "lucide-react";
import DemurrageTimer from "@/components/demurrage/DemurrageTimer";
import {
  calcDemurrage, getDemurrageSettings, LEG_LABEL,
  type DemurrageLeg, type DemurrageOrderFields,
} from "@/lib/demurrage";

interface Props {
  order: DemurrageOrderFields & { id: string };
  onUpdated?: (patch: Record<string, unknown>) => void;
}

/** Кнопки «Прибув / Завершив» для завантаження та розвантаження + живий таймер простою */
export default function DemurrageControls({ order, onUpdated }: Props) {
  const [saving, setSaving] = useState(false);
  const { freeHours, rate, currency } = getDemurrageSettings(order);

  const patchOrder = async (patch: Record<string, unknown>, message: string, eventText: string) => {
    setSaving(true);
    const { error } = await supabase.from("orders").update(patch as never).eq("id", order.id);
    if (error) {
      toast.error("Не вдалося зберегти час");
    } else {
      await supabase.from("order_events").insert({
        order_id: order.id,
        event_type: "demurrage",
        description: eventText,
        metadata: patch as never,
      });
      toast.success(message);
      onUpdated?.(patch);
    }
    setSaving(false);
  };

  const arrive = (leg: DemurrageLeg) => {
    const at = new Date().toISOString();
    patchOrder(
      { [`${leg}_arrived_at`]: at },
      `Час прибуття зафіксовано — ${LEG_LABEL[leg].toLowerCase()}`,
      `Прибуття на ${LEG_LABEL[leg].toLowerCase()} — старт відліку простою (безкоштовно ${freeHours} год)`,
    );
  };

  const finish = (leg: DemurrageLeg) => {
    const finishedAt = new Date();
    const arrivedAt = leg === "loading" ? order.loading_arrived_at : order.unloading_arrived_at;
    const calc = calcDemurrage(arrivedAt, finishedAt.getTime(), freeHours, rate);
    const totalHours = Number(order.demurrage_hours ?? 0) + calc.billableHours;
    const totalAmount = Number(order.demurrage_amount ?? 0) + calc.amount;

    patchOrder(
      {
        [`${leg}_finished_at`]: finishedAt.toISOString(),
        demurrage_hours: totalHours,
        demurrage_amount: totalAmount,
        demurrage_currency: currency,
        demurrage_rate: rate,
        free_hours: freeHours,
      },
      calc.amount > 0
        ? `${LEG_LABEL[leg]} завершено. Простій: ${calc.billableHours} год = ${calc.amount} ${currency}`
        : `${LEG_LABEL[leg]} завершено вчасно`,
      calc.amount > 0
        ? `${LEG_LABEL[leg]} завершено. Простій ${calc.billableHours} год × ${rate} ${currency} = ${calc.amount} ${currency}`
        : `${LEG_LABEL[leg]} завершено без простою`,
    );
  };

  const legs: DemurrageLeg[] = ["loading", "unloading"];

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
        <Timer className="w-3 h-3" /> Простій (демередж)
      </p>

      {legs.map((leg) => {
        const arrivedAt = leg === "loading" ? order.loading_arrived_at : order.unloading_arrived_at;
        const finishedAt = leg === "loading" ? order.loading_finished_at : order.unloading_finished_at;

        return (
          <div key={leg} className="space-y-2">
            {arrivedAt && (
              <DemurrageTimer
                label={LEG_LABEL[leg]}
                arrivedAt={arrivedAt}
                finishedAt={finishedAt}
                freeHours={freeHours}
                rate={rate}
                currency={currency}
              />
            )}
            {!arrivedAt ? (
              <Button
                variant="outline"
                className="w-full"
                disabled={saving}
                onClick={() => arrive(leg)}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Timer className="w-4 h-4 mr-2" />}
                Прибув на {leg === "loading" ? "завантаження" : "розвантаження"}
              </Button>
            ) : !finishedAt ? (
              <Button
                className="w-full"
                disabled={saving}
                onClick={() => finish(leg)}
              >
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PackageCheck className="w-4 h-4 mr-2" />}
                {leg === "loading" ? "Завантаження завершено" : "Розвантаження завершено"}
              </Button>
            ) : null}
          </div>
        );
      })}

      {Number(order.demurrage_amount ?? 0) > 0 && (
        <p className="text-[11px] text-amber-300">
          Нараховано простою: {Number(order.demurrage_amount)} {currency} ({Number(order.demurrage_hours ?? 0)} год)
        </p>
      )}
    </div>
  );
}
