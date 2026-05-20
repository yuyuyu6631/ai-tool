from __future__ import annotations

import re
from datetime import UTC, datetime
from urllib.parse import urlparse

from fastapi import HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.models.models import ExperienceBoard, ExperienceComment, ExperiencePost, User
from app.schemas.experience import (
    CreateExperienceCommentRequest,
    CreateExperiencePostRequest,
    ExperienceAuthor,
    ExperienceBoardItem,
    ExperienceCommentItem,
    ExperienceListResponse,
    ExperiencePostItem,
)

PUBLIC_STATUS = "published"
DEFAULT_CHANNELS = ["实战教程", "避坑反馈", "工具组合", "福利线索"]

DEFAULT_BOARDS = [
    {
        "slug": "skill-community",
        "title": "Skill 社区",
        "description": "围绕 Codex / Claude / Cursor 等工作流技能沉淀可复用做法。",
        "accent": "gold",
        "sort_order": 10,
    },
    {
        "slug": "mcp-community",
        "title": "MCP 社区",
        "description": "分享 MCP Server、工具连接、数据源接入和踩坑修复。",
        "accent": "blue",
        "sort_order": 20,
    },
    {
        "slug": "openclaw-lobster",
        "title": "OpenClaw 养龙虾",
        "description": "OpenClaw 自动化、浏览器控制和本地助手玩法交流。",
        "accent": "orange",
        "sort_order": 30,
    },
    {
        "slug": "hammers-community",
        "title": "Hammers 社区",
        "description": "面向效率工具、智能代理和团队工具链的组合讨论。",
        "accent": "ink",
        "sort_order": 40,
    },
]

DEFAULT_POSTS = [
    {
        "slug": "chatgpt-gamma-prd-report",
        "title": "用 ChatGPT 先拆 PRD，再让 Gamma 生成汇报初稿",
        "summary": "先把客户访谈拆成目标、限制和验收点，再把结构化内容交给演示工具生成可评审版本。",
        "body": "把客户访谈材料拆成目标、受众、限制和验收标准，再交给 Gamma 生成评审稿。最后人工复核客户原话和关键数据，避免把未确认指标包装成结论。",
        "channel": "实战教程",
        "board_slug": "skill-community",
        "scenario": "文档写作",
        "tools": ["ChatGPT", "Gamma"],
        "roles": ["产品", "运营"],
        "cover": "/brand/logo.png",
        "images": ["/logos/博思AIPPT.png", "/logos/135 AI排版助手.png"],
        "author": "星点评编辑部",
        "views": 128,
        "likes": 34,
        "favorites": 17,
        "comments": 6,
        "official": True,
    },
    {
        "slug": "mcp-figma-docs-workflow",
        "title": "MCP 社区周报：把 Figma、Docs 和本地脚本串成设计验收流",
        "summary": "用 MCP 连接设计稿、文档和本地检查脚本，减少反复截图确认，让评审记录可追溯。",
        "body": "团队把 Figma 标注、产品文档和本地 lint/test 结果接进同一条工作流。讨论重点不是炫插件，而是权限、失败兜底和可复现的验收链路。",
        "channel": "工具组合",
        "board_slug": "mcp-community",
        "scenario": "设计实现",
        "tools": ["MCP", "Figma", "Google Docs"],
        "roles": ["前端", "设计"],
        "cover": "/logos/爱设计.png",
        "images": ["/logos/阿里云百炼.png"],
        "author": "MCP 观察员",
        "views": 214,
        "likes": 62,
        "favorites": 38,
        "comments": 18,
        "official": False,
    },
    {
        "slug": "openclaw-browser-agent-lobster",
        "title": "OpenClaw 养龙虾：浏览器代理跑网页验收，先管住权限",
        "summary": "把 OpenClaw 用在本地浏览器验收时，先限制可访问页面和写操作，避免自动化越界。",
        "body": "社区里最有效的做法是把验收目标写清楚：只检查页面状态、截图和交互，不让代理碰账户、支付和危险操作。先从只读验收开始，再逐步开放能力。",
        "channel": "避坑反馈",
        "board_slug": "openclaw-lobster",
        "scenario": "浏览器自动化",
        "tools": ["OpenClaw", "Playwright"],
        "roles": ["全栈", "测试"],
        "cover": "/logos/遨虾.png",
        "images": ["/logos/办公小浣熊.png"],
        "author": "养虾实践者",
        "views": 189,
        "likes": 47,
        "favorites": 25,
        "comments": 12,
        "official": False,
    },
    {
        "slug": "hammers-agent-tool-stack",
        "title": "Hammers 社区：团队 Agent 工具栈怎么分层才不乱",
        "summary": "把搜索、写作、代码、部署和知识库分层管理，避免每个人都在重复试同一批工具。",
        "body": "Hammers 社区的讨论集中在工具栈治理：个人效率工具、团队共享知识库、开发自动化和发布监控分层维护，统一记录适用任务和失败案例。",
        "channel": "福利线索",
        "board_slug": "hammers-community",
        "scenario": "团队工具栈",
        "tools": ["Hammers", "Notion AI", "Cursor"],
        "roles": ["研发管理", "运营"],
        "cover": "/logos/_Cosine Genie.png",
        "images": ["/logos/Flowin.png"],
        "author": "效率工具主理人",
        "views": 167,
        "likes": 39,
        "favorites": 22,
        "comments": 9,
        "official": False,
    },
]

