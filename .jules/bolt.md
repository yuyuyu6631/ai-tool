## 2024-05-28 - 重构类别别名解析逻辑，消除 O(N) 性能瓶颈
**经验：** 在处理工具分类（如 `_matches_category`、`list_tools_by_category` 和 `get_home_catalog`）时，原代码通过循环遍历 `LEGACY_CATEGORY_SLUGS.items()` 来解析别名。这种做法在嵌套循环或大量调用时会导致严重的 O(N) 性能退化。
**行动：** 对于存在较多查询请求或数据处理逻辑的场景，应在模块初始化阶段预计算 O(1) 复杂度的哈希表反向映射字典（如 `_REVERSE_CATEGORY_SLUGS`），以优化高频调用路径的查找效率。
