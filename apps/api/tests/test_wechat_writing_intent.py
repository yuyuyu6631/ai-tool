# -*- coding: utf-8 -*-
"""
微信公众号与自媒体写作场景 (wechat-writing) 的专属单元测试
"""

import pytest
from app.schemas.ai_search import AiSearchResult
from app.schemas.tool import AccessFlags
from app.services import ai_search_service
from app.services.ai_search_service import (
    _build_agent_recommendation,
    _build_reason,
    parse_ai_search_intent,
)


def _result(slug: str, name: str, *, reason: str | None = None) -> AiSearchResult:
    """生成测试用工具数据实例"""
    return AiSearchResult(
        id=1,
        slug=slug,
        name=name,
        category="AI 写作",
        categorySlug="writing",
        score=9.2,
        summary="适合微信公众号和自媒体内容创作与排版润色。",
        tags=["写作", "公众号"],
        officialUrl=f"https://example.com/{slug}",
        logoPath=None,
        logoStatus="missing",
        logoSource="seed",
        status="published",
        featured=True,
        createdAt="2026-05-01",
        price="",
        reviewCount=10,
        accessFlags=AccessFlags(needsVpn=False, cnLang=True, cnPayment=True),
        pricingType="freemium",
        freeAllowanceText="基础版免费试用",
        features=["公众号排版", "文案扩写润色"],
        limitations=["每日生成字数受限"],
        dealSummary="注册即可试用",
        primaryMedia=None,
        reason=reason,
    )


def test_wechat_writing_intent_fallback_parsing():
    """验证当 LLM 处于 Stub/Fallback 模式下，本地规则能够准确解析公众号写作意图"""
    payload, source, cache_hit = parse_ai_search_intent("我要写公众号文章", "写公众号 公众号 写作 润色")
    
    assert payload["task"] == "wechat-writing"
    assert payload["intent_summary"] == "用户希望按“wechat-writing”任务快速筛选工具"
    assert source == "fallback"


def test_wechat_writing_recommendation_label_and_reason():
    """验证 wechat-writing 场景下的中文标签解析与个性化推荐理由生成"""
    tool = _result("wps-ai", "WPS AI")
    results = [tool]
    
    # 模拟推荐工作流，应用 wechat-writing 任务类型，并使用空约束来测试专属推荐理由
    agent_recommendation = _build_agent_recommendation(
        query="我要写微信公众号文章",
        normalized_query="写公众号 公众号 写作 润色",
        intent_payload={
            "intent_summary": "公众号写作推荐",
            "task": "wechat-writing",
            "constraints": {},
        },
        constraints={},
        task="wechat-writing",
        results=results,
        ranked_items=results,
    )
    
    # 1. 验证任务场景的中文标签转换是否正确补齐
    assert agent_recommendation.intent.task == "微信公众号与自媒体写作"
    
    # 2. 验证是否生成了专属 wechat-writing 的推荐说明语
    assert agent_recommendation.toolPlan[0].fit_reason == "适合微信公众号和自媒体写作，覆盖文案生成、润色和排版场景"

