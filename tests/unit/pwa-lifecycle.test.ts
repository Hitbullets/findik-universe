import { afterEach, describe, expect, it, vi } from "vitest";
import { PWA_STATUS_EVENT, requestPwaUpdate, subscribePwaStatus } from "@/lib/pwa-lifecycle";

describe("PWA lifecycle API", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("publishes a stable event name", () => {
    expect(PWA_STATUS_EVENT).toBe("findik:pwa-status");
  });

  it("asks the waiting worker to activate", async () => {
    const postMessage = vi.fn();
    vi.stubGlobal("navigator", { serviceWorker: { getRegistration: vi.fn().mockResolvedValue({ waiting: { postMessage } }) } });
    await requestPwaUpdate();
    expect(postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
  });

  it("subscribes and unsubscribes from status updates", () => {
    const listener = vi.fn();
    const unsubscribe = subscribePwaStatus(listener);
    window.dispatchEvent(new CustomEvent(PWA_STATUS_EVENT, { detail: { status: "ready" } }));
    unsubscribe();
    window.dispatchEvent(new CustomEvent(PWA_STATUS_EVENT, { detail: { status: "updated" } }));
    expect(listener).toHaveBeenCalledOnce();
  });
});
