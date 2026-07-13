import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CommandPalette from "../CommandPalette";

const pushMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("../ClientSearchProvider", () => ({
  useClientSearch: () => ({
    tools: [
      {
        id: 1,
        slug: "chatgpt",
        name: "ChatGPT",
        category: "chatbot",
        categorySlug: "chatbot",
        score: 9.5,
        summary: "Writing and analysis assistant",
        tags: ["chat"],
        officialUrl: "https://chat.openai.com",
        logoPath: null,
        logoStatus: null,
        logoSource: null,
        status: "published",
        featured: true,
        createdAt: "2026-03-01",
        price: "",
        reviewCount: 8,
      },
    ],
    categories: [{ slug: "chatbot", canonicalSlug: "chatbot", name: "AI Chatbot", description: "", toolCount: 1 }],
    fuse: {
      search: () => [
        {
          item: {
            id: 1,
            slug: "chatgpt",
            name: "ChatGPT",
            category: "chatbot",
            categorySlug: "chatbot",
            score: 9.5,
            summary: "Writing and analysis assistant",
            tags: ["chat"],
            officialUrl: "https://chat.openai.com",
            logoPath: null,
            logoStatus: null,
            logoSource: null,
            status: "published",
            featured: true,
            createdAt: "2026-03-01",
            price: "",
            reviewCount: 8,
          },
        },
      ],
    },
  }),
}));

describe("CommandPalette", () => {
  beforeEach(() => {
    pushMock.mockReset();
    document.body.innerHTML = "";
    class ResizeObserverMock {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
    vi.stubGlobal("ResizeObserver", ResizeObserverMock);
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("focuses the page search input on Ctrl+K", async () => {
    render(
      <>
        <input data-global-search-target="home" defaultValue="hello" />
        <CommandPalette />
      </>,
    );

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute("data-global-search-target", "home");
    });
  });

  it("keeps Ctrl+G as a compatible shortcut", async () => {
    render(
      <>
        <input data-global-search-target="tools" defaultValue="visible" />
        <CommandPalette />
      </>,
    );

    fireEvent.keyDown(document, { key: "g", ctrlKey: true });

    await waitFor(() => {
      expect(document.activeElement).toHaveAttribute("data-global-search-target", "tools");
    });
  });

  it("opens the fallback panel when the current page has no search target", async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });

    expect(await screen.findByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("ignores malformed keydown events without crashing", () => {
    render(<CommandPalette />);

    expect(() => {
      fireEvent.keyDown(document, { ctrlKey: true });
    }).not.toThrow();
  });

  it("routes free-form searches to the unified tools results page", async () => {
    render(<CommandPalette />);

    fireEvent.keyDown(document, { key: "k", ctrlKey: true });
    fireEvent.change(await screen.findByRole("combobox"), { target: { value: "deep research" } });

    // Bolt: Wait for deferred search results to render
    const searchButton = await waitFor(() => screen.findByText("在目录中搜索 “deep research”"));
    fireEvent.click(searchButton);

    expect(pushMock).toHaveBeenCalledWith("/tools?q=deep+research&mode=ai&page=1&page_size=24");
  });
});
