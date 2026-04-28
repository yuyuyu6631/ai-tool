import { describe, expect, it } from "vitest";
import { shouldHideFloatingChatBot } from "../floating-chat-visibility";

describe("shouldHideFloatingChatBot", () => {
  it("hides on auth page", () => {
    expect(shouldHideFloatingChatBot("/auth")).toBe(true);
    expect(shouldHideFloatingChatBot("/auth/reset-password")).toBe(true);
  });

  it("hides on AI capability pages", () => {
    expect(shouldHideFloatingChatBot("/")).toBe(true);
    expect(shouldHideFloatingChatBot("/tools")).toBe(true);
    expect(shouldHideFloatingChatBot("/tools/chatgpt")).toBe(true);
    expect(shouldHideFloatingChatBot("/matches")).toBe(true);
    expect(shouldHideFloatingChatBot("/admin")).toBe(true);
    expect(shouldHideFloatingChatBot("/admin/tools")).toBe(true);
  });

  it("hides when mode query is ai", () => {
    expect(shouldHideFloatingChatBot("/rankings", "ai")).toBe(true);
  });

  it("shows on regular pages without AI mode", () => {
    expect(shouldHideFloatingChatBot("/rankings")).toBe(false);
    expect(shouldHideFloatingChatBot("/compare/chatgpt-vs-claude")).toBe(false);
    expect(shouldHideFloatingChatBot("/scenarios/marketing")).toBe(false);
  });
});
