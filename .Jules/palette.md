## 2025-05-03 - [Tailwind 焦点样式无障碍化问题]
**Learning:** 本项目存在一种常见的无障碍化（Accessibility）反模式：在纯图标的交互按钮上使用 Tailwind 的 `focus:outline-none`，但没有提供键盘导航可见的后备焦点样式（例如 `focus-visible`），这会导致使用键盘的用户（比如按 Tab 键遍历表单元素时）无法知道自己当前聚焦在哪个元素。同时，这部分纯图标按钮缺少屏幕阅读器可以识别的文本描述。
**Action:** 在实现或修改纯图标交互元素（比如表单评分组件等）时，必须确保添加明确的 `aria-label` 供屏幕阅读器读取。另外，如果必须隐藏默认的外边框，则需要用具有清晰视觉反馈的替代方案（如 `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2` 和对应的颜色类）进行替换，并结合元素的形状添加适当的边框半径（如 `rounded-full`）。
