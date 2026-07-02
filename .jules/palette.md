## 2024-05-24 - Add aria-label to tool comparison removal buttons
**Learning:** Found that the dynamically generated "Remove Tool" buttons in the comparison grid lacked `aria-label` attributes. While visually understandable due to the 'X' icon, screen reader users wouldn't know which tool they are removing when interacting with these buttons.
**Action:** Always ensure that icon-only buttons or buttons that dynamically remove specific items include context-rich `aria-label` attributes (e.g., `aria-label={"Remove " + tool.name}`).
