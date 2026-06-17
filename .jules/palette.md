## 2026-06-17 - [Added missing aria-labels to icon buttons]
**Learning:** Icon-only buttons without `aria-label` are a critical accessibility issue, especially for screen readers. I found multiple missing `aria-label` attributes on close and reset buttons in the chat components (`ChatBot.tsx` and `FloatingChatBot.tsx`). Also, the `ChatBot.tsx` has a toggle/expand button that needs `aria-expanded` and `aria-label`.
**Action:** Always add descriptive `aria-label` to any button that only contains icons (like SVG or Lucide icons) to ensure the interface is accessible.
