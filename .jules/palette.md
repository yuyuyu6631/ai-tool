## 2024-05-18 - 添加 aria-hidden 给嵌套图标
**Learning:** 给包含图标的纯图标按钮添加 aria-label 是个好习惯，但这还不够。必须给嵌套的 `<svg>` 或 `<Component />`（比如 `lucide-react` 中的 `<X />`）加上 `aria-hidden="true"`。否则，屏幕阅读器可能会将外层的 aria-label 播报一次，然后再次尝试播报内部结构，这会引起重复或者播报未知元素的混乱。
**Action:** 当我们修复只含有图标按钮的无障碍时，除了设置外层按钮的 aria-label 外，一定要记得确保内部的图标元素上带有 aria-hidden="true"。
## 2024-05-18 - 密码可见性切换按钮无障碍改进
**Learning:** 提升密码可见性切换按钮（非折叠/展开区域）的无障碍体验时，应使用 aria-pressed 而不是 aria-expanded 来向屏幕阅读器表示激活状态。
**Action:** 对于控制状态但没有折叠区域的按钮，我们使用 aria-pressed 属性。
