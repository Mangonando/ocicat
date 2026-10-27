"""Apply pending SQL migrations and keep PRAGMA user_version in sync."""

from pathlib import Path

from config import TEACHER_ID

MIGRATIONS_DIR = Path(__file__).parent / "migrations"


def run(db):
    current = db.execute("PRAGMA user_version").fetchone()[0]
    files = sorted(MIGRATIONS_DIR.glob("[0-9][0-9][0-9]_*.sql"))
    for path in files:
        version = int(path.name[:3])
        if version <= current:
            continue
        print(f"  applying migration {path.name}")
        db.executescript(path.read_text())
        db.execute(f"PRAGMA user_version = {version}")
        db.commit()
        _post_migrate(db, version)


def _post_migrate(db, version):
    """Python-side steps that can't live in SQL alone."""
    if version == 1:
        with db:
            db.execute("UPDATE classes SET is_mine = (teacher_id = ?)", (TEACHER_ID,))