DEFAULT_COMMENTS = [
    ("chatgpt-gamma-prd-report", "产品经理 Leo", "这个流程适合评审稿，最终版还是要人工补客户证据。"),
    ("mcp-figma-docs-workflow", "前端阿南", "MCP 权限边界一定要单独写文档，否则新人很难判断能不能跑。"),
    ("openclaw-browser-agent-lobster", "测试同学", "只读验收这个建议很实用，先把截图和路由状态跑通。"),
    ("hammers-agent-tool-stack", "运营 PM", "希望后面能有一版团队工具栈模板，方便直接照着建。"),
]


def _now() -> datetime:
    return datetime.now(UTC)


def _is_safe_display_url(value: str) -> bool:
    if not value:
        return True
    if any(ord(char) < 32 for char in value):
        return False
    if value.startswith("/") and not value.startswith("//"):
        return True
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _safe_url(value: str) -> str:
    candidate = value.strip()
    if not _is_safe_display_url(candidate):
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="图片 URL 仅支持 http(s) 或站内相对路径。")
    return candidate


def _safe_url_list(values: list[str]) -> list[str]:
    return [_safe_url(item) for item in values if item.strip()]


def _slugify(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.strip().lower())
    normalized = normalized.strip("-")
    return normalized or f"post-{int(_now().timestamp())}"


def ensure_default_experience_content(db: Session) -> None:
    if db.scalar(select(ExperienceBoard.id).limit(1)):
        return

    boards_by_slug: dict[str, ExperienceBoard] = {}
    for item in DEFAULT_BOARDS:
        board = ExperienceBoard(
            slug=item["slug"],
            title=item["title"],
            description=item["description"],
            accent=item["accent"],
            sort_order=item["sort_order"],
        )
        db.add(board)
        boards_by_slug[item["slug"]] = board
    db.flush()

    posts_by_slug: dict[str, ExperiencePost] = {}
    for index, item in enumerate(DEFAULT_POSTS):
        post = ExperiencePost(
            slug=item["slug"],
            title=item["title"],
            summary=item["summary"],
            body=item["body"],
            channel=item["channel"],
            board_id=boards_by_slug[item["board_slug"]].id,
            scenario=item["scenario"],
            tools_json=item["tools"],
            roles_json=item["roles"],
            cover_image_url=item["cover"],
            image_urls_json=item["images"],
            author_name=item["author"],
            status=PUBLIC_STATUS,
            view_count=item["views"],
            like_count=item["likes"],
            favorite_count=item["favorites"],
            comment_count=item["comments"],
            is_official=item["official"],
            published_at=_now(),
            created_at=_now(),
            updated_at=_now(),
        )
        db.add(post)
        posts_by_slug[item["slug"]] = post
    db.flush()

    for post_slug, author_name, body in DEFAULT_COMMENTS:
        post = posts_by_slug[post_slug]
        db.add(
            ExperienceComment(
                post_id=post.id,
                body=body,
                image_url="",
                status=PUBLIC_STATUS,
                like_count=0,
                created_at=_now(),
                updated_at=_now(),
                user_id=None,
            )
        )

    db.commit()


