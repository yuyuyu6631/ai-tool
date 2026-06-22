## 2024-06-22 - [Toggle accessibility]
**Learning:** Icon-only toggle buttons without `aria-expanded` are inaccessible to screen readers, making it impossible for users to know if the section is expanded or collapsed.
**Action:** Always add `aria-expanded={isExpanded}` to toggle buttons.
