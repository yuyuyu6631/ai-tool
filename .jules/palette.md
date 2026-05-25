## 2026-05-25 - [UX/Accessibility Improvements in ChatBot Component]
**Learning:** Icon-only interactive elements (like the New Chat and Close buttons in the ChatBot header) often lack semantic meaning for screen readers and visible focus indicators for keyboard navigation. This negatively impacts accessibility for users relying on assistive technologies or keyboard-only navigation.
**Action:** Add explicit `aria-label` attributes and visible focus styles (using Tailwind `focus-visible` utility classes) to all icon-only buttons to ensure they are fully accessible and provide clear context.
