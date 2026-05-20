import { describe, expect, it } from "vitest";
import { EXPERIENCE_BOARDS, EXPERIENCE_POSTS, getFallbackExperienceList, getFallbackExperiencePost } from "../experience-community";

describe("experience community content", () => {
  it("provides image-rich posts and community boards", () => {
    const post = getFallbackExperiencePost("chatgpt-gamma-prd-report");

    expect(post).toBeDefined();
    expect(post?.coverImageUrl).toBeTruthy();
    expect(post?.imageUrls.length).toBeGreaterThanOrEqual(1);
    expect(EXPERIENCE_BOARDS.map((board) => board.slug)).toEqual([
      "skill-community",
      "mcp-community",
      "openclaw-lobster",
      "hammers-community",
    ]);
  });

  it("keeps all listed posts addressable by id", () => {
    for (const post of EXPERIENCE_POSTS) {
      expect(getFallbackExperiencePost(post.slug)?.title).toBe(post.title);
    }
  });

  it("filters fallback posts by channel and board", () => {
    const filtered = getFallbackExperienceList("工具组合", "mcp-community");

    expect(filtered.items).toHaveLength(1);
    expect(filtered.items[0].slug).toBe("mcp-figma-docs-workflow");
  });
});