def _strings(value: list[str] | None) -> list[str]:
    return [item for item in (value or []) if isinstance(item, str) and item.strip()]


def serialize_board(board: ExperienceBoard, post_count: int = 0) -> ExperienceBoardItem:
    return ExperienceBoardItem(
        id=board.id,
        slug=board.slug,
        title=board.title,
        description=board.description,
        accent=board.accent,
        sortOrder=board.sort_order,
        postCount=post_count,
    )


def serialize_post(post: ExperiencePost) -> ExperiencePostItem:
    board = post.board
    author_name = post.author.username if post.author else post.author_name or "社区用户"
    return ExperiencePostItem(
        id=post.id,
        slug=post.slug,
        title=post.title,
        summary=post.summary,
        body=post.body,
        channel=post.channel,
        boardSlug=board.slug if board else "",
        boardTitle=board.title if board else "社区",
        scenario=post.scenario,
        tools=_strings(post.tools_json),
        roles=_strings(post.roles_json),
        coverImageUrl=post.cover_image_url,
        imageUrls=_strings(post.image_urls_json),
        author=ExperienceAuthor(id=post.author_id, username=author_name),
        status=post.status,
        viewCount=post.view_count,
        likeCount=post.like_count,
        favoriteCount=post.favorite_count,
        commentCount=post.comment_count,
        isOfficial=post.is_official,
        publishedAt=post.published_at,
        createdAt=post.created_at,
        updatedAt=post.updated_at,
    )


def serialize_comment(comment: ExperienceComment) -> ExperienceCommentItem:
    return ExperienceCommentItem(
        id=comment.id,
        postId=comment.post_id,
        parentId=comment.parent_id,
        body=comment.body,
        imageUrl=comment.image_url,
        status=comment.status,
        likeCount=comment.like_count,
        author=ExperienceAuthor(id=comment.user_id, username=comment.user.username if comment.user else "社区用户"),
        createdAt=comment.created_at,
        updatedAt=comment.updated_at,
    )


def list_experience_posts(
    db: Session,
    *,
    channel: str | None = None,
    board: str | None = None,
    page: int = 1,
    page_size: int = 20,
) -> ExperienceListResponse:
    ensure_default_experience_content(db)

    page = max(1, page)
    page_size = min(50, max(1, page_size))
    query = select(ExperiencePost).where(ExperiencePost.status == PUBLIC_STATUS)
    count_query = select(func.count()).select_from(ExperiencePost).where(ExperiencePost.status == PUBLIC_STATUS)

    if channel:
        query = query.where(ExperiencePost.channel == channel)
        count_query = count_query.where(ExperiencePost.channel == channel)
    if board:
        query = query.join(ExperienceBoard).where(ExperienceBoard.slug == board)
        count_query = count_query.join(ExperienceBoard).where(ExperienceBoard.slug == board)

    total = db.scalar(count_query) or 0
    posts = db.scalars(
        query.options(selectinload(ExperiencePost.board), selectinload(ExperiencePost.author))
        .order_by(ExperiencePost.published_at.is_(None), ExperiencePost.published_at.desc(), ExperiencePost.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    ).all()

    boards = db.scalars(select(ExperienceBoard).order_by(ExperienceBoard.sort_order, ExperienceBoard.id)).all()
    board_counts = dict(
        db.execute(
            select(ExperiencePost.board_id, func.count())
            .where(ExperiencePost.status == PUBLIC_STATUS)
            .group_by(ExperiencePost.board_id)
        ).all()
    )
    channels = db.scalars(
        select(ExperiencePost.channel)
        .where(ExperiencePost.status == PUBLIC_STATUS)
        .distinct()
        .order_by(ExperiencePost.channel)
    ).all()

    return ExperienceListResponse(
        items=[serialize_post(post) for post in posts],
        boards=[serialize_board(board_item, board_counts.get(board_item.id, 0)) for board_item in boards],
        channels=[item for item in DEFAULT_CHANNELS if item in channels] + [item for item in channels if item not in DEFAULT_CHANNELS],
        total=total,
        page=page,
        pageSize=page_size,
        hasMore=page * page_size < total,
    )


def get_experience_post(db: Session, *, slug: str) -> ExperiencePostItem:
    ensure_default_experience_content(db)
    post = db.scalar(
        select(ExperiencePost)
        .where(ExperiencePost.slug == slug, ExperiencePost.status == PUBLIC_STATUS)
        .options(selectinload(ExperiencePost.board), selectinload(ExperiencePost.author))
    )
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="经验帖不存在。")
    return serialize_post(post)


