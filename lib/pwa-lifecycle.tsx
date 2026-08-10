"use client";

import { useEffect } from "react";

export type PwaStatus = "unsupported" | "registering" | "ready" | "update-available" | "updated" | "error";
export const PWA_STATUS_EVENT = "findik:pwa-status";

export function subscribePwaStatus(listener: (event: CustomEvent<{ status: PwaStatus; detail?: unknown }>) => void) {
  const handler = listener as EventListener;
  window.addEventListener(PWA_STATUS_EVENT, handler);
  return () => window.removeEventListener(PWA_STATUS_EVENT, handler);
}

function publish(status: PwaStatus, detail?: unknown) {
  window.dispatchEvent(new CustomEvent(PWA_STATUS_EVENT, { detail: { status, detail } }));
}

export function requestPwaUpdate() {
  return navigator.serviceWorker?.getRegistration("/").then((registration) => {
    registration?.waiting?.postMessage({ type: "SKIP_WAITING" });
  });
}

export function PwaLifecycle() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) {
      publish("unsupported");
      return;
    }

    let refreshing = false;
    const onControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      publish("updated");
    };

    const register = async () => {
      publish("registering");
      try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/", updateViaCache: "none" });
        publish(registration.waiting ? "update-available" : "ready", registration);
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) publish("update-available", registration);
          });
        });
      } catch (error) {
        publish("error", error);
      }
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);
    void register();
    return () => navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  }, []);

  return null;
}
