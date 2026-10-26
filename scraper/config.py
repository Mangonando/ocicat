from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DB_PATH = ROOT / "data" / "ride.db"
PROFILE_DIR = ROOT / "data" / "browser-profile"  # holds your login, never commit
HOST_ID = 232291  # ride.bln
TEACHER_ID = 372616  # Juan's Momence teacher id
TZ = "Europe/Berlin"
BASE = "https://momence.com/_api"
DEFAULT_LOOKBACK_DAYS = 10
DASHBOARD_URL = f"https://momence.com/dashboard/{HOST_ID}/sessions?page=1&past=true"
LOGIN_URL = "https://momence.com/sign-in"  # "Welcome back!" page — confirm this
