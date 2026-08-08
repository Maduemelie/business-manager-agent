import datetime
import logging
from ..models.schemas import ThemeInfo

logger = logging.getLogger(__name__)

THEMES = {
    0: ThemeInfo(name="Fragrance Spotlight", objective="Sell a featured perfume"),
    1: ThemeInfo(name="Fragrance Education", objective="Build trust & authority"),
    2: ThemeInfo(name="Fragrance Finder", objective="Increase engagement (polls/questions)"),
    3: ThemeInfo(name="Perfume Lifestyle", objective="Create desire"),
    4: ThemeInfo(name="Weekend Collection", objective="Drive sales for the weekend"),
    5: ThemeInfo(name="Reviews & Trust", objective="Build credibility (simulate a happy customer)"),
    6: ThemeInfo(name="Perfume Academy", objective="Long-form educational content")
}

class ThemeEngine:
    def __init__(self):
        logger.info("ThemeEngine initialized.")

    def get_week_of_month(self, date_obj: datetime.date) -> int:
        day = date_obj.day
        week = (day - 1) // 7 + 1
        return min(week, 4)

    def get_active_category(self, week: int) -> str:
        rotation = {
            1: "Fresh & Everyday",
            2: "Bold & Masculine",
            3: "Oud & Luxury",
            4: "Unisex & Women's"
        }
        return rotation.get(week, "Fresh & Everyday")

    def get_theme_for_date(self, date_obj: datetime.date) -> ThemeInfo:
        day_of_week = date_obj.weekday()
        theme = THEMES.get(day_of_week, THEMES[0])
        logger.info(f"Theme resolved for day {day_of_week}: '{theme.name}'")
        return theme

    def get_category_for_date(self, date_obj: datetime.date) -> str:
        week = self.get_week_of_month(date_obj)
        category = self.get_active_category(week)
        logger.info(f"Category resolved for date {date_obj} (Week: {week}): '{category}'")
        return category

    def should_be_generic(self, day_of_week: int) -> bool:
        import random
        # Tuesday (1) and Thursday (3) have 50% chance of being generic
        if day_of_week in [1, 3]:
            choice = random.choice([True, False])
            logger.info(f"Day is {day_of_week}. Randomly determined post generic state: {choice}")
            return choice
        # Sunday (6) is always generic
        elif day_of_week == 6:
            logger.info("Day is Sunday (6). Post is generic.")
            return True
        logger.info(f"Day is {day_of_week}. Post is product-focused.")
        return False

    def requires_reel(self, day_of_week: int) -> bool:
        # Monday (0), Wednesday (2), Friday (4), Saturday (5)
        ans = day_of_week in [0, 2, 4, 5]
        logger.info(f"Reel requirement check for day {day_of_week}: {ans}")
        return ans

    def get_time_of_day(self, hour: int) -> str:
        if hour < 12:
            return "Morning"
        elif hour < 18:
            return "Afternoon"
        return "Evening"

    def get_day_context(self, day_name: str) -> str:
        """Returns day context string. 20% chance to reveal the actual day name."""
        import random
        if random.random() < 0.20:
            return f"Today is: {day_name}"
        return "The specific day of the week is hidden. Focus purely on the weather and time."
