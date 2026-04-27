from sqlalchemy.orm import Session

from app.db.session import Base, SessionLocal, engine
from app.models.models import Category, Tag, Tool, ToolCategory, ToolTag
from app.services.catalog_views_seed import seed_catalog_views
from app.services.logo_assets import LOGO_SOURCE_FALLBACK, normalize_logo_path, resolve_logo_status
from app.services.seed_data import CATEGORIES, TOOLS


def run() -> None:
    Base.metadata.create_all(bind=engine)
    session: Session = SessionLocal()

    try:
        for category in CATEGORIES:
            exists = session.query(Category).filter(Category.slug == category.slug).first()
            if not exists:
                session.add(
                    Category(
                        slug=category.slug,
                        name=category.name,
                        description=category.description,
                    )
                )

        session.flush()

        for tool in TOOLS:
            row = session.query(Tool).filter(Tool.slug == tool.slug).first()
            if row is not None:
                continue

            row = Tool(
                slug=tool.slug,
                name=tool.name,
                category_name=tool.category,
                summary=tool.summary,
                description=tool.description,
                editor_comment=tool.editorComment,
                developer=tool.developer,
                country=tool.country,
                city=tool.city,
                price=tool.price,
                platforms=tool.platforms,
                vpn_required=tool.vpnRequired,
                access_flags=tool.accessFlags.model_dump() if tool.accessFlags else None,
                official_url=tool.officialUrl,
                logo_path=normalize_logo_path(tool.logoPath),
                logo_status=resolve_logo_status(tool.logoPath),
                logo_source=LOGO_SOURCE_FALLBACK,
                score=tool.score,
                review_count=tool.reviewCount,
                status=tool.status,
                featured=tool.featured,
                pricing_type=tool.pricingType,
                price_min_cny=tool.priceMinCny,
                price_max_cny=tool.priceMaxCny,
                free_allowance_text=tool.freeAllowanceText,
                features_json=tool.features,
                limitations_json=tool.limitations,
                best_for_json=tool.bestFor,
                deal_summary=tool.dealSummary,
                media_items_json=[item.model_dump() for item in (tool.mediaItems or [])],
                created_on=tool.createdAt,
                last_verified_at=tool.lastVerifiedAt,
            )
            session.add(row)
            session.flush()

            category = session.query(Category).filter(Category.slug == tool.categorySlug).first()
            if category and not session.query(ToolCategory).filter_by(tool_id=row.id, category_id=category.id).first():
                session.add(ToolCategory(tool_id=row.id, category_id=category.id))

            for tag_name in tool.tags:
                tag = session.query(Tag).filter(Tag.name == tag_name).first()
                if tag is None:
                    tag = Tag(name=tag_name)
                    session.add(tag)
                    session.flush()
                if not session.query(ToolTag).filter_by(tool_id=row.id, tag_id=tag.id).first():
                    session.add(ToolTag(tool_id=row.id, tag_id=tag.id))

        session.flush()
        ranking_count, scenario_count = seed_catalog_views(session)
        session.commit()
        print(
            f"Database tables and seed data ensured. "
            f"Catalog views refreshed: {ranking_count} rankings, {scenario_count} scenarios."
        )
    finally:
        session.close()


if __name__ == "__main__":
    run()
