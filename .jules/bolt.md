## 2025-05-04 - 修复 list_scenarios 和 list_rankings 中的 N+1 查询问题
**经验：** 在处理存在一对多关系的复杂列表（如 Scenarios 关联 Tools，Rankings 关联 Tools）时，通过外层循环逐条触发懒加载查询会导致经典的 N+1 性能瓶颈。即使在 SQLAlchemy 中，未正确配置 eager loading 也会触发大量单独查询。
**行动：** 对于明确需要提取全部列表关联数据的场景，必须使用 `.in_()` 结合列表 ID 提前批量预加载关联表，然后在内存中使用字典或 `defaultdict` 建立映射，将单点查询（O(N) 数据库开销）转化为 O(1) 的内存获取操作。
