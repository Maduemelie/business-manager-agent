import pytest
from app.models.schemas import PerfumeModel
from app.prompts.content_prompts import ContentPromptBuilder

def test_system_prompt():
    builder = ContentPromptBuilder()
    prompt = builder.build_system_prompt()
    assert "Head of Marketing for SirviniStyles" in prompt
    assert "Nigerian buying psychology" in prompt
    assert "Lagos lifestyle" in prompt

def test_brand_section():
    builder = ContentPromptBuilder()
    brand_sec = builder.build_brand_section()
    assert "SirviniStyles" in brand_sec
    assert "Nigerian Buying Psychology" in brand_sec
    assert "Luxury Definition" in brand_sec
    assert "Worth every drop" in brand_sec

def test_environment_section():
    builder = ContentPromptBuilder()
    env_sec = builder.build_environment_section(
        day_context="Today is Monday",
        time_of_day="Morning",
        weather="Cloudy, 25°C"
    )
    assert "Today is Monday" in env_sec
    assert "Morning" in env_sec
    assert "Cloudy, 25°C" in env_sec
    assert "Season:" in env_sec
    assert "Salary Week:" in env_sec
    assert "Weekend:" in env_sec

def test_product_section():
    builder = ContentPromptBuilder()
    perfume = PerfumeModel(
        id=123,
        perfume_name="Supreme Oud",
        brand="SirviniStyles",
        description="A rich woodsy fragrance",
        scent_profile="Oud, Sandalwood, Vanilla",
        longevity="24+ Hours",
        best_for="Oud lovers",
        category="Oud & Luxury",
        inspired_by="Oud Wood by Tom Ford",
        gender="Male",
        projection="Very Strong",
        season="Harmattan",
        occasion="Gala, Weddings",
        mood="Powerful, Regal",
        luxury_level="Ultra Premium",
        compliment_factor="Extreme",
        bottle_size="100ml",
        available_sizes="15ml, 50ml, 100ml",
        price="₦25,000"
    )
    
    prod_sec = builder.build_product_section(perfume)
    assert "Supreme Oud" in prod_sec
    assert "Oud Wood by Tom Ford" in prod_sec
    assert "₦25,000" in prod_sec
    assert "Very Strong" in prod_sec
    assert "CRITICAL TONE INSTRUCTION:" in prod_sec

def test_content_strategy():
    builder = ContentPromptBuilder()
    # Test monday strategy
    strat_sec = builder.build_content_strategy(0, "Fragrance Spotlight", "Sell it", True)
    assert "Fragrance Spotlight" in strat_sec
    assert "✔ 100% Perfume Oil" in strat_sec
    assert "Emotion Before Features:" in strat_sec
    
    # Test tuesday strategy
    strat_sec_2 = builder.build_content_strategy(1, "Education", "Teach them", True)
    assert "Teach them WHY this specific scent profile matters" in strat_sec_2

def test_platform_rules():
    builder = ContentPromptBuilder()
    # Monday has reel
    rules = builder.build_platform_rules(0)
    assert "Reel Video Script Instructions:" in rules
    assert "Opening Hook" in rules
    assert "Shot List" in rules
    assert "Voiceover" in rules
    
    # Tuesday doesn't have reel
    rules_no_reel = builder.build_platform_rules(1)
    assert "Reel Video Script Instructions:" not in rules_no_reel

def test_constraints():
    builder = ContentPromptBuilder()
    constraints = builder.build_constraints()
    assert "NEVER use words like: \"olfactory\"" in constraints
    assert "Every post should end with EXACTLY ONE clear action." in constraints
    assert "❌ NEVER use more than 4 emojis per post." in constraints

def test_output_schema():
    builder = ContentPromptBuilder()
    schema_reel = builder.build_output_schema(0)
    assert "reel_script" in schema_reel
    assert "hashtags" in schema_reel
    assert "keywords" in schema_reel
    assert "hook" in schema_reel
    assert "cta" in schema_reel
    assert "image_prompt" in schema_reel
    assert "engagement_question" in schema_reel

def test_full_prompt():
    builder = ContentPromptBuilder()
    perfume = PerfumeModel(
        id=123,
        perfume_name="Supreme Oud",
        brand="SirviniStyles"
    )
    prompt = builder.build_full_prompt(
        day_context="Today is Monday",
        time_of_day="Morning",
        weather="Rainy",
        day_of_week=0,
        theme_name="Spotlight",
        objective="Sell it",
        perfume=perfume
    )
    assert "Head of Marketing" in prompt
    assert "Supreme Oud" in prompt
    assert "spotlight" in prompt.lower()
    assert "reel_script" in prompt
