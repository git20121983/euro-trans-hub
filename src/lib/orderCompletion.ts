export const COMPLETED_ORDER_STATUS = "completed";

export interface OrderStatusEvent {
  event_type: string;
  metadata: Record<string, unknown> | null;
}

export function getPreviousOrderStatus(events: OrderStatusEvent[]): string {
  const closingEvent = events.find((event) => {
    if (event.event_type !== "status_change") return false;
    return event.metadata?.new_status === COMPLETED_ORDER_STATUS;
  });

  const previousStatus = closingEvent?.metadata?.old_status;
  return typeof previousStatus === "string" && previousStatus !== COMPLETED_ORDER_STATUS
    ? previousStatus
    : "new";
}

export function shouldWarnAboutUnpaidOrder(paymentStatus: string): boolean {
  return paymentStatus !== "paid";
}
