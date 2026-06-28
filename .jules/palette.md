## 2024-06-28 - 为移动端导航菜单添加 aria-controls 和 aria-expanded
**Learning:** 像移动端菜单这样的可展开/折叠 UI 元素，需要使用 'aria-expanded' 属性来向屏幕阅读器传达其切换状态，并且需要使用 'aria-controls' 属性指向被控制的内容区域。
**Action:** 对于显示/隐藏内容的切换按钮，始终将 'aria-expanded' 与 'aria-controls' 配合使用。
