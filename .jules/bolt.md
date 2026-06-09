## 2026-06-09 - Fuse.js 性能优化
**经验：** 在处理大型数据集时，通过数组的 map 和 slice 对 Fuse.js 返回的完整结果进行切割（例如 `fuse.search(query).map(r => r.item).slice(0, 10)`）是不必要的性能浪费，可能导致应用卡顿。
**行动：** 将 `limit` 选项直接传给 `search` 方法（例如 `fuse.search(query, { limit: 10 })`），把开销交给底层处理。
