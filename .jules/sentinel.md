## 2024-05-31 - [移除 MCP 服务器中的 SQL 注入漏洞]
**Vulnerability:** `mcp/server.py` 中的 `raw_sql_query` 工具允许客户端执行任意原始 SQL 语句。尽管有基于字符串前缀的 `.startswith("SELECT")` 简单检查，但仍极易遭受基于 `UNION`、内联注释或多语句堆叠等手法的 SQL 注入攻击，并且可能绕过应用层设计的权限限制。
**Learning:** 仅通过前缀匹配和字符串校验无法安全地防御 SQL 注入，尤其是在向客户端（特别是 LLM）提供数据库查询工具时。直接执行原始 SQL 永远是一项高风险的操作，应该优先提供结构化、经过 Pydantic 验证输入参数的查询构建器。
**Prevention:** 在为 MCP 服务器提供数据库查询工具时，永远不要暴露可以直接执行用户提供的原始 SQL 查询的接口。应始终使用带输入验证参数（如 `SearchToolsRequest` 的 keyword、category 等）和 SQLAlchemy 的强类型方法（如 `select()`、`.where()`、`.ilike()`）来构建数据查询功能。
