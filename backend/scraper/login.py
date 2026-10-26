"""Auto-login using credentials from .env. Run once (and whenever the session expires)."""

import os
from pathlib import Path

from config import LOGIN_URL, PROFILE_DIR
from dotenv import load_dotenv
from playwright.sync_api import sync_playwright

load_dotenv(Path(__file__).resolve().parent.parent.parent / ".env")

EMAIL = os.environ["MOMENCE_EMAIL"]
PASSWORD = os.environ["MOMENCE_PASSWORD"]


def login():
    with sync_playwright() as pw:
        ctx = pw.chromium.launch_persistent_context(str(PROFILE_DIR), headless=True)
        page = ctx.pages[0] if ctx.pages else ctx.new_page()

        page.goto(LOGIN_URL)
        page.wait_for_load_state("networkidle")

        if "/dashboard/" in page.url:
            print("Already logged in — session still valid.")
        else:
            page.fill("#email", EMAIL)
            page.fill("#password", PASSWORD)
            page.click('button[type="submit"]')
            page.wait_for_url("**/dashboard/**", timeout=15_000)
            print("Login successful — session saved.")

        ctx.close()


if __name__ == "__main__":
    login()
