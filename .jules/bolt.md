
## 2024-05-01 - 优化列表查询的 N+1 性能问题
**经验：** 在处理 `catalog_service.py` 里的 `list_scenarios` 和 `list_rankings` 时，发现代码库中特定于缺少显式模型关联时的 N+1 查询瓶颈。使用传统的方式在循环体内进行单独查询，当记录条数增加时会严重影响数据库性能。
**行动：** 为了消除这个问题，我们在获取主记录后提取所有的 ID 列表，使用 `in_` 搭配 `.options(selectinload(...))` 进行批量查询。随后，在内存中利用 `collections.defaultdict(list)` 按外键将关联结果分组处理，再分发到独立的子项构建逻辑中。这个模式未来在类似场景（如未显式定义 Relationship 或避免 eager-load 开销大）中应当首选使用，提高列表请求的加载效率。
