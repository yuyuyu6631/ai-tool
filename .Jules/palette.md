## 2026-05-01 - [提升交互式组件的无障碍支持]
**Learning:** 在实现自定义交互组件（如星星打分）时，仅使用 `focus:outline-none` 会导致键盘导航用户完全丢失焦点指示，同时缺少 `aria-label` 和 `aria-pressed` 会让屏幕阅读器用户无法理解组件状态。
**Action:** 在使用无样式按钮实现自定义交互时，必须使用 `focus-visible:ring-*` 提供清晰的键盘焦点反馈，并配合 `aria-label` 描述功能和 `aria-pressed` 或相关属性反映当前选中状态。
