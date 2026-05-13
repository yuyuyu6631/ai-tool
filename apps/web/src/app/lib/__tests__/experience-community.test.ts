import { describe, expect, it } from "vitest";
import { EXPERIENCE_POSTS, getPostById } from "../experience-community";

describe("experience community content", () => {
  it("provides enough detail for a clicked experience post", () => {
    const post = getPostById("chatgpt-gamma-prd-report");

    expect(post).toBeDefined();
    expect(post?.takeaways.length).toBeGreaterThanOrEqual(3);
    expect(post?.steps.length).toBeGreaterThanOrEqual(3);
    expect(post?.pitfalls.length).toBeGreaterThanOrEqual(2);
  });

  it("keeps all listed posts addressable by id", () => {
    for (const post of EXPERIENCE_POSTS) {
      expect(getPostById(post.id)?.title).toBe(post.title);
    }
  });
});
