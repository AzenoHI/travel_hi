import secrets
from pathlib import Path
from fastapi import UploadFile, HTTPException, status
from app.core.config import settings


def validate_and_store_image(file: UploadFile) -> str:
    if file is None:
        return None
    # if file.content_type not in settings.ALLOWED_IMAGE_MIME:
    #     raise HTTPException(status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, detail="Unsupported image type")
    contents = file.file.read(settings.MAX_IMAGE_BYTES + 1)
    if len(contents) == 0:
        raise HTTPException(status_code=422, detail="Empty file")
    if len(contents) > settings.MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image too large")
    suffix = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }[file.content_type]
    name = f"{secrets.token_urlsafe(24)}{suffix}"
    dest = Path(settings.IMAGES_UPLOAD_DIR) / name
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_bytes(contents)
    return dest.name
