"""Weekly SQLite backup to ~/Library/Application Support/ride-analytics/.
That directory is covered by macOS FileVault if enabled (recommended).
Skips if a backup already exists for today.
"""

import sqlite3
from datetime import datetime
from pathlib import Path

from config import DB_PATH

BACKUP_DIR = Path.home() / "Library" / "Application Support" / "ride-analytics"


def backup():
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)
    dest = BACKUP_DIR / f"ride_{datetime.now().strftime('%Y%m%d')}.db"
    if dest.exists():
        return
    src = sqlite3.connect(DB_PATH)
    dst = sqlite3.connect(dest)
    src.backup(dst)
    src.close()
    dst.close()
    print(f"Backup saved: {dest}")
