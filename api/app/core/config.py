import os

from pydantic import Field
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv(".envs/.env")


class Settings(BaseSettings):
    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    DB_POOL_RECYCLE: int = 1800
    DB_PRE_PING: bool = True
    DB_ECHO: bool = False
    OPENAI_API_KEY: str = Field(..., alias="OPENAI_API_KEY")

    DB_STATEMENT_TIMEOUT_S: int = 30

    DB_CONNECT_RETRIES: int = 10
    DB_CONNECT_BACKOFF_S: float = 1.5

    MAX_IMAGE_BYTES: int = 5 * 1024 * 1024  # 5 MB
    IMAGES_UPLOAD_DIR: str = Field("uploaded_images", alias="IMAGES_UPLOAD_DIR")

    @property
    def DATABASE_URL(self) -> str:
        return "sqlite+aiosqlite:///./app.db"


settings = Settings()
