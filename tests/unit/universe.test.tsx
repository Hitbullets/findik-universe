import { act, cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Universe } from "@/components/universe";
import { PROGRESS_STORAGE_KEY } from "@/lib/progress";
import { createBlankProgressV3 } from "@/lib/progress-reducer";

describe("Universe hydration boundary", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    vi.restoreAllMocks();
  });

  it("persisted state yüklenene kadar mutating kontrolleri göstermez", async () => {
    const stored = { ...createBlankProgressV3(), xp: 75, boops: 4 };
    window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(stored));
    let hydrate: FrameRequestCallback | undefined;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => { hydrate = callback; return 1; });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => undefined);

    render(<Universe />);
    expect(screen.getByText("Fındık dünyasını hazırlıyor…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Fındık'a dokun" })).not.toBeInTheDocument();

    await act(async () => hydrate?.(0));
    expect(screen.getByRole("button", { name: "Fındık'a dokun" })).toBeInTheDocument();
    expect(screen.getByText("75 / 100 XP")).toBeInTheDocument();
  });
});
