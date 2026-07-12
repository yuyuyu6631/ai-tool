## 2025-03-08 - 密码可见性切换按钮无障碍化改进
**Learning:** 对于状态切换按钮（如密码显示/隐藏），当按钮不控制展开/折叠区域时，应当使用 `aria-pressed` 而非仅依靠 `aria-label` 的变化，同时纯图标按钮内部的图标元素必须添加 `aria-hidden="true"` 防止屏幕阅读器重复或混乱播报。
**Action:** 在设计此类切换按钮组件时，始终结合使用 `aria-pressed` 并在 SVG 图标上添加 `aria-hidden="true"` 属性。
