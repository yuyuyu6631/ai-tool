## 2025-06-03 - [ChatBot 辅助功能增强]
**Learning:** Icon-only buttons without `aria-label` and toggle buttons without `aria-expanded` severely degrade the screen reader experience. State-dependent labels (like "Open/Close") are good, but combining them with `aria-expanded` provides standard interaction patterns for assistive technologies.
**Action:** Always ensure icon-only interactive elements have descriptive `aria-label`s and toggle controls use `aria-expanded` to communicate their current state.
