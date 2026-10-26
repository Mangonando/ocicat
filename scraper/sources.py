"""Where JSON comes from: the live site (Playwright session) or a HAR fixture."""

import json
import time
from urllib.parse import urlencode, urlsplit

from config import BASE, DASHBOARD_URL, PROFILE_DIR


class AuthError(RuntimeError):
    pass


class LiveSource:
    """Calls the Momence JSON API with the cookies of a persistent browser profile."""

    def __init__(self, headless=True):
        from playwright.sync_api import sync_playwright

        self._pw = sync_playwright().start()
        self.ctx = self._pw.chromium.launch_persistent_context(str(PROFILE_DIR), headless=headless)
        self.page = self.ctx.pages[0] if self.ctx.pages else self.ctx.new_page()

    def get(self, path, params=None):
        url = BASE + path
        if params:
            flat = [(k, v) for k, vs in params.items() for v in (vs if isinstance(vs, list) else [vs])]
            url += "?" + urlencode(flat)
        for attempt in range(2):
            try:
                r = self.ctx.request.get(
                    url, timeout=60_000, headers={"Accept": "application/json", "x-origin": DASHBOARD_URL}
                )
                break
            except Exception as e:
                if attempt == 0:
                    time.sleep(5)
                    continue
                raise RuntimeError(f"Request failed for {path}: {type(e).__name__}") from None
        if r.status in (401, 403):
            raise AuthError(f"HTTP {r.status}: login expired, run `python login.py`")
        if not r.ok:
            raise RuntimeError(f"HTTP {r.status} for {path}: {r.text()}")
        return r.json()

    def close(self):
        self.ctx.close()
        self._pw.stop()


class HarSource:
    """Replays responses recorded in HAR files (for tests / offline dev)."""

    def __init__(self, *har_paths):
        self.by_path = {}
        for p in har_paths:
            for e in json.load(open(p))["log"]["entries"]:
                text = e["response"]["content"].get("text")
                if text and "/_api/" in e["request"]["url"]:
                    u = urlsplit(e["request"]["url"])
                    q = e["request"]["url"].split("?", 1)[1] if "?" in e["request"]["url"] else ""
                    self.by_path.setdefault(u.path[len("/_api") :], []).append((q, text))

    def get(self, path, params=None):
        hits = self.by_path.get(path)
        if not hits:
            raise KeyError(path)
        params = params or {}
        want = [f"{k}={v}" for k, v in params.items() if k in ("page", "onlyCancelled", "onlyNoShow")]
        flags = ("onlyCancelled", "onlyNoShow")
        best = max(
            hits,
            key=lambda h: (
                sum(w in h[0] for w in want)
                - 10 * sum(f in h[0] and not any(w.startswith(f) for w in want) for f in flags)
            ),
        )
        return json.loads(best[1])

    def close(self):
        pass
