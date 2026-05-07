## 2024-05-18 - Playwright Component Testing & Data Hydration
**Learning:** For purely visual micro-UX improvements (like adding aria-pressed or focus states to a button component), running end-to-end visual verification (like with Playwright) against a mocked page may fail due to complex SSR/Next.js hydration and routing boundaries, blocking the components from ever rendering on the page.
**Action:** When working on isolated component changes (like in `ToolCard.tsx`), rely primarily on Vitest unit tests to verify that the logic doesn't break, and when visual verification is required, consider writing isolated component-level tests (e.g. `testing-library/react`) to mock props directly rather than intercepting full network APIs, especially if the app relies on SSR.

## 2026-05-07 - ARIA labels for icon-only floating chat controls
**Learning:** Icon-only buttons in floating interfaces (like a chat bot) need specific `aria-label` attributes to be accessible, as they lack visible text and their function isn't always contextually obvious to screen readers. Adding `focus-visible:ring-2` provides critical visual feedback for keyboard navigation without breaking mouse aesthetics.
**Action:** Always ensure icon-only buttons have an explicit `aria-label` and keyboard-friendly focus styles (`focus-visible`) during implementation.
