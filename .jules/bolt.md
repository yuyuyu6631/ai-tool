## 2024-12-07 - [目录别名解析性能优化]
**经验：** 在处理多处分类别名解析时（如 `_matches_category`、`list_tools_by_category` 和 `get_home_catalog`），原代码在每次调用或每次循环时使用生成器遍历 `LEGACY_CATEGORY_SLUGS.items()`。在数据量大时，这会引发明显的 O(N) 性能降级，并且可能演变成 O(M*N) 的嵌套循环瓶颈。
**行动：** 在处理分类别名时，始终在模块级别建立预计算的逆向映射字典（如 `_REVERSE_CATEGORY_SLUGS`），以将后续所有查找操作的时间复杂度降至 O(1)。
