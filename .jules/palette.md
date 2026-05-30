## 2024-06-03 - 补充浮动组件中图标按钮的无障碍属性
**Learning:** 在浮动的悬浮式 ChatBot 组件中，发现多个图标按钮 (Icon-only buttons) 如"新对话"、"关闭"、"发送"等经常遗漏 `aria-label`。此外，作为浮动在其他内容上的操作面板，键盘焦点的可访问性 (keyboard accessibility) 很容易被忽视，默认的 outline 被移除而没有提供 `focus-visible` 样式补充，导致键盘用户难以感知当前焦点。
**Action:** 对于类似悬浮面板内的交互元素，需在代码 Review 时着重检查无障碍属性（至少提供 `aria-label` 或 `title`），并始终为按钮加上如 `focus-visible:ring-2 focus-visible:ring-offset-2` 的高亮样式。
