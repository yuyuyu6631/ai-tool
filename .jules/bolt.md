## 2026-05-20 - [优化分类别名解析性能 (O(N) -> O(1))]
**经验：** 在处理如 `_matches_category`、`list_tools_by_category` 和 `get_home_catalog` 这样的高频目录查询操作时，发现频繁使用生成器表达式遍历 `LEGACY_CATEGORY_SLUGS.items()` 来查找分类别名，这导致了典型的重复 O(N) 查询，成为隐藏的性能反模式。
**行动：** 下次在处理类似的静态映射数据时，应预先计算 O(1) 的反向查找字典（例如 `_REVERSE_CATEGORY_SLUGS`），并通过单次字典查询 `.get()` 进行别名解析，避免在循环中重复进行列表扫描。
