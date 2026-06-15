import json
from types import SimpleNamespace

import ali_analyzer
from ali_analyzer import AliScriptAnalyzer


def test_analyzer_calls_qwen_and_returns_material_payload(monkeypatch):
    calls = {}

    model_payload = {
        "title": "三步用 ChatGPT 搭工作流",
        "author": "AI效率课",
        "description": "把单次提问变成稳定流程",
        "classification": {
            "toolCategory": ["ChatGPT"],
            "topicCategory": ["AI工作流", "AI职场"],
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
                {
                    "step": 1,
                    "name": "反常识开头",
                    "function": "制造认知差",
                    "text": "别再问 ChatGPT 单个问题了。",
                }
            ],
            "emotionalCurve": ["好奇", "被说中", "想收藏"],
            "replicableMethods": ["先定义角色，再拆任务，最后约束输出格式"],
            "rewriteAnglesForMyAccount": ["参考它的三步结构做选题记录"],
        },
        "tags": ["ChatGPT", "AI工作流", "教程型", "参考价值高"],
    }

    class FakeGeneration:
        @staticmethod
        def call(**kwargs):
            calls["kwargs"] = kwargs
            return SimpleNamespace(
                status_code=200,
                output={
                    "choices": [
                        {
                            "message": {
                                "content": json.dumps(model_payload, ensure_ascii=False),
                            }
                        }
                    ]
                },
            )

    monkeypatch.setattr(ali_analyzer, "Generation", FakeGeneration)

    material = AliScriptAnalyzer(api_key="ali-key").analyze(
        url="https://www.douyin.com/video/123",
        transcript="这是完整文案",
        remark="ChatGPT / AI工作流",
    )

    assert material["source"]["url"] == "https://www.douyin.com/video/123"
    assert material["source"]["title"] == "三步用 ChatGPT 搭工作流"
    assert material["source"]["author"] == "AI效率课"
    assert material["rawContent"]["transcript"] == "这是完整文案"
    assert material["classification"]["toolCategory"] == ["ChatGPT"]
    assert material["analysis"]["structure"][0]["step"] == 1
    assert material["tags"] == ["ChatGPT", "AI工作流", "教程型"]
    assert calls["kwargs"]["api_key"] == "ali-key"
    assert calls["kwargs"]["model"] == "qwen-plus"
    assert calls["kwargs"]["result_format"] == "message"


def test_analyzer_rejects_invalid_model_json(monkeypatch):
    class FakeGeneration:
        @staticmethod
        def call(**kwargs):
            return SimpleNamespace(
                status_code=200,
                output={"choices": [{"message": {"content": "不是 JSON"}}]},
            )

    monkeypatch.setattr(ali_analyzer, "Generation", FakeGeneration)

    with pytest_raises_runtime("JSON"):
        AliScriptAnalyzer(api_key="ali-key").analyze(
            url="https://example.com/video",
            transcript="文案",
            remark="",
        )


class pytest_raises_runtime:
    def __init__(self, expected: str):
        self.expected = expected

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_value, traceback):
        assert exc_type is RuntimeError
        assert self.expected in str(exc_value)
        return True
