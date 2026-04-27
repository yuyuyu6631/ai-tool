import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { fetchDirectory, isMockFallbackEnabled } from "../catalog-api";

describe("catalog-api mock fallback switch", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("api down")));
    delete process.env.NEXT_PUBLIC_USE_MOCK;
    delete process.env.USE_MOCK_DATA;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.NEXT_PUBLIC_USE_MOCK;
    delete process.env.USE_MOCK_DATA;
  });

  it("keeps mock fallback disabled by default for demo data trust", async () => {
    expect(isMockFallbackEnabled()).toBe(false);

    await expect(fetchDirectory()).rejects.toThrow("api down");
  });

  it("allows local fallback only when the mock flag is explicit", async () => {
    process.env.NEXT_PUBLIC_USE_MOCK = "true";

    const directory = await fetchDirectory();

    expect(isMockFallbackEnabled()).toBe(true);
    expect(directory.items.length).toBeGreaterThan(0);
  });
});
