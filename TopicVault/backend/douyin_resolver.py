import os
import re
from typing import Any
from urllib.parse import parse_qs, urlparse

import requests

from openai_compatible_analyzer import load_env_files


TIKHUB_PLAY_URL_ENDPOINT = "https://api.tikhub.io/api/v1/douyin/web/fetch_video_high_quality_play_url"
TIKHUB_VIDEO_DETAIL_V2_ENDPOINT = "https://api.tikhub.io/api/v1/douyin/web/fetch_one_video_v2"
TIKHUB_MAX_ATTEMPTS = 3


class DouyinResolver:
    def __init__(self, api_key: str | None = None):
        load_env_files()
        self.api_key = api_key or os.getenv("TIKHUB_API_KEY", "").strip()

    def resolve(self, url: str) -> str:
        video_url = url.strip()
        if self._is_direct_media_url(video_url):
            return video_url

        if not self._looks_like_douyin_url(video_url):
            return video_url

        if not self.api_key:
            raise RuntimeError("未配置 TIKHUB_API_KEY，无法解析抖音链接")

        payload = self._fetch_tikhub_payload(video_url)
        resolved_url = self._find_video_url(payload)
        if not resolved_url:
            raise RuntimeError("TikHub 未返回可用的视频直链")
        return resolved_url

    def fetch_video_metadata(self, url: str) -> dict[str, str]:
        video_url = url.strip()
        if not self._looks_like_douyin_url(video_url):
            return {}

        if not self.api_key:
            raise RuntimeError("未配置 TIKHUB_API_KEY，无法获取抖音作品信息")

        aweme_id = self._extract_aweme_id(video_url)
        if not aweme_id:
            return {}

        payload = self._request_tikhub(
            TIKHUB_VIDEO_DETAIL_V2_ENDPOINT,
            params={"aweme_id": aweme_id},
        )
        detail = self._find_aweme_detail(payload)
        share_info = detail.get("share_info") if isinstance(detail.get("share_info"), dict) else {}
        description = self._pick_first_string(
            detail.get("desc"),
            detail.get("description"),
            payload.get("desc"),
        )

        return {
            "aweme_id": self._pick_first_string(detail.get("aweme_id"), aweme_id),
            "description": description,
            "author": self._extract_author_name(detail),
            "title": self._pick_first_string(
                share_info.get("share_title"),
                detail.get("title"),
                description,
            ),
        }

    def _fetch_tikhub_payload(self, url: str) -> dict[str, Any]:
        params: dict[str, str] = {"region": "CN"}
        aweme_id = self._extract_aweme_id(url)
        if aweme_id:
            params["aweme_id"] = aweme_id
        else:
            params["share_url"] = url

        return self._request_tikhub(TIKHUB_PLAY_URL_ENDPOINT, params=params)

    def _request_tikhub(self, endpoint: str, params: dict[str, str]) -> dict[str, Any]:
        last_error: requests.exceptions.RequestException | None = None
        for _ in range(TIKHUB_MAX_ATTEMPTS):
            try:
                response = requests.get(
                    endpoint,
                    params=params,
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    timeout=30,
                )
                return self._parse_tikhub_response(response)
            except requests.HTTPError as error:
                raise self._build_http_error(error) from error
            except requests.exceptions.RequestException as error:
                last_error = error

        raise RuntimeError(
            "TikHub 请求不稳定，已自动重试 3 次仍失败。请稍后再试，或换一个视频链接。"
        ) from last_error

    def _parse_tikhub_response(self, response: requests.Response) -> dict[str, Any]:
        response.raise_for_status()
        payload = response.json()
        code = payload.get("code")
        if code not in (None, 0, 200):
            message = payload.get("message") or payload.get("msg") or "TikHub 请求失败"
            raise RuntimeError(str(message))
        return payload

    def _build_http_error(self, error: requests.HTTPError) -> RuntimeError:
        status_code = getattr(error.response, "status_code", None)
        if status_code == 402:
            return RuntimeError(
                "TikHub account balance or package is not enough. 请先检查 TikHub 余额或套餐权限。"
            )
        if status_code in (401, 403):
            return RuntimeError("TikHub API Key 无效，或没有当前接口权限。")

        detail = self._extract_http_error_detail(error.response)
        if detail:
            return RuntimeError(f"TikHub 请求失败: HTTP {status_code} {detail}")
        return RuntimeError(f"TikHub 请求失败: {error}")

    def _extract_http_error_detail(self, response: requests.Response | None) -> str:
        if response is None:
            return ""

        try:
            payload = response.json()
        except ValueError:
            return response.text.strip()

        if isinstance(payload, dict):
            for key in ("message_zh", "message", "msg", "detail", "error"):
                value = payload.get(key)
                if isinstance(value, str) and value.strip():
                    return value.strip()

        return response.text.strip()

    def _extract_aweme_id(self, url: str) -> str | None:
        parsed = urlparse(url)
        match = re.search(r"/video/(\d+)", parsed.path)
        if match:
            return match.group(1)

        query = parse_qs(parsed.query)
        for key in ("modal_id", "aweme_id", "item_id"):
            values = query.get(key)
            if values and values[0].isdigit():
                return values[0]

        return None

    def _find_video_url(self, value: Any) -> str | None:
        if isinstance(value, dict):
            for key in ("original_video_url", "video_url", "play_url", "download_url", "url"):
                candidate = value.get(key)
                if isinstance(candidate, str) and self._is_probable_video_url(candidate):
                    return candidate

            for nested_value in value.values():
                found = self._find_video_url(nested_value)
                if found:
                    return found

        if isinstance(value, list):
            for item in value:
                found = self._find_video_url(item)
                if found:
                    return found

        return None

    def _find_aweme_detail(self, payload: dict[str, Any]) -> dict[str, Any]:
        data = payload.get("data")
        if isinstance(data, dict):
            aweme_detail = data.get("aweme_detail")
            if isinstance(aweme_detail, dict):
                return aweme_detail
            if "desc" in data or "author" in data:
                return data

        aweme_detail = payload.get("aweme_detail")
        if isinstance(aweme_detail, dict):
            return aweme_detail

        return {}

    def _extract_author_name(self, detail: dict[str, Any]) -> str:
        author = detail.get("author")
        if isinstance(author, dict):
            return self._pick_first_string(
                author.get("nickname"),
                author.get("unique_id"),
                author.get("short_id"),
            )
        return ""

    def _pick_first_string(self, *values: Any) -> str:
        for value in values:
            if isinstance(value, str) and value.strip():
                return value.strip()
        return ""

    def _looks_like_douyin_url(self, url: str) -> bool:
        host = urlparse(url).netloc.lower()
        return "douyin.com" in host or "iesdouyin.com" in host or "snssdk.com" in host

    def _is_direct_media_url(self, url: str) -> bool:
        parsed = urlparse(url)
        path = parsed.path.lower()
        if path.endswith((".mp4", ".mp3", ".m4a", ".wav", ".webm", ".mov", ".aac")):
            return True
        return "aweme/v1/play" in path

    def _is_probable_video_url(self, url: str) -> bool:
        if not url.startswith(("http://", "https://")):
            return False
        lowered = url.lower()
        return any(token in lowered for token in (".mp4", ".m4a", ".mp3", "aweme/v1/play", "video"))
