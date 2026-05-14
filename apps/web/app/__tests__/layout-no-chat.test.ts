import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("RootLayout", () => {
  it("does not mount the legacy AI assistant", () => {
    const source = readFileSync(resolve(process.cwd(), "app/layout.tsx"), "utf8");

    expect(source).not.toContain("FloatingChatBot");
    expect(source).not.toContain("chat-toggle");
  });
});
