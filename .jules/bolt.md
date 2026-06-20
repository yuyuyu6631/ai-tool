## 2025-06-20 - [Fuse.js search() limit 性能优化]
**经验：** 在处理客户端 Fuse.js 搜索时，不要对整个搜索结果数组使用 `.map(...).slice(0, N)` 进行截断。Fuse.js 会执行完整的排序和评分，非常耗时。应该直接在 `fuse.search(query, { limit: N })` 中传递 `limit` 选项，让 Fuse.js 提前终止内部的排序和评分流程，显著提升性能。
**行动：** 在 `CommandPalette.tsx` 中将 `fuse.search(nluIntent.q).map(...).slice(0, 10)` 替换为 `fuse.search(nluIntent.q, { limit: 10 }).map(...)`。
