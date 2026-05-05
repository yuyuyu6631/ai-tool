## 2025-02-25 - [星级评分组件无障碍化设计]
**Learning:** 对于类似星级评分的自定义输入控件，使用 `focus:outline-none` 取消默认的外边框时，必须提供替代的视觉焦点指示。同时，作为图标构成的纯交互按钮，需要明确的 `aria-label` 说明操作意图和 `aria-pressed` 反映当前状态，否则屏幕阅读器和纯键盘用户将无法正常使用。
**Action:** 在实现纯图标交互按钮（如评分星、点赞等）时，除了应用 `focus:outline-none`，需始终配对使用 `focus-visible:ring-2`，并强制检查是否具有有效的 `aria-label` 以及适当的语义属性如 `aria-pressed` 或 `aria-expanded`。
