
## 2026-05-14 - [为 ChatBot 纯图标按钮添加无障碍支持]
**Learning:** 在浮动和悬停组件中的纯图标按钮（如对话框头部和发送按钮）通常会缺失无障碍标签 (`aria-label`) 和键盘可见的焦点状态，这对于依赖屏幕阅读器或键盘导航的用户来说存在严重阻碍。
**Action:** 在使用 Tailwind 编写纯图标可交互元素时，应养成默认添加 `aria-label` 并结合 `focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-X` 等样式类来提供清晰视觉反馈的习惯。
