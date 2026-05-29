## 2024-05-30 - 优化目录服务类别别名解析性能
**经验：** 在处理大规模列表项的过滤和聚合时（如 `get_home_catalog` 或 `_matches_category`），即使是微小的 O(N) 操作（例如使用生成器表达式遍历常量字典的 items 寻找匹配项）如果在每个条目的循环中被调用，也会成为显著的性能瓶颈。在 `catalog_service.py` 中，反复通过生成器遍历 `LEGACY_CATEGORY_SLUGS.items()` 解析 canonical_slug 是不必要的重复计算。
**行动：** 对于此类固定映射，应在模块级别预计算一个反向查找字典（Reverse Mapping Dictionary），将 O(N) 的迭代匹配转换为 O(1) 的字典查找（`_REVERSE_CATEGORY_SLUGS.get(slug, slug)`），从而将列表处理的复杂度降低，提高响应速度。下次在开发循环数据处理逻辑时，优先识别并提取出此类常量级别的映射查找。
