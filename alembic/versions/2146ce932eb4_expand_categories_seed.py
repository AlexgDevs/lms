"""expand categories seed

Revision ID: 2146ce932eb4
Revises: c4e309b8d939
Create Date: 2026-08-13 18:09:41.727211

"""
import uuid
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '2146ce932eb4'
down_revision: Union[str, Sequence[str], None] = 'c4e309b8d939'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


# (slug, name, icon, parent_slug, sort_order)
CATEGORY_SEED: list[tuple[str, str, str | None, str | None, int]] = [
    # ---- Top-level blocks ----
    ("programming-it", "Программирование и IT", "💻", None, 0),
    ("design", "Дизайн", "🎨", None, 1),
    ("business", "Бизнес и предпринимательство", "💼", None, 2),
    ("marketing", "Маркетинг и продажи", "📈", None, 3),
    ("finance", "Финансы и инвестиции", "💰", None, 4),
    ("languages", "Иностранные языки", "🌍", None, 5),
    ("data-science", "Data Science и ИИ", "🤖", None, 6),
    ("gamedev", "Разработка игр", "🎮", None, 7),
    ("music", "Музыка", "🎵", None, 8),
    ("photo-video", "Фотография и видео", "📷", None, 9),
    ("psychology", "Психология и саморазвитие", "🧠", None, 10),
    ("career", "Профессии и карьера", "🧭", None, 11),
    ("sport", "Спорт и здоровье", "🏋️", None, 12),
    ("hobbies", "Хобби и творчество", "✨", None, 13),
    # ---- Programming & IT ----
    ("web-development", "Веб-разработка", None, "programming-it", 0),
    ("mobile-development", "Мобильная разработка", None, "programming-it", 1),
    ("desktop-development", "Desktop-разработка", None, "programming-it", 2),
    ("qa-testing", "Тестирование (QA)", None, "programming-it", 3),
    ("cybersecurity", "Кибербезопасность", None, "programming-it", 4),
    ("devops", "DevOps и CI/CD", None, "programming-it", 5),
    ("databases", "Базы данных и SQL", None, "programming-it", 6),
    ("linux", "Linux и администрирование", None, "programming-it", 7),
    ("python", "Python", None, "programming-it", 8),
    ("js-ts", "JavaScript / TypeScript", None, "programming-it", 9),
    ("java", "Java", None, "programming-it", 10),
    ("dotnet", "C# и .NET", None, "programming-it", 11),
    ("cpp", "C и C++", None, "programming-it", 12),
    ("go", "Go", None, "programming-it", 13),
    ("rust", "Rust", None, "programming-it", 14),
    ("kotlin", "Kotlin", None, "programming-it", 15),
    ("swift", "Swift", None, "programming-it", 16),
    ("php", "PHP", None, "programming-it", 17),
    # ---- Design ----
    ("ui-ux", "UI/UX дизайн", None, "design", 0),
    ("graphic-design", "Графический дизайн", None, "design", 1),
    ("web-design", "Веб-дизайн", None, "design", 2),
    ("illustration", "Иллюстрация", None, "design", 3),
    ("3d-modeling", "2D и 3D моделирование", None, "design", 4),
    ("branding", "Брендинг и логотипы", None, "design", 5),
    ("figma", "Figma", None, "design", 6),
    ("photoshop", "Adobe Photoshop", None, "design", 7),
    ("illustrator", "Adobe Illustrator", None, "design", 8),
    ("interior-design", "Дизайн интерьеров", None, "design", 9),
    # ---- Business ----
    ("project-management", "Управление проектами", None, "business", 0),
    ("startups", "Стартапы", None, "business", 1),
    ("pm", "Проджект-менеджмент", None, "business", 2),
    ("entrepreneurship", "Предпринимательство", None, "business", 3),
    ("negotiations", "Переговоры", None, "business", 4),
    ("leadership", "Лидерство", None, "business", 5),
    ("team-management", "Управление командой", None, "business", 6),
    # ---- Marketing ----
    ("smm", "SMM", None, "marketing", 0),
    ("contextual-ads", "Контекстная реклама", None, "marketing", 1),
    ("targeted-ads", "Таргетированная реклама", None, "marketing", 2),
    ("seo", "SEO", None, "marketing", 3),
    ("email-marketing", "Email-маркетинг", None, "marketing", 4),
    ("content-marketing", "Контент-маркетинг", None, "marketing", 5),
    ("sales", "Продажи", None, "marketing", 6),
    ("copywriting", "Копирайтинг", None, "marketing", 7),
    ("marketing-analytics", "Аналитика маркетинга", None, "marketing", 8),
    # ---- Finance ----
    ("personal-finance", "Личные финансы", None, "finance", 0),
    ("investing", "Инвестиции", None, "finance", 1),
    ("stock-market", "Фондовый рынок", None, "finance", 2),
    ("crypto", "Криптовалюты", None, "finance", 3),
    ("accounting", "Бухгалтерия", None, "finance", 4),
    ("taxes", "Налоги", None, "finance", 5),
    ("financial-literacy", "Финансовая грамотность", None, "finance", 6),
    # ---- Languages ----
    ("english", "Английский язык", None, "languages", 0),
    ("english-for-it", "Английский для IT", None, "languages", 1),
    ("german", "Немецкий язык", None, "languages", 2),
    ("french", "Французский язык", None, "languages", 3),
    ("spanish", "Испанский язык", None, "languages", 4),
    ("italian", "Итальянский язык", None, "languages", 5),
    ("chinese", "Китайский язык", None, "languages", 6),
    ("japanese", "Японский язык", None, "languages", 7),
    ("korean", "Корейский язык", None, "languages", 8),
    # ---- Data Science ----
    ("machine-learning", "Машинное обучение", None, "data-science", 0),
    ("deep-learning", "Глубокое обучение", None, "data-science", 1),
    ("neural-networks", "Нейросети", None, "data-science", 2),
    ("data-analysis", "Анализ данных", None, "data-science", 3),
    ("big-data", "Большие данные", None, "data-science", 4),
    ("python-data", "Python для данных", None, "data-science", 5),
    ("ai", "Искусственный интеллект", None, "data-science", 6),
    # ---- Game dev ----
    ("unity", "Unity и C#", None, "gamedev", 0),
    ("unreal", "Unreal Engine и C++", None, "gamedev", 1),
    ("godot", "Godot", None, "gamedev", 2),
    ("gamedesign", "Геймдизайн", None, "gamedev", 3),
    ("game-graphics", "Игровая графика", None, "gamedev", 4),
    ("game-3d", "3D для игр", None, "gamedev", 5),
    # ---- Music ----
    ("music-theory", "Теория музыки", None, "music", 0),
    ("guitar", "Игра на гитаре", None, "music", 1),
    ("piano", "Игра на фортепиано", None, "music", 2),
    ("production", "Синтезаторы и продакшн", None, "music", 3),
    ("mixing", "Сведение и мастеринг", None, "music", 4),
    ("vocals", "Вокал", None, "music", 5),
    # ---- Photo & Video ----
    ("photography", "Фотография", None, "photo-video", 0),
    ("photo-editing", "Обработка фото", None, "photo-video", 1),
    ("videography", "Видеосъёмка", None, "photo-video", 2),
    ("video-editing", "Монтаж видео", None, "photo-video", 3),
    ("mobile-shooting", "Мобильная съёмка", None, "photo-video", 4),
    ("premiere", "Adobe Premiere", None, "photo-video", 5),
    ("postproduction", "Послепродакшн", None, "photo-video", 6),
    # ---- Psychology ----
    ("personality", "Психология личности", None, "psychology", 0),
    ("psychotherapy", "Психотерапия", None, "psychology", 1),
    ("eq", "Эмоциональный интеллект", None, "psychology", 2),
    ("self-growth", "Саморазвитие", None, "psychology", 3),
    ("speed-reading", "Скорочтение", None, "psychology", 4),
    ("memory", "Память и внимание", None, "psychology", 5),
    ("meditation", "Медитация", None, "psychology", 6),
    # ---- Career ----
    ("resume-interview", "Резюме и собеседования", None, "career", 0),
    ("career-guidance", "Профориентация", None, "career", 1),
    ("it-career", "IT-карьера", None, "career", 2),
    ("design-career", "Карьера в дизайне", None, "career", 3),
    ("freelance", "Фриланс", None, "career", 4),
    # ---- Sport & Health ----
    ("fitness", "Фитнес", None, "sport", 0),
    ("yoga", "Йога", None, "sport", 1),
    ("nutrition", "Питание и нутрициология", None, "sport", 2),
    ("healthy-lifestyle", "ЗОЖ", None, "sport", 3),
    ("running", "Бег", None, "sport", 4),
    # ---- Hobbies ----
    ("cooking", "Кулинария", None, "hobbies", 0),
    ("handicraft", "Рукоделие", None, "hobbies", 1),
    ("gardening", "Садоводство", None, "hobbies", 2),
    ("travel", "Путешествия", None, "hobbies", 3),
    ("writing", "Писательство", None, "hobbies", 4),
    ("blogging", "Блогинг", None, "hobbies", 5),
]


def _category_id(slug: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"lms:category:{slug}"))


def upgrade() -> None:
    """Upgrade schema."""
    # Replace the previous small seed with the expanded tree.
    op.execute(sa.text("DELETE FROM categories"))

    categories_table = sa.table(
        "categories",
        sa.column("id", sa.Uuid()),
        sa.column("name", sa.String()),
        sa.column("slug", sa.String()),
        sa.column("icon", sa.String()),
        sa.column("parent_id", sa.Uuid()),
        sa.column("sort_order", sa.Integer()),
    )
    op.bulk_insert(
        categories_table,
        [
            {
                "id": _category_id(slug),
                "name": name,
                "slug": slug,
                "icon": icon,
                "parent_id": _category_id(parent_slug) if parent_slug else None,
                "sort_order": sort_order,
            }
            for slug, name, icon, parent_slug, sort_order in CATEGORY_SEED
        ],
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.execute(sa.text("DELETE FROM categories"))
