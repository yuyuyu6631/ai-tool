## 2026-05-02 - 修复 list_scenarios 和 list_rankings 中的 N+1 查询瓶颈
**经验：** 在 SQLAlchemy 中，如果缺少显式的关系定义或者没有进行良好的 eager loading，在处理列表时容易因为循环单独查询子项（如 _build_scenario_summary 内部单独通过 scenario.id 查询 ScenarioTool）导致严重的 N+1 查询问题。
**行动：** 在处理多项列表（如 scenario 和 ranking 列表）时，应提取全部所需数据的 ID 列表，通过 .in_() 语法执行单次批量查询，然后利用 collections.defaultdict(list) 在内存中将结果分组。通过参数传递预获取的数据来替代逐个查询，能有效消除 N+1 查询瓶颈。
