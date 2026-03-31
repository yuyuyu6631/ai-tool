from sqlalchemy.orm import Session

from app.db.session import Base, SessionLocal, engine
from app.models.models import Category, Tool
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

        for tool in TOOLS:
            exists = session.query(Tool).filter(Tool.slug == tool.slug).first()
            if not exists:
                session.add(
                    Tool(
                        slug=tool.slug,
                        name=tool.name,
                        category_name=tool.category,
                        summary=tool.summary,
                        description=tool.description,
                        editor_comment=tool.editorComment,
                        official_url=tool.officialUrl,
                        logo_path=normalize_logo_path(tool.logoPath),
                        logo_status=resolve_logo_status(tool.logoPath),
                        logo_source=LOGO_SOURCE_FALLBACK,
                        score=tool.score,
                        status=tool.status,
                        featured=tool.featured,
                        created_on=tool.createdAt,
                        last_verified_at=tool.lastVerifiedAt,
                    )
                )

        session.commit()
        print("Database tables and seed data ensured.")
    finally:
        session.close()


if __name__ == "__main__":
    run()
