import json
import sqlite3
from pathlib import Path

import pytest

SCHEMA = Path(__file__).parent.parent / "schema.sql"
FIXTURES = Path(__file__).parent / "fixtures"


@pytest.fixture
def db():
    """In-memory SQLite DB with the full schema applied."""
    conn = sqlite3.connect(":memory:")
    conn.executescript(SCHEMA.read_text())
    yield conn
    conn.close()


def load(name):
    return json.loads((FIXTURES / name).read_text())


class MockSource:
    """Returns pre-loaded fixture dicts for given API paths."""

    def __init__(self, routes: dict):
        self._routes = routes  # path -> list of responses (consumed in order)
        self._calls: dict = {}

    def get(self, path, params=None):
        key = path
        idx = self._calls.get(key, 0)
        self._calls[key] = idx + 1
        responses = self._routes[key]
        return responses[idx] if idx < len(responses) else responses[-1]

    def close(self):
        pass
