import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv

REPO_ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = REPO_ROOT / "backend"


def _load_env() -> None:
    load_dotenv(REPO_ROOT / ".env", override=False)
    load_dotenv(BACKEND_DIR / ".env", override=False)

    if "DB_PASSWORD" not in os.environ:
        os.environ["DB_PASSWORD"] = os.environ.get("DB_PASS", "postgres")

    os.environ.setdefault("DB_HOST", "localhost")
    os.environ.setdefault("DB_PORT", "5432")
    os.environ.setdefault("DB_NAME", "flowersdb")
    os.environ.setdefault("DB_USER", "postgres")


_load_env()

if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))


@pytest.fixture()
def client():
    import server

    server.app.config["TESTING"] = True
    return server.app.test_client()
