from pydantic import BaseModel
from typing import List, Optional

class PerfumeModel(BaseModel):
    id: int
    image_filename: Optional[str] = None
    perfume_name: str
    brand: str
    description: Optional[str] = None
    scent_profile: Optional[str] = None
    longevity: Optional[str] = None
    best_for: Optional[str] = None
    category: Optional[str] = None
    image_generation_prompt: Optional[str] = None
    inspired_by: Optional[str] = None
    gender: Optional[str] = None
    projection: Optional[str] = None
    season: Optional[str] = None
    occasion: Optional[str] = None
    mood: Optional[str] = None
    luxury_level: Optional[str] = None
    compliment_factor: Optional[str] = None
    bottle_size: Optional[str] = None
    available_sizes: Optional[str] = None
    price: Optional[str] = None

class WhatsAppStatus(BaseModel):
    time: str
    content: str
    image_suggestion: Optional[str] = None

class LLMContentResponse(BaseModel):
    main_post: str
    whatsapp_sequence: List[WhatsAppStatus]
    reel_script: Optional[str] = None
    hashtags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    hook: Optional[str] = None
    cta: Optional[str] = None
    image_prompt: Optional[str] = None
    engagement_question: Optional[str] = None

class GenerateResponse(BaseModel):
    perfume_id: Optional[int] = None
    perfume_name: str
    brand: str
    theme: str
    week_of_month: int
    active_category: str
    is_generic: bool
    main_post: str
    whatsapp_sequence: List[WhatsAppStatus]
    reel_script: Optional[str] = None
    image_url: Optional[str] = None
    generated_image_file: Optional[str] = None
    hashtags: Optional[List[str]] = None
    keywords: Optional[List[str]] = None
    hook: Optional[str] = None
    cta: Optional[str] = None
    image_prompt: Optional[str] = None
    engagement_question: Optional[str] = None

class GenerateRequest(BaseModel):
    perfume_id: Optional[int] = None

class ThemeInfo(BaseModel):
    name: str
    objective: str
