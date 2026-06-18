## 2026-06-18 - 为折叠按钮添加无障碍属性
**Learning:** 折叠控制元素需要向屏幕阅读器有效传达其当前状态。仅添加 `aria-label` 是不够的，必须使用 `aria-expanded` 来指示当前是展开还是收起状态。
**Action:** 始终确保控制 UI 区块展开/收起的控制元素（如按钮）同时使用 `aria-label` 和 `aria-expanded`。
