## 2026-05-21 - [类别别名解析 O(1) 优化]
**经验：** 在处理目录的别名解析时（如 get_home_catalog 等场景下的大量迭代），原先使用了带有生成器的 next(slug for slug, aliases in LEGACY_CATEGORY_SLUGS.items())，导致时间复杂度劣化为 O(N)。这在频繁调用时成为性能瓶颈。
**行动：** 预先计算 O(1) 的反向映射字典 _REVERSE_CATEGORY_SLUGS 并利用字典的 .get() 方法来进行查找，将时间复杂度从 O(N) 降低至 O(1)，有效减少了重复计算。在其他存在类似迭代解析的地方，同样应考虑是否可以使用预计算空间换取时间的策略。
