## 2024-06-29 - [为汉堡菜单添加无障碍状态属性]
**Learning:** 在实现移动端侧边栏或下拉菜单时，不仅需要提供 `aria-label` 来描述按钮的作用，还必须通过动态生成的 ID (如 React 的 `useId()`) 配合 `aria-expanded` 和 `aria-controls` 建立按钮与内容区域的联系。这样可以使读屏软件用户明确知道内容的状态（展开/折叠）并快速定位到菜单区域。
**Action:** 下次在实现任何下拉、展开式菜单时，确保自动加上 `aria-expanded` 和配固的 `aria-controls`，同时使用 `useId` 避免在列表中引发重复 ID。
