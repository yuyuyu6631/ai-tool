## 2024-05-27 - [键盘可访问性改进]
**Learning:** 在使用 `focus:outline-none` 移除默认的焦点轮廓以适应视觉设计时，必须同时使用 `focus-visible` 相关的 Tailwind 类（如 `focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2`）来为键盘导航用户提供清晰的焦点反馈。这确保了既不影响鼠标用户的视觉体验，又兼顾了键盘用户的无障碍可访问性。
**Action:** 在审查和实现包含交互元素（按钮、链接、输入框等）的组件时，特别是当它们包含 `focus:outline-none` 时，始终确保包含对应的 `focus-visible` 样式。
