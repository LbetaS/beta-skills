import pytest
import requests

import openai_compatible_analyzer
import douyin_resolver
from douyin_resolver import DouyinResolver


def test_direct_media_url_is_returned_without_tikhub(monkeypatch):
    monkeypatch.delenv("TIKHUB_API_KEY", raising=False)

    url = "https://example.com/video.mp4"

    assert DouyinResolver().resolve(url) == url


def test_aweme_play_url_is_returned_without_tikhub(monkeypatch):
    monkeypatch.delenv("TIKHUB_API_KEY", raising=False)

    url = "https://aweme.snssdk.com/aweme/v1/play/?video_id=test"

    assert DouyinResolver().resolve(url) == url


def test_douyin_page_url_uses_high_quality_play_url(monkeypatch):
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"code": 200, "data": {"video_url": "https://cdn.example.com/high-quality.mp4"}}

    def fake_get(url, params, headers, timeout):
        calls.append({"url": url, "params": params, "headers": headers, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    resolved = DouyinResolver().resolve("https://www.douyin.com/video/7617120761456156773")

    assert resolved == "https://cdn.example.com/high-quality.mp4"
    assert calls[0]["url"] == douyin_resolver.TIKHUB_PLAY_URL_ENDPOINT
    assert calls[0]["params"]["aweme_id"] == "7617120761456156773"
    assert calls[0]["headers"]["Authorization"] == "Bearer token-123"


def test_douyin_page_url_fetches_video_metadata_with_single_video_v2(monkeypatch):
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {
                "code": 200,
                "data": {
                    "aweme_detail": {
                        "aweme_id": "7617120761456156773",
                        "desc": "GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt",
                        "author": {"nickname": "北乔"},
                        "share_info": {"share_title": "大模型办公流曝光"},
                    }
                },
            }

    def fake_get(url, params, headers, timeout):
        calls.append({"url": url, "params": params, "headers": headers, "timeout": timeout})
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    metadata = DouyinResolver().fetch_video_metadata("https://www.douyin.com/video/7617120761456156773")

    assert metadata == {
        "aweme_id": "7617120761456156773",
        "description": "GPT Image 2直接生成可编辑PPT，1分钟学会 #ai工具 #ppt",
        "author": "北乔",
        "title": "大模型办公流曝光",
    }
    assert calls[0]["url"] == douyin_resolver.TIKHUB_VIDEO_DETAIL_V2_ENDPOINT
    assert calls[0]["params"]["aweme_id"] == "7617120761456156773"
    assert calls[0]["headers"]["Authorization"] == "Bearer token-123"


def test_douyin_page_url_uses_share_url_when_no_aweme_id(monkeypatch):
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"code": 200, "data": {"video_url": "https://cdn.example.com/share.mp4"}}

    def fake_get(url, params, headers, timeout):
        calls.append({"url": url, "params": params})
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    resolved = DouyinResolver().resolve("https://v.douyin.com/example/")

    assert resolved == "https://cdn.example.com/share.mp4"
    assert calls[0]["url"] == douyin_resolver.TIKHUB_PLAY_URL_ENDPOINT
    assert calls[0]["params"]["share_url"] == "https://v.douyin.com/example/"


def test_douyin_modal_url_uses_modal_id(monkeypatch):
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"data": {"video_url": "https://cdn.example.com/modal.mp4"}}

    def fake_get(url, params, headers, timeout):
        calls.append({"params": params})
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    resolved = DouyinResolver().resolve(
        "https://www.douyin.com/jingxuan?modal_id=7617285459802180879"
    )

    assert resolved == "https://cdn.example.com/modal.mp4"
    assert calls[0]["params"]["aweme_id"] == "7617285459802180879"


def test_douyin_url_requires_tikhub_key(monkeypatch):
    monkeypatch.delenv("TIKHUB_API_KEY", raising=False)
    monkeypatch.setattr(openai_compatible_analyzer, "ENV_FILE_CANDIDATES", [])

    with pytest.raises(RuntimeError, match="TIKHUB_API_KEY"):
        DouyinResolver().resolve("https://www.douyin.com/video/7617120761456156773")


def test_douyin_resolver_loads_tikhub_key_from_env_file(monkeypatch, tmp_path):
    env_file = tmp_path / ".env"
    env_file.write_text("TIKHUB_API_KEY=token-from-env-file\n", encoding="utf-8")

    monkeypatch.delenv("TIKHUB_API_KEY", raising=False)
    monkeypatch.setattr(openai_compatible_analyzer, "ENV_FILE_CANDIDATES", [env_file])

    resolver = DouyinResolver()

    assert resolver.api_key == "token-from-env-file"


def test_tikhub_payment_required_has_clear_message(monkeypatch):
    class FakeResponse:
        status_code = 402

        def raise_for_status(self):
            raise requests.HTTPError("402 Client Error: Payment Required", response=self)

        def json(self):
            return {}

    def fake_get(url, params, headers, timeout):
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    with pytest.raises(RuntimeError, match="TikHub account balance"):
        DouyinResolver().resolve("https://www.douyin.com/video/7617120761456156773")


def test_tikhub_bad_request_includes_response_message(monkeypatch):
    class FakeResponse:
        status_code = 400
        text = '{"message":"aweme_id is invalid"}'

        def raise_for_status(self):
            raise requests.HTTPError("400 Client Error: Bad Request", response=self)

        def json(self):
            return {"message": "aweme_id is invalid"}

    def fake_get(url, params, headers, timeout):
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    with pytest.raises(RuntimeError, match="HTTP 400 aweme_id is invalid"):
        DouyinResolver().resolve("https://www.douyin.com/video/7617120761456156773")


def test_tikhub_transient_ssl_error_is_retried(monkeypatch):
    calls = []

    class FakeResponse:
        def raise_for_status(self):
            return None

        def json(self):
            return {"code": 200, "data": {"video_url": "https://cdn.example.com/retry.mp4"}}

    def fake_get(url, params, headers, timeout):
        calls.append({"url": url, "params": params})
        if len(calls) == 1:
            raise requests.exceptions.SSLError("unexpected eof while reading")
        return FakeResponse()

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    resolved = DouyinResolver().resolve("https://www.douyin.com/video/7617120761456156773")

    assert resolved == "https://cdn.example.com/retry.mp4"
    assert len(calls) == 2


def test_tikhub_repeated_timeout_has_chinese_message(monkeypatch):
    def fake_get(url, params, headers, timeout):
        raise requests.exceptions.ReadTimeout("read timeout")

    monkeypatch.setenv("TIKHUB_API_KEY", "token-123")
    monkeypatch.setattr(douyin_resolver.requests, "get", fake_get)

    with pytest.raises(RuntimeError, match="TikHub 请求不稳定"):
        DouyinResolver().resolve("https://www.douyin.com/video/7617120761456156773")
