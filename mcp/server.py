"""
MCP Server for Xingdianping Database
让AI可以通过Model Context Protocol访问星点评数据库

运行方式:
python mcp/server.py
"""

import sys
sys.path.insert(0, 'apps/api')

from typing import Any, List, Optional
from mcp.server import Server
from mcp.types import Resource, Tool as MCPTool, TextContent
from pydantic import BaseModel, Field
import asyncio
import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import SessionLocal
from app.models.models import Tool, Tag, Category, Scenario, Ranking

app = Server("xingdianping-db-mcp")

class SearchToolsRequest(BaseModel):
    keyword: Optional[str] = Field(description="Search keyword for tool name/summary", default=None)
    category: Optional[str] = Field(description="Filter by category name", default=None)
    tag: Optional[str] = Field(description="Filter by tag name", default=None)
    limit: int = Field(description="Maximum number of results", default=10)

class GetToolDetailRequest(BaseModel):
    tool_id: Optional[int] = Field(description="Tool ID", default=None)
    slug: Optional[str] = Field(description="Tool slug", default=None)

@app.list_resources()
async def list_resources() -> List[Resource]:
    """List available database resources"""
    return [
        Resource(
            uri="xingdianping://tools",
            name="AI Tools",
            description="All AI tools in the database",
            mimeType="application/json"
        ),
        Resource(
            uri="xingdianping://tags",
            name="Tags",
            description="All tags for categorizing AI tools",
            mimeType="application/json"
        ),
        Resource(
            uri="xingdianping://categories",
            name="Categories",
            description="All categories",
            mimeType="application/json"
        )
    ]

@app.list_tools()
async def list_tools() -> List[MCPTool]:
    """List available database query tools"""
    return [
        MCPTool(
            name="search_ai_tools",
            description="Search for AI tools by keyword, category, or tag",
            inputSchema=SearchToolsRequest.model_json_schema()
        ),
        MCPTool(
            name="get_tool_detail",
            description="Get detailed information about a specific AI tool",
            inputSchema=GetToolDetailRequest.model_json_schema()
        ),
        MCPTool(
            name="list_all_tags",
            description="List all tags in the database",
            inputSchema={
                "type": "object",
                "properties": {},
                "additionalProperties": False
            }
        ),
        MCPTool(
            name="list_all_categories",
            description="List all categories in the database",
            inputSchema={
                "type": "object",
                "properties": {},
                "additionalProperties": False
            }
        ),
        MCPTool(
            name="get_statistics",
            description="Get database statistics (count of tools, tags, categories)",
            inputSchema={
                "type": "object",
                "properties": {},
                "additionalProperties": False
            }
        )
    ]

def get_db() -> Session:
    """Get database session"""
    return SessionLocal()

@app.call_tool()
async def call_tool(name: str, arguments: Any) -> List[TextContent]:
    """Handle tool calls"""
    db = get_db()
    try:
        if name == "search_ai_tools":
            request = SearchToolsRequest(**arguments)
            query = select(Tool).where(Tool.status == 'published')

            if request.keyword:
                query = query.filter(
                    (Tool.name.contains(request.keyword) | Tool.summary.contains(request.keyword))
                )
            if request.category:
                query = query.filter(Tool.category_name == request.category)

            # Note: Tag filtering would need a join, simplified version here
            query = query.order_by(Tool.featured.desc(), Tool.score.desc())
            query = query.limit(request.limit)

            result = db.execute(query)
            tools = result.scalars().all()

            tools_data = []
            for tool in tools:
                # Get tags
                tool_tags = [t.tag.name for t in tool.tags]
                tools_data.append({
                    "id": tool.id,
                    "name": tool.name,
                    "slug": tool.slug,
                    "summary": tool.summary,
                    "category_name": tool.category_name,
                    "price": tool.price,
                    "score": tool.score,
                    "featured": tool.featured,
                    "tags": tool_tags,
                    "created_on": tool.created_on.isoformat() if tool.created_on else None
                })

            return [TextContent(type="text", text=json.dumps(tools_data, indent=2, default=str))]

        elif name == "get_tool_detail":
            request = GetToolDetailRequest(**arguments)
            query = select(Tool).where(Tool.status == 'published')

            if request.tool_id:
                query = query.filter(Tool.id == request.tool_id)
            elif request.slug:
                query = query.filter(Tool.slug == request.slug)
            else:
                raise ValueError("Either tool_id or slug must be provided")

            result = db.execute(query)
            tool = result.scalar_one_or_none()

            if not tool:
                return [TextContent(type="text", text=json.dumps({"error": "Tool not found"}))]

            # Get full details
            tool_data = {
                "id": tool.id,
                "name": tool.name,
                "slug": tool.slug,
                "summary": tool.summary,
                "description": tool.description,
                "category_name": tool.category_name,
                "developer": tool.developer,
                "country": tool.count,
                "price": tool.price,
                "platforms": tool.platforms,
                "vpn_required": tool.vpn_required,
                "official_url": tool.official_url,
                "score": tool.score,
                "featured": tool.featured,
                "created_on": tool.created_on.isoformat() if tool.created_on else None,
                "last_verified_at": tool.last_verified_at.isoformat() if tool.last_verified_at else None,
                "tags": [t.tag.name for t in tool.tags],
                "categories": [c.category.name for c in tool.categories]
            }

            # Check if star_rating exists
            if hasattr(tool, 'star_rating'):
                tool_data['star_rating'] = tool.star_rating

            return [TextContent(type="text", text=json.dumps(tool_data, indent=2, default=str))]

        elif name == "list_all_tags":
            result = db.execute(select(Tag).order_by(Tag.name))
            tags = result.scalars().all()
            tags_data = [{"id": t.id, "name": t.name, "tool_count": len(t.tools)} for t in tags]
            return [TextContent(type="text", text=json.dumps(tags_data, indent=2))]

        elif name == "list_all_categories":
            result = db.execute(select(Category).order_by(Category.name))
            categories = result.scalars().all()
            categories_data = [{
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "description": c.description,
                "tool_count": len(c.tools)
            } for c in categories]
            return [TextContent(type="text", text=json.dumps(categories_data, indent=2))]

        elif name == "get_statistics":
            tool_count = db.query(Tool).filter(Tool.status == 'published').count()
            tag_count = db.query(Tag).count()
            category_count = db.query(Category).count()
            scenario_count = db.query(Scenario).count()
            ranking_count = db.query(Ranking).count()

            stats = {
                "published_tools": tool_count,
                "total_tags": tag_count,
                "total_categories": category_count,
                "total_scenarios": scenario_count,
                "total_rankings": ranking_count,
                "database_url": settings.database_url.split('://')[0]  # Hide credentials
            }
            return [TextContent(type="text", text=json.dumps(stats, indent=2))]

        else:
            raise ValueError(f"Unknown tool: {name}")

    finally:
        db.close()

async def main():
    import mcp.server.stdio

    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )

if __name__ == "__main__":
    asyncio.run(main())
