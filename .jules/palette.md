## 2026-06-13 - Add aria-expanded and aria-label to toggleable buttons
**Learning:** Toggleable UI elements (e.g., expand/collapse sections) must have `aria-expanded` and a descriptive `aria-label` (or rely on `aria-pressed` if it's purely stateful) so screen readers can announce both their function and current state correctly.
**Action:** Always ensure that collapsible sections include these ARIA attributes on the triggering button and link them to the content with `aria-controls`.
