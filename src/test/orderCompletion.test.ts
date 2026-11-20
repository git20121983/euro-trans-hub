import { describe, expect, it } from "vitest";
import {
  getPreviousOrderStatus,
  shouldWarnAboutUnpaidOrder,
} from "@/lib/orderCompletion";

describe("order completion rules", () => {
  it("warns before closing an order whose payment_status is not paid", () => {
    expect(shouldWarnAboutUnpaidOrder("unpaid")).toBe(true);
    expect(shouldWarnAboutUnpaidOrder("partial")).toBe(true);
  });

  it("does not warn before closing a fully paid order", () => {
    expect(shouldWarnAboutUnpaidOrder("paid")).toBe(false);
  });

  it("restores the status saved by the latest closing event", () => {
    const events = [
      { event_type: "status_change", metadata: { old_status: "new", new_status: "in_transit" } },
      { event_type: "status_change", metadata: { old_status: "unloading", new_status: "completed" } },
      { event_type: "status_change", metadata: { old_status: "planning", new_status: "completed" } },
    ];

    expect(getPreviousOrderStatus(events)).toBe("unloading");
  });

  it("reopens as new when no previous status was saved", () => {
    expect(getPreviousOrderStatus([])).toBe("new");
    expect(getPreviousOrderStatus([
      { event_type: "status_change", metadata: null },
    ])).toBe("new");
  });
});
