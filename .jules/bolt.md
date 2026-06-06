## 2026-06-06 - 优化目录服务分类别名解析算法

**经验：** 在进行目录操作（如 `_filter_tools`, `get_home_catalog` 等）时，频繁调用 `next(generator, default)` 来迭代 `LEGACY_CATEGORY_SLUGS.items()` 会导致重复的 O(N) 性能衰减。这在多条记录遍历时非常明显。
**行动：** 通过预计算 O(1) 的反向映射字典 `_REVERSE_CATEGORY_SLUGS` 替代实时迭代查找，可以有效消除 N+1 复杂度的计算开销，提升大数据量下的列表检索与聚合性能。