def list_experience_comments(db: Session, *, slug: str) -> list[ExperienceCommentItem]:
    ensure_default_experience_content(db)
    post = db.scalar(select(ExperiencePost).where(ExperiencePost.slug == slug, ExperiencePost.status == PUBLIC_STATUS))
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="经验帖不存在。")
    comments = db.scalars(
        select(ExperienceComment)
        .where(ExperienceComment.post_id == post.id, ExperienceComment.status == PUBLIC_STATUS)
        .options(selectinload(ExperienceComment.user))
        .order_by(ExperienceComment.created_at.asc(), ExperienceComment.id.asc())
    ).all()
    return [serialize_comment(comment) for comment in comments]


def create_experience_post(db: Session, *, user: User, payload: CreateExperiencePostRequest) -> ExperiencePostItem:
    ensure_default_experience_content(db)
    board = db.scalar(select(ExperienceBoard).where(ExperienceBoard.slug == payload.boardSlug))
    if not board:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="请选择有效的社区板块。")

    base_slug = _slugify(payload.title)
    slug = base_slug
    index = 2
    while db.scalar(select(ExperiencePost.id).where(ExperiencePost.slug == slug)):
        slug = f"{base_slug}-{index}"
        index += 1

    now = _now()
    post = ExperiencePost(
        slug=slug,
        title=payload.title,
        summary=payload.summary,
        body=payload.body,
        channel=payload.channel,
        board_id=board.id,
        scenario=payload.scenario,
        tools_json=payload.tools,
        roles_json=payload.roles,
        cover_image_url=_safe_url(payload.coverImageUrl),
        image_urls_json=_safe_url_list(payload.imageUrls),
        author_name=user.username,
        author_id=user.id,
        status=PUBLIC_STATUS,
        view_count=0,
        like_count=0,
        favorite_count=0,
        comment_count=0,
        is_official=False,
        published_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    post.board = board
    post.author = user
    return serialize_post(post)


def create_experience_comment(
    db: Session,
    *,
    slug: str,
    user: User,
    payload: CreateExperienceCommentRequest,
) -> ExperienceCommentItem:
    ensure_default_experience_content(db)
    post = db.scalar(select(ExperiencePost).where(ExperiencePost.slug == slug, ExperiencePost.status == PUBLIC_STATUS))
    if not post:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="经验帖不存在。")

    if payload.parentId is not None:
        parent = db.get(ExperienceComment, payload.parentId)
        if not parent or parent.post_id != post.id:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="回复的评论不存在。")

    now = _now()
    comment = ExperienceComment(
        post_id=post.id,
        user_id=user.id,
        parent_id=payload.parentId,
        body=payload.body,
        image_url=_safe_url(payload.imageUrl),
        status=PUBLIC_STATUS,
        like_count=0,
        created_at=now,
        updated_at=now,
    )
    post.comment_count += 1
    db.add(comment)
    db.commit()
    db.refresh(comment)
    comment.user = user
    return serialize_comment(comment)
