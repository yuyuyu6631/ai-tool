## 2024-05-18 - [优化 catalog_service 中的 N+1 查询]
**经验：** 在处理 FastAPI/SQLAlchemy 应用的列表查询（如 list_scenarios 和 list_rankings）时，原代码在循环中依次执行带有 eager loading (`selectinload`) 的查询会导致典型的 N+1 查询性能瓶颈。即使使用了 `selectinload`，由于是在循环中触发查询，依然会产生 N 次数据库网络往返。
**行动：** 对于列表页的关联数据拉取，应当先统一取出主表记录的 ID 列表，然后使用单个 `IN` 子句（例如 `.where(ScenarioTool.scenario_id.in_(scenario_ids))`）获取全部关联数据。随后利用 Python 的 `collections.defaultdict(list)` 在内存中按外键进行分组重组。这种模式将 O(N) 的数据库查询降低为 O(1)，显著提高了处理包含复杂外键实体的列表接口速度。

## 2024-05-18 - [提升高频字符串处理函数的性能与缓存空间]
**经验：** 在高频数据加载和处理场景中（如 catalog_service 内部），字符串清理（`_repair_text`）和格式化（`_slugify`）等函数会被大量冗余调用。未对其使用合适的缓存将产生大量重复的 CPU 计算开销。即便某些函数已经使用了 `lru_cache`，若缓存设置过小（如 `maxsize=1024`），在遇到标签繁多和分类复杂的情况下，仍会导致缓存频繁换出（cache thrashing），无法达到预期的缓存命中率。
**行动：** 对于系统内此类无状态且频繁调用的纯函数，需评估其实际被调用的唯一参数规模，适当增加或添加 `@lru_cache` 装饰器，并且分配合理的 `maxsize` 空间（如调至 `4096`），以提升缓存命中率，从而减少对 CPU 的重复开销。
