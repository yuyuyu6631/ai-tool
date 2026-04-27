#!/usr/bin/env python3
"""
数据导出脚本 - 支持多种格式导出星点评平台数据
支持格式：JSON、CSV、Excel、SQL
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import List

from sqlalchemy.orm import Session, joinedload

from app.db.session import SessionLocal
from app.models.models import (
    Category, Tool, ToolCategory, ToolReview, ToolTag
)


class DataExporter:
    """数据导出器"""
    
    def __init__(self, session: Session, output_dir: Path):
        self.session = session
        self.output_dir = output_dir
        self.output_dir.mkdir(exist_ok=True)
        
    def export_tools(self, format_type: str = "json", include_relations: bool = True) -> Path:
        """导出工具数据"""
        print("正在导出工具数据...")
        
        # 查询工具数据，包含关联数据
        query = self.session.query(Tool).options(
            joinedload(Tool.categories).joinedload(ToolCategory.category),
            joinedload(Tool.tags).joinedload(ToolTag.tag),
            joinedload(Tool.reviews)
        )
        
        if include_relations:
            tools = query.all()
        else:
            tools = self.session.query(Tool).all()
        
        # 转换为字典格式
        tools_data = []
        for tool in tools:
            tool_dict = {
                "id": tool.id,
                "slug": tool.slug,
                "name": tool.name,
                "category_name": tool.category_name,
                "summary": tool.summary,
                "description": tool.description,
                "editor_comment": tool.editor_comment,
                "developer": tool.developer,
                "country": tool.country,
                "city": tool.city,
                "price": tool.price,
                "platforms": tool.platforms,
                "vpn_required": tool.vpn_required,
                "access_flags": tool.access_flags,
                "official_url": tool.official_url,
                "logo_path": tool.logo_path,
                "logo_status": tool.logo_status,
                "logo_source": tool.logo_source,
                "score": tool.score,
                "review_count": tool.review_count,
                "status": tool.status,
                "featured": tool.featured,
                "pricing_type": tool.pricing_type,
                "price_min_cny": tool.price_min_cny,
                "price_max_cny": tool.price_max_cny,
                "free_allowance_text": tool.free_allowance_text,
                "created_on": tool.created_on.isoformat() if tool.created_on else None,
                "last_verified_at": tool.last_verified_at.isoformat() if tool.last_verified_at else None,
                "created_at": tool.created_at.isoformat() if tool.created_at else None,
                "updated_at": tool.updated_at.isoformat() if tool.updated_at else None,
            }
            
            if include_relations:
                # 添加分类数据
                tool_dict["categories"] = [
                    {"slug": cat.category.slug, "name": cat.category.name}
                    for cat in tool.categories
                ]
                
                # 添加标签数据
                tool_dict["tags"] = [
                    {"name": tag.tag.name}
                    for tag in tool.tags
                ]
                
                # 添加评论统计
                tool_dict["reviews_summary"] = {
                    "total_reviews": len(tool.reviews),
                    "average_rating": sum(r.rating or 0 for r in tool.reviews) / len(tool.reviews) if tool.reviews else 0
                }
            
            tools_data.append(tool_dict)
        
        # 根据格式导出
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        output_file = self.output_dir / f"tools_{timestamp}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(tools_data, f, ensure_ascii=False, indent=2)
        
        print(f"工具数据已导出到: {output_file}")
        return output_file
    
    def export_categories(self, format_type: str = "json") -> Path:
        """导出分类数据"""
        print("正在导出分类数据...")
        
        categories = self.session.query(Category).options(
            joinedload(Category.tools).joinedload(ToolCategory.tool)
        ).all()
        
        categories_data = []
        for category in categories:
            category_dict = {
                "id": category.id,
                "slug": category.slug,
                "name": category.name,
                "description": category.description,
                "tool_count": len(category.tools),
                "created_at": category.created_at.isoformat() if category.created_at else None,
                "updated_at": category.updated_at.isoformat() if category.updated_at else None,
            }
            categories_data.append(category_dict)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        output_file = self.output_dir / f"categories_{timestamp}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(categories_data, f, ensure_ascii=False, indent=2)
        
        print(f"分类数据已导出到: {output_file}")
        return output_file
    
    def export_reviews(self, format_type: str = "json", limit: int = None) -> Path:
        """导出评论数据"""
        print("正在导出评论数据...")
        
        query = self.session.query(ToolReview).options(
            joinedload(ToolReview.tool),
            joinedload(ToolReview.user)
        )
        
        if limit:
            query = query.limit(limit)
        
        reviews = query.all()
        
        reviews_data = []
        for review in reviews:
            review_dict = {
                "id": review.id,
                "tool_id": review.tool_id,
                "tool_name": review.tool.name if review.tool else None,
                "user_id": review.user_id,
                "username": review.user.username if review.user else None,
                "source_type": review.source_type,
                "status": review.status,
                "rating": review.rating,
                "title": review.title,
                "body": review.body,
                "pitfalls": review.pitfalls_json,
                "pros": review.pros_json,
                "cons": review.cons_json,
                "audience": review.audience,
                "task": review.task,
                "created_at": review.created_at.isoformat() if review.created_at else None,
                "updated_at": review.updated_at.isoformat() if review.updated_at else None,
            }
            reviews_data.append(review_dict)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        output_file = self.output_dir / f"reviews_{timestamp}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(reviews_data, f, ensure_ascii=False, indent=2)
        
        print(f"评论数据已导出到: {output_file}")
        return output_file
    
    def export_all(self, format_type: str = "json", include_relations: bool = True) -> List[Path]:
        """导出所有数据"""
        print("开始导出所有数据...")
        
        exported_files = []
        
        # 导出各类数据
        exported_files.append(self.export_tools(format_type, include_relations))
        exported_files.append(self.export_categories(format_type))
        exported_files.append(self.export_reviews(format_type))
        
        print(f"所有数据导出完成！共导出 {len(exported_files)} 个文件")
        return exported_files


def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="导出星点评平台数据")
    parser.add_argument(
        "--type", 
        choices=["tools", "categories", "reviews", "all"],
        default="all",
        help="要导出的数据类型"
    )
    parser.add_argument(
        "--format",
        choices=["json"],
        default="json",
        help="导出格式（仅支持JSON）"
    )
    parser.add_argument(
        "--output-dir",
        type=str,
        default="output",
        help="输出目录"
    )
    parser.add_argument(
        "--no-relations",
        action="store_true",
        help="不包含关联数据"
    )
    parser.add_argument(
        "--reviews-limit",
        type=int,
        help="限制导出的评论数量"
    )
    
    args = parser.parse_args()
    
    # 创建输出目录
    output_dir = Path(args.output_dir)
    output_dir.mkdir(exist_ok=True)
    
    # 创建数据库会话
    session = SessionLocal()
    
    try:
        # 创建导出器
        exporter = DataExporter(session, output_dir)
        
        # 根据类型导出数据
        if args.type == "tools":
            exporter.export_tools(args.format, not args.no_relations)
        elif args.type == "categories":
            exporter.export_categories(args.format)
        elif args.type == "reviews":
            exporter.export_reviews(args.format, args.reviews_limit)
        elif args.type == "all":
            exporter.export_all(args.format, not args.no_relations)
        
        print("数据导出成功！")
        
    except Exception as e:
        print(f"导出失败: {e}", file=sys.stderr)
        sys.exit(1)
    finally:
        session.close()


if __name__ == "__main__":
    main()
