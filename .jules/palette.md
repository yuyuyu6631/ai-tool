## 2026-06-08 - [图标切换按钮无障碍体验优化]
**Learning:** 对于仅有图标的折叠/展开控件，不要把状态（如打开/关闭）写进 aria-label 中。使用 aria-expanded 属性结合静态 aria-label 能让读屏软件更准确地传达功能和当前状态。
**Action:** 始终为图标切换按钮添加 aria-expanded 属性，保持 aria-label 的语义单一和稳定。
