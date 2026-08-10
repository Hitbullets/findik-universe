import { describe, expect, it } from "vitest";
import { catalog, inspectCatalog } from "@/lib/content/catalog";

describe("content catalog", () => {
  it("accepts the canonical catalog", () => {
    expect(inspectCatalog(catalog)).toEqual({ valid: true, issues: [] });
  });

  it("reports a missing story target with a structured issue", () => {
    const broken = structuredClone(catalog);
    broken.stories[0].nodes[0].choices![0].next = "missing-node";
    const result = inspectCatalog(broken);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "missing_story_target" })]));
  });

  it("reports duplicate reward identities", () => {
    const broken = structuredClone(catalog);
    broken.stories[0].reward.id = broken.adventures[0].reward.id;
    expect(inspectCatalog(broken).issues).toEqual(expect.arrayContaining([expect.objectContaining({ code: "duplicate_reward_id" })]));
  });
});
