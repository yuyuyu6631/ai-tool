## 2024-06-07 - 在移动端菜单切换按钮添加 aria-expanded
**Learning:** 图标切换按钮不仅需要 aria-label，还需要 aria-expanded 来向屏幕阅读器正确传达其展开/收起状态。
**Action:** 在实现仅有图标的切换控件时，始终同时提供描述性的 aria-label 和 aria-expanded={isOpen}。
