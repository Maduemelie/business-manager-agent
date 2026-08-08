import datetime
from app.services.theme_engine import ThemeEngine

def test_theme_engine_calendar_resolution():
    engine = ThemeEngine()
    
    # Monday July 27, 2026 is week 4
    monday = datetime.date(2026, 7, 27)
    assert monday.weekday() == 0
    assert engine.get_week_of_month(monday) == 4
    assert engine.get_category_for_date(monday) == "Unisex & Women's"
    assert engine.get_theme_for_date(monday).name == "Fragrance Spotlight"
    assert engine.requires_reel(monday.weekday()) is True

def test_theme_engine_time_slots():
    engine = ThemeEngine()
    assert engine.get_time_of_day(8) == "Morning"
    assert engine.get_time_of_day(14) == "Afternoon"
    assert engine.get_time_of_day(19) == "Evening"
