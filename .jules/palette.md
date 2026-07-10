## 2025-07-10 - Password Visibility Toggle Accessibility
**Learning:** Found that `<button aria-controls="..." aria-label="...">` containing `<Eye />` icons can still be confusing if state isn't semantically communicated with `aria-pressed`. `aria-expanded` is for collapsible regions, but for toggle buttons `aria-pressed` perfectly conveys the active/inactive state of a feature (like visible password).
**Action:** Always use `aria-pressed` on toggle buttons controlling boolean states rather than just changing the label, so screen readers can announce it as a toggle.
