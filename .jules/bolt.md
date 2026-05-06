## 2024-05-18 - [优化 catalog_service 中的 N+1 查询]
**经验：** 在处理 FastAPI/SQLAlchemy 应用的列表查询（如 list_scenarios 和 list_rankings）时，原代码在循环中依次执行带有 eager loading (`selectinload`) 的查询会导致典型的 N+1 查询性能瓶颈。即使使用了 `selectinload`，由于是在循环中触发查询，依然会产生 N 次数据库网络往返。
**行动：** 对于列表页的关联数据拉取，应当先统一取出主表记录的 ID 列表，然后使用单个 `IN` 子句（例如 `.where(ScenarioTool.scenario_id.in_(scenario_ids))`）获取全部关联数据。随后利用 Python 的 `collections.defaultdict(list)` 在内存中按外键进行分组重组。这种模式将 O(N) 的数据库查询降低为 O(1)，显著提高了处理包含复杂外键实体的列表接口速度。
