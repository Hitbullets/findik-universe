import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { proxy } from "@/proxy";

describe("nonce tabanlı Content Security Policy", () => {
  it("Next.js hydration scriptlerine tek kullanımlık nonce verir", () => {
    const response = proxy(new NextRequest("https://findik-universe.vercel.app/"));
    const csp = response.headers.get("Content-Security-Policy") ?? "";

    expect(csp).toMatch(/script-src 'self' 'nonce-[^']+' 'strict-dynamic'/);
    expect(csp).not.toContain("script-src 'self' 'unsafe-inline'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("base-uri 'self'");
  });
});
