
from app.db.session import SessionLocal
from app.services.catalog_service import list_categories, list_scenarios

with SessionLocal() as db:
    # Test that all functions accept db dependency now
    categories = list_categories(db=db)
    print(f'list_categories works: {len(categories)} categories')
    scenarios = list_scenarios(db=db)
    print(f'list_scenarios works: {len(scenarios)} scenarios')
    if categories:
        print(f'  First category: {categories[0].name}')
