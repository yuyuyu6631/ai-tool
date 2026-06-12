## 2024-06-12 - Icon Button Tooltips
**Learning:** Found several icon-only buttons (like ThemeToggle) that have `aria-label`s but use `title` for hover tooltips. Using tooltips or descriptive ARIA labels helps screen reader users, but keyboard-only users and mouse users sometimes benefit from custom tooltips or improved labels.
**Action:** Let's look for more icon-only buttons without `aria-label` or missing tooltips.
## 2024-06-12 - Expandable Buttons
**Learning:** Discovered that mobile navigation menu and potentially other expanding buttons (e.g. in `HeaderMobileMenu.tsx`) lack the `aria-expanded` attribute. This is crucial for screen readers to convey the current state (opened or closed) of the control.
**Action:** Add `aria-expanded` to toggleable UI controls and ensure any text-only buttons that could use it have it.
