"""File storage abstraction layer."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass
from pathlib import Path
from typing import Optional

import aiofiles
from fastapi import UploadFile

from ..core.config import get_settings


@dataclass
class StoredMedia:
    """Metadata returned after persisting a file."""

    key: str
    url: str
    local_path: Optional[Path] = None


class StorageProvider(ABC):
    """Minimal interface required by the application."""

    @abstractmethod
    async def save_audio(self, user_id: int, file: UploadFile) -> StoredMedia:
        raise NotImplementedError

    @abstractmethod
    def get_url(self, key: str) -> str:
        raise NotImplementedError


class LocalStorageProvider(StorageProvider):
    def __init__(self, base_dir: Path, base_url: str) -> None:
        self.base_dir = base_dir
        self.base_url = base_url.rstrip("/")
        self.audio_dir = self.base_dir / "audio"
        self.audio_dir.mkdir(parents=True, exist_ok=True)

    async def save_audio(self, user_id: int, file: UploadFile) -> StoredMedia:
        user_dir = self.audio_dir / str(user_id)
        user_dir.mkdir(parents=True, exist_ok=True)
        suffix = Path(file.filename or "").suffix or ".m4a"
        key = f"audio/{user_id}/{uuid.uuid4()}{suffix}"
        absolute_path = self.base_dir / key
        absolute_path.parent.mkdir(parents=True, exist_ok=True)

        async with aiofiles.open(absolute_path, "wb") as out_file:
            while chunk := await file.read(1024 * 1024):
                await out_file.write(chunk)

        url = self.get_url(key)
        return StoredMedia(key=key, url=url, local_path=absolute_path)

    def get_url(self, key: str) -> str:
        key = key.lstrip("/")
        if self.base_url.startswith("http"):
            return f"{self.base_url.rstrip('/')}/{key}"
        return f"{self.base_url}/{key}"


_provider: Optional[StorageProvider] = None


def get_storage_provider() -> StorageProvider:
    global _provider
    if _provider is None:
        settings = get_settings()
        if settings.storage_provider == "local":
            _provider = LocalStorageProvider(base_dir=settings.media_root, base_url=settings.media_base_url)
        else:
            raise NotImplementedError("Only local storage is currently implemented")
    return _provider


def reset_storage_provider() -> None:
    global _provider
    _provider = None


async def save_audio(user_id: int, file: UploadFile) -> StoredMedia:
    provider = get_storage_provider()
    return await provider.save_audio(user_id, file)


def get_audio_url(key: str) -> str:
    provider = get_storage_provider()
    return provider.get_url(key)
