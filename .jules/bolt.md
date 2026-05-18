## 2024-06-25 - [将目录类别别名解析改为 O(1) 查找]
**经验：** 在处理多处频繁调用的分类别名解析（例如 `catalog_service.py` 中的 `_matches_category`、`list_tools_by_category` 和 `get_home_catalog`）时，之前使用的是生成器表达式在 `LEGACY_CATEGORY_SLUGS` 字典中进行迭代匹配。这种做法是 O(N) 的复杂度，并在循环中被高频调用，从而导致 N+1 以及冗余计算的性能下降。
**行动：** 在模块加载阶段预计算反向映射字典 `_REVERSE_CATEGORY_SLUGS`，将别名到标准名称的查找从 O(N) 降低到 O(1)。在之后遇到类似的分类匹配或者别名解析场景，应优先预计算和利用 O(1) 数据结构，特别是在循环内部。
