import json

import requests

import openai_compatible_analyzer
from openai_compatible_analyzer import OpenAICompatibleScriptAnalyzer


def test_openai_compatible_analyzer_posts_chat_completion_and_returns_material(monkeypatch):
    calls = {}
    model_payload = {
        "title": "三步用 ChatGPT 搭工作流",
        "author": "AI效率课",
        "description": "把单次提问变成稳定流程",
        "classification": {
            "toolCategory": ["ChatGPT"],
            "topicCategory": ["AI工作流"],
            "contentFormat": "教程型",
            "hookType": "反常识开头",
            "referenceValue": "高",
        },
        "analysis": {
            "oneSentenceSummary": "用三步法让 ChatGPT 从回答问题变成输出方案。",
            "coreArgument": "好结果来自清晰角色、任务拆解和交付格式。",
            "targetAudience": "AI内容博主",
            "painPoint": "只会用一句话提问，输出不可控",
            "hook": "别再问 ChatGPT 单个问题了。",
            "structure": [
                {"step": 1, "name": "反常识开头", "function": "制造认知差", "text": "别再问 ChatGPT 单个问题了。"}
            ],
            "emotionalCurve": ["好奇", "被说中", "想收藏"],
            "replicableMethods": ["先定义角色，再拆任务，最后约束输出格式"],
            "rewriteAnglesForMyAccount": ["参考它的三步结构做选题记录"],
        },
        "tags": ["ChatGPT", "AI工作流", "教程型"],
    }

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        def json(self):
            return {
                "choices": [
                    {
                        "message": {
                            "content": json.dumps(model_payload, ensure_ascii=False),
                        }
                    }
                ]
            }

    def fake_post(url, **kwargs):
        calls["url"] = url
        calls["kwargs"] = kwargs
        return FakeResponse()

    monkeypatch.setattr("openai_compatible_analyzer.requests.post", fake_post)

    material = OpenAICompatibleScriptAnalyzer(
        api_key="relay-key",
        base_url="https://relay.example.com/v1",
        model="gpt-test",
    ).analyze(
        url="https://www.douyin.com/video/123",
        transcript="这是完整文案",
        remark="ChatGPT / AI工作流",
    )

    assert calls["url"] == "https://relay.example.com/v1/chat/completions"
    assert calls["kwargs"]["headers"]["Authorization"] == "Bearer relay-key"
    assert calls["kwargs"]["json"]["model"] == "gpt-test"
    assert calls["kwargs"]["json"]["messages"][0]["role"] == "system"
    assert material["source"]["title"] == "三步用 ChatGPT 搭工作流"
    assert material["source"]["author"] == "AI效率课"
    assert material["rawContent"]["transcript"] == "这是完整文案"
    assert material["classification"]["toolCategory"] == ["ChatGPT"]


def test_openai_compatible_analyzer_requires_base_url():
    try:
        OpenAICompatibleScriptAnalyzer(api_key="relay-key", base_url="").analyze(
            url="https://example.com/video",
            transcript="文案",
        )
    except RuntimeError as error:
        assert "LLM_BASE_URL" in str(error)
    else:
        raise AssertionError("expected RuntimeError")


def test_openai_compatible_analyzer_includes_custom_prompt_in_system_message(monkeypatch):
    calls = {}
    model_payload = {
        "title": "自定义提示词分析标题",
        "author": "作者",
        "description": "摘要",
        "classification": {
            "toolCategory": ["Claude"],
            "topicCategory": ["AI提示词"],
            "contentFormat": "拆解型",
            "hookType": "结果开头",
            "referenceValue": "高",
        },
        "analysis": {
            "oneSentenceSummary": "一句话总结",
            "coreArgument": "核心观点",
            "targetAudience": "AI内容创作者",
            "painPoint": "缺少可复用拆解框架",
            "hook": "开头钩子",
            "structure": [{"step": 1, "name": "开头", "function": "吸引注意", "text": "原文片段"}],
            "emotionalCurve": ["好奇"],
            "replicableMethods": ["方法"],
            "rewriteAnglesForMyAccount": ["拍摄参考点"],
        },
        "tags": ["Claude"],
    }

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        def json(self):
            return {"choices": [{"message": {"content": json.dumps(model_payload, ensure_ascii=False)}}]}

    def fake_post(url, **kwargs):
        calls["kwargs"] = kwargs
        return FakeResponse()

    monkeypatch.setattr("openai_compatible_analyzer.requests.post", fake_post)

    OpenAICompatibleScriptAnalyzer(
        api_key="relay-key",
        base_url="https://relay.example.com/v1",
        model="gpt-test",
    ).analyze(
        url="https://www.douyin.com/video/123",
        transcript="完整文案",
        custom_system_prompt="必须使用 AIDA 框架拆解。",
    )

    system_message = calls["kwargs"]["json"]["messages"][0]
    assert system_message["role"] == "system"
    assert "必须使用 AIDA 框架拆解。" in system_message["content"]


def test_openai_compatible_analyzer_loads_backend_env_file(monkeypatch, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "LLM_API_KEY=env-key\nLLM_BASE_URL=https://relay.example.com/v1\nLLM_MODEL=env-model\n",
        encoding="utf-8",
    )

    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.delenv("LLM_MODEL", raising=False)
    monkeypatch.setattr(openai_compatible_analyzer, "ENV_FILE_CANDIDATES", [env_file])

    analyzer = OpenAICompatibleScriptAnalyzer()

    assert analyzer.api_key == "env-key"
    assert analyzer.base_url == "https://relay.example.com/v1"
    assert analyzer.model == "env-model"


