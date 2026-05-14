from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class ExperienceBoardItem(BaseModel):
    id: int
    slug: str
    title: str
    description: str
    accent: str
    sortOrder: int
    postCount: int = 0


class ExperienceAuthor(BaseModel):
    id: int | None = None
    username: str


class ExperiencePostItem(BaseModel):
    id: int
    slug: str
    title: str
    summary: str
    body: str = ""
    channel: str
    boardSlug: str
    boardTitle: str
    scenario: str
    tools: list[str] = Field(default_factory=list)
    roles: list[str] = Field(default_factory=list)
    coverImageUrl: str = ""
    imageUrls: list[str] = Field(default_factory=list)
    author: ExperienceAuthor
    status: str
    viewCount: int
    likeCount: int
    favoriteCount: int
    commentCount: int
    isOfficial: bool
    publishedAt: datetime | None = None
    createdAt: datetime
    updatedAt: datetime


class ExperienceListResponse(BaseModel):
    items: list[ExperiencePostItem]
    boards: list[ExperienceBoardItem]
    channels: list[str]
    total: int
    page: int
    pageSize: int
    hasMore: bool


class CreateExperiencePostRequest(BaseModel):
    title: str = Field(min_length=2, max_length=255)
    summary: str = Field(min_length=2, max_length=512)
    body: str = Field(min_length=2)
    channel: str = Field(min_length=1, max_length=80)
    boardSlug: str = Field(min_length=1, max_length=120)
    scenario: str = Field(default="", max_length=160)
    tools: list[str] = Field(default_factory=list, max_length=8)
    roles: list[str] = Field(default_factory=list, max_length=8)
    coverImageUrl: str = Field(default="", max_length=512)
    imageUrls: list[str] = Field(default_factory=list, max_length=6)

    @field_validator("title", "summary", "body", "channel", "boardSlug", "scenario", "coverImageUrl", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value

    @field_validator("tools", "roles", "imageUrls", mode="before")
    @classmethod
    def strip_list(cls, value: list[str]) -> list[str]:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class ExperienceCommentItem(BaseModel):
    id: int
    postId: int
    parentId: int | None = None
    body: str
    imageUrl: str = ""
    status: str
    likeCount: int
    author: ExperienceAuthor
    createdAt: datetime
    updatedAt: datetime


class CreateExperienceCommentRequest(BaseModel):
    body: str = Field(min_length=1)
    imageUrl: str = Field(default="", max_length=512)
    parentId: int | None = None

    @field_validator("body", "imageUrl", mode="before")
    @classmethod
    def strip_text(cls, value: str) -> str:
        return value.strip() if isinstance(value, str) else value
