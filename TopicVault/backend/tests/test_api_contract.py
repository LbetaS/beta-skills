import time

from fastapi.testclient import TestClient

from app import analyzer, app, resolver, transcriber


def test_process_video_resolves_then_transcribes(monkeypatch):
    calls = {}

    def fake_resolve(url: str) -> str:
        calls["resolve"] = url
        return "https://cdn.example.com/video.mp4"

    def fake_transcribe(url: str, **kwargs) -> str:
        calls["transcribe"] = url
        if kwargs.get("on_progress"):
            kwargs["on_progress"](55, "Ali task polling")
        return "transcript from short video"

    def fake_fetch_video_metadata(url: str) -> dict[str, str]:
        calls["metadata"] = url
        return {
            "aweme_id": "7617120761456156773",
            "description": "GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt",
            "author": "北乔",
            "title": "大模型办公流曝光",
        }

    monkeypatch.setattr(resolver, "resolve", fake_resolve)
    monkeypatch.setattr(resolver, "fetch_video_metadata", fake_fetch_video_metadata)
    monkeypatch.setattr(transcriber, "transcribe", fake_transcribe)
    client = TestClient(app)

    response = client.post(
        "/api/process-video",
        data={"url": "https://www.douyin.com/video/7617120761456156773", "summary_language": "zh"},
    )

    assert response.status_code == 200
    task_id = response.json()["task_id"]
    deadline = time.time() + 3
    status = None

    while time.time() < deadline:
        status = client.get(f"/api/task-status/{task_id}").json()
        if status["status"] == "completed":
            break
        time.sleep(0.05)

    assert status["status"] == "completed"
    assert status["script"] == "transcript from short video"
    assert "transcript from short video" in status["summary"]
    assert status["video_metadata"]["description"] == "GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt"
    assert calls["resolve"] == "https://www.douyin.com/video/7617120761456156773"
    assert calls["metadata"] == "https://www.douyin.com/video/7617120761456156773"
    assert calls["transcribe"] == "https://cdn.example.com/video.mp4"


def test_process_video_rejects_empty_url():
    client = TestClient(app)

    response = client.post("/api/process-video", data={"url": ""})

    assert response.status_code == 400


def test_analyze_script_returns_material(monkeypatch):
    calls = {}

    def fake_analyze(**kwargs):
        calls["analyze"] = kwargs
        return {
            "id": "mat-test",
            "source": {
                "platform": "douyin",
                "url": kwargs["url"],
                "author": "AI效率课",
                "title": "真实模型分析标题",
            },
            "rawContent": {
                "description": "模型生成描述",
                "transcript": kwargs["transcript"],
            },
            "classification": {
                "toolCategory": ["ChatGPT"],
                "topicCategory": ["AI工作流"],
                "contentFormat": "教程型",
                "hookType": "反常识开头",
                "referenceValue": "高",
            },
            "analysis": {
                "oneSentenceSummary": "一句话总结",
                "coreArgument": "核心观点",
                "targetAudience": "AI内容博主",
                "painPoint": "缺少稳定拆解流程",
                "hook": "开头钩子",
                "structure": [
                    {"step": 1, "name": "开头", "function": "吸引注意", "text": "原文片段"}
                ],
                "emotionalCurve": ["好奇", "想收藏"],
                "replicableMethods": ["复用方法"],
                "rewriteAnglesForMyAccount": ["拍摄参考点"],
            },
            "tags": ["ChatGPT", "AI工作流"],
            "createdAt": "2026/05/09 12:00",
        }

    monkeypatch.setattr(analyzer, "analyze", fake_analyze)
    client = TestClient(app)

    response = client.post(
        "/api/analyze-script",
        json={
            "url": "https://www.douyin.com/video/123",
            "transcript": "完整文案",
            "remark": "ChatGPT / AI工作流",
        },
    )

    assert response.status_code == 200
    assert response.json()["material"]["source"]["title"] == "真实模型分析标题"
    assert response.json()["material"]["rawContent"]["transcript"] == "完整文案"
    assert calls["analyze"]["remark"] == "ChatGPT / AI工作流"


def test_analyze_script_rejects_empty_transcript():
    client = TestClient(app)

    response = client.post(
        "/api/analyze-script",
        json={"url": "https://example.com", "transcript": " ", "remark": ""},
    )

    assert response.status_code == 400


def test_analyze_script_passes_custom_system_prompt(monkeypatch):
    calls = {}

    def fake_analyze(**kwargs):
        calls["analyze"] = kwargs
        return {
            "id": "mat-test",
            "source": {"platform": "douyin", "url": kwargs["url"], "author": "author", "title": "title"},
            "rawContent": {"description": "", "transcript": kwargs["transcript"]},
            "classification": {
                "toolCategory": ["Claude"],
                "topicCategory": ["AI提示词"],
                "contentFormat": "拆解型",
                "hookType": "结果开头",
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
                "rewriteAnglesForMyAccount": ["angle"],
            },
            "tags": ["Claude"],
            "createdAt": "2026/05/09 12:00",
        }

    monkeypatch.setattr(analyzer, "analyze", fake_analyze)
    client = TestClient(app)

    response = client.post(
        "/api/analyze-script",
        json={
            "url": "https://www.douyin.com/video/123",
            "transcript": "full transcript",
            "customSystemPrompt": "请按 AIDA 框架拆解。",
        },
    )

    assert response.status_code == 200
    assert calls["analyze"]["custom_system_prompt"] == "请按 AIDA 框架拆解。"
