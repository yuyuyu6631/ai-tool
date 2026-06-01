## 2024-05-30 - [Initial] \n**Learning:** Just starting \n**Action:** Start applying UX touches
## 2024-06-01 - [优化对比按钮的无障碍和视觉反馈]
**Learning:** 在实现对比工具等状态切换功能时，屏幕阅读器需要明确的 aria-label 告知切换前后的操作意图（如"加入对比"和"取消对比"），同时视觉上将加号(+)切换为对勾(✓)能够给用户更明确的状态确认感。
**Action:** 在实现含有选中/未选中状态的交互组件时，必须始终同时提供：明确的 aria-pressed 状态、根据状态变化的 aria-label/title。
