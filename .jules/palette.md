## 2024-05-17 - Add focus-visible indicators to header buttons
**Learning:** Header icon buttons missed keyboard focus indicators due to `focus:outline-none` which hurts accessibility.
**Action:** Replaced simple `focus:outline-none` with `focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2` across utility buttons for better keyboard navigation without affecting mouse users.
