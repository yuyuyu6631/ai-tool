## 2024-05-27 - [预先计算反向映射以消除多次全表遍历]
**经验：** 在处理 `_matches_category`、`list_tools_by_category` 和 `get_home_catalog` 等高频调用的方法时，每次都遍历字典 `LEGACY_CATEGORY_SLUGS.items()` 以匹配别名是一种 O(N) 的反模式。这会导致大量多余的计算开销，尤其是在数据量大的情况下。
**行动：** 在模块加载时预先计算并缓存一个反向映射字典（例如：`_REVERSE_CATEGORY_SLUGS`），通过 O(1) 的字典查找取代生成器表达式遍历。