def test_openai_compatible_analyzer_handles_utf8_bom_env_file(monkeypatch, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text(
        "\ufeffLLM_API_KEY=env-key\nLLM_BASE_URL=https://relay.example.com/v1\n",
        encoding="utf-8",
    )

    monkeypatch.delenv("LLM_API_KEY", raising=False)
    monkeypatch.delenv("LLM_BASE_URL", raising=False)
    monkeypatch.setattr(openai_compatible_analyzer, "ENV_FILE_CANDIDATES", [env_file])

    analyzer = OpenAICompatibleScriptAnalyzer()

    assert analyzer.api_key == "env-key"


def test_openai_compatible_analyzer_preserves_custom_sections(monkeypatch):
    model_payload = {
        "title": "custom section title",
        "author": "creator",
        "description": "description",
        "classification": {
            "toolCategory": ["Claude"],
            "topicCategory": ["AI workflow"],
            "contentFormat": "tutorial",
            "hookType": "result hook",
            "referenceValue": "高",
        },
        "analysis": {
            "oneSentenceSummary": "summary",
            "coreArgument": "argument",
            "targetAudience": "audience",
            "painPoint": "pain",
            "hook": "hook",
            "structure": [{"step": 1, "name": "step", "function": "fn", "text": "text"}],
            "emotionalCurve": ["curious"],
            "replicableMethods": ["method"],
            "rewriteAnglesForMyAccount": ["reference"],
            "customSections": [
                {"title": "AIDA 拆解", "content": "注意力来自反常识开头，兴趣来自三步流程。"},
                {"title": "收藏线索", "content": "后续可按 Claude 工作流检索。"},
            ],
        },
        "tags": ["Claude"],
    }

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        def json(self):
            return {"choices": [{"message": {"content": json.dumps(model_payload, ensure_ascii=False)}}]}

    monkeypatch.setattr("openai_compatible_analyzer.requests.post", lambda *args, **kwargs: FakeResponse())

    material = OpenAICompatibleScriptAnalyzer(
        api_key="relay-key",
        base_url="https://relay.example.com/v1",
        model="gpt-test",
    ).analyze(
        url="https://www.douyin.com/video/123",
        transcript="完整文案",
    )

    assert material["analysis"]["customSections"] == [
        {"title": "AIDA 拆解", "content": "注意力来自反常识开头，兴趣来自三步流程。"},
        {"title": "收藏线索", "content": "后续可按 Claude 工作流检索。"},
    ]


def test_openai_compatible_analyzer_retries_transient_ssl_errors(monkeypatch):
    calls = []
    model_payload = {
        "title": "重试成功",
        "author": "作者",
        "description": "描述",
        "classification": {
            "toolCategory": ["ChatGPT"],
            "topicCategory": ["AI工作流"],
            "contentFormat": "教程型",
            "hookType": "开头钩子",
            "referenceValue": "高",
        },
        "analysis": {
            "oneSentenceSummary": "摘要",
            "coreArgument": "观点",
            "targetAudience": "受众",
            "painPoint": "痛点",
            "hook": "钩子",
            "structure": [{"step": 1, "name": "步骤", "function": "作用", "text": "文本"}],
            "emotionalCurve": ["好奇"],
            "replicableMethods": ["方法"],
            "rewriteAnglesForMyAccount": ["参考点"],
        },
        "tags": ["ChatGPT"],
    }

    class FakeResponse:
        ok = True
        status_code = 200
        text = ""

        def json(self):
            return {"choices": [{"message": {"content": json.dumps(model_payload, ensure_ascii=False)}}]}

    def fake_post(url, **kwargs):
        calls.append(url)
        if len(calls) < 3:
            raise requests.exceptions.SSLError("unexpected eof while reading")
        return FakeResponse()

    monkeypatch.setattr("openai_compatible_analyzer.requests.post", fake_post)
    monkeypatch.setattr("openai_compatible_analyzer.time.sleep", lambda seconds: None)

    material = OpenAICompatibleScriptAnalyzer(
        api_key="relay-key",
        base_url="https://nowcoding.ai/v1",
        model="claude-opus-test",
    ).analyze(url="https://example.com/video", transcript="文案")

    assert len(calls) == 3
    assert material["source"]["title"] == "重试成功"


def test_openai_compatible_analyzer_reports_repeated_network_failures(monkeypatch):
    def fake_post(url, **kwargs):
        raise requests.exceptions.SSLError("unexpected eof while reading")

    monkeypatch.setattr("openai_compatible_analyzer.requests.post", fake_post)
    monkeypatch.setattr("openai_compatible_analyzer.time.sleep", lambda seconds: None)

    try:
        OpenAICompatibleScriptAnalyzer(
            api_key="relay-key",
            base_url="https://nowcoding.ai/v1",
            model="claude-opus-test",
        ).analyze(url="https://example.com/video", transcript="文案")
    except RuntimeError as error:
        assert "中转大模型网络连接不稳定" in str(error)
        assert "已自动重试 3 次仍失败" in str(error)
        assert "unexpected eof while reading" in str(error)
    else:
        raise AssertionError("expected RuntimeError")
