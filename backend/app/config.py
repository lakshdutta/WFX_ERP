import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    VANNA_API_KEY: str = os.getenv("VANNA_API_KEY", "")
    PORT: int = int(os.getenv("PORT", 8000))
    
    # Enable automatic SQLite fallback if DB info is missing
    @property
    def is_supabase_configured(self) -> bool:
        return bool(self.DATABASE_URL or (self.SUPABASE_URL and self.SUPABASE_KEY))

settings = Settings()
