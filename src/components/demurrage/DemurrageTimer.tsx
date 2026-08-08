import { useEffect, useState } from "react";
import { AlertTriangle, Timer } from "lucide-react";
import { calcDemurrage, formatDuration } from "@/lib/demurrage";

interface DemurrageTimerProps {
  label: string;
  arrivedAt: string | null | undefined;
  finishedAt?: string | null;
  freeHours: number;
  rate: number;
  currency: string;
  compact?: boolean;
}

/** Живий лічильник простою: тікає щосекунди, червоніє після вичерпання безкоштовних годин */
export default function DemurrageTimer({
  label, arrivedAt, finishedAt, freeHours, rate, currency, compact,
}: DemurrageTimerProps) {
  const isRunning = Boolean(arrivedAt) && !finishedAt;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  if (!arrivedAt) return null;

  const endMs = finishedAt ? new Date(finishedAt).getTime() : now;
  const calc = calcDemurrage(arrivedAt, endMs, freeHours, rate);

  const tone = calc.isOverdue
    ? "border-red-500/40 bg-red-500/10 text-red-300"
    : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300";

  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-mono font-semibold ${tone} ${
          isRunning && calc.isOverdue ? "animate-pulse" : ""
        }`}
      >
        <Timer className="w-2.5 h-2.5" />
        {formatDuration(calc.elapsedMs)}
        {calc.amount > 0 && <span className="font-sans">+{calc.amount} {currency}</span>}
      </span>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${tone} ${isRunning && calc.isOverdue ? "animate-pulse" : ""}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[10px] uppercase tracking-wider opacity-80 flex items-center gap-1">
          <Timer className="w-3 h-3" /> {label}
          {finishedAt && <span className="opacity-70">(завершено)</span>}
        </span>
        <span className="font-mono text-lg font-bold tabular-nums">{formatDuration(calc.elapsedMs)}</span>
      </div>
      <div className="mt-1 text-[11px] opacity-90">
        {calc.isOverdue ? (
          <span className="flex items-center gap-1 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Простій {calc.billableHours} год × {rate} {currency} = {calc.amount} {currency}
          </span>
        ) : (
          <span>
            Безкоштовно ще {formatDuration(calc.remainingFreeMs)} (ліміт {freeHours} год)
          </span>
        )}
      </div>
    </div>
  );
}
