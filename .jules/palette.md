## 2024-05-31 - [Add Focus State to Header Utility Buttons]
**Learning:** Custom header buttons (`header-utility-button`, `header-auth-button`) were lacking visible focus indicators (`focus-visible`), which degrades keyboard accessibility for interactive elements like the Theme Toggle and Auth buttons.
**Action:** Added global `:focus-visible` states to custom button classes in `theme.css` to ensure consistent focus rings across the app without manually applying Tailwind classes to every button instance.
