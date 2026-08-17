// Демередж / простій: облік часу на завантаженні та розвантаженні

export const DEFAULT_FREE_HOURS = 4;
export const DEFAULT_DEMURRAGE_RATE = 25;
export const DEFAULT_DEMURRAGE_CURRENCY = "EUR";

export interface DemurrageOrderFields {
  loading_arrived_at?: string | null;
  loading_finished_at?: string | null;
  unloading_arrived_at?: string | null;
  unloading_finished_at?: string | null;
  free_hours?: number | null;
  demurrage_rate?: number | null;
  demurrage_currency?: string | null;
  demurrage_hours?: number | null;
  demurrage_amount?: number | null;
  loading_free_hours?: number | null;
  loading_demurrage_rate?: number | null;
  unloading_free_hours?: number | null;
  unloading_demurrage_rate?: number | null;
}

export interface DemurrageCalc {
  elapsedMs: number;
  elapsedHours: number;
  /** Платні (понаднормові) години — округлення вгору до повної години */
  billableHours: number;
  amount: number;
  isOverdue: boolean;
  /** Скільки лишилось безкоштовного часу, мс (0 якщо вичерпано) */
  remainingFreeMs: number;
}

export const HOUR_MS = 60 * 60 * 1000;

export function calcDemurrage(
  arrivedAt: string | null | undefined,
  endMs: number,
  freeHours: number,
  rate: number,
): DemurrageCalc {
  if (!arrivedAt) {
    return { elapsedMs: 0, elapsedHours: 0, billableHours: 0, amount: 0, isOverdue: false, remainingFreeMs: 0 };
  }
  const startMs = new Date(arrivedAt).getTime();
  const elapsedMs = Math.max(0, endMs - startMs);
  const elapsedHours = elapsedMs / HOUR_MS;
  const over = Math.max(0, elapsedHours - freeHours);
  const billableHours = over > 0 ? Math.ceil(over) : 0;
  return {
    elapsedMs,
    elapsedHours,
    billableHours,
    amount: billableHours * rate,
    isOverdue: over > 0,
    remainingFreeMs: Math.max(0, freeHours * HOUR_MS - elapsedMs),
  };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function getDemurrageSettings(order: DemurrageOrderFields | null | undefined) {
  return {
    freeHours: Number(order?.free_hours ?? DEFAULT_FREE_HOURS),
    rate: Number(order?.demurrage_rate ?? DEFAULT_DEMURRAGE_RATE),
    currency: order?.demurrage_currency ?? DEFAULT_DEMURRAGE_CURRENCY,
  };
}

export type DemurrageLeg = "loading" | "unloading";

export const LEG_LABEL: Record<DemurrageLeg, string> = {
  loading: "Завантаження",
  unloading: "Розвантаження",
};

/** Активне «плече» простою (де таймер зараз тікає), або null */
export function getActiveLeg(order: DemurrageOrderFields | null | undefined): DemurrageLeg | null {
  if (!order) return null;
  if (order.unloading_arrived_at && !order.unloading_finished_at) return "unloading";
  if (order.loading_arrived_at && !order.loading_finished_at) return "loading";
  return null;
}
