## 2024-07-11 - 状态切换按钮的无障碍优化与冗余播报处理
**Learning:** 在实现不控制可折叠区域的状态切换按钮（如密码可见性切换）时，使用 `aria-pressed` 比 `aria-expanded` 更具语义。此外，当包含图标的按钮已有完整的 `aria-label` 时，内部的 SVG 图标必须添加 `aria-hidden="true"`，否则屏幕阅读器可能会进行重复或令人困惑的播报。
**Action:** 下次在所有仅图标且有状态的按钮组件中，统一采用 `aria-label` 提供名称、`aria-pressed` 描述当前状态，并为所有纯装饰图标设置 `aria-hidden="true"`，以确保提供清晰无干扰的无障碍体验。
