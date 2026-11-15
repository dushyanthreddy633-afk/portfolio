import os
import sqlite3
from contextlib import closing
from pathlib import Path

from flask import Flask, jsonify, send_from_directory


BASE_DIR = Path(__file__).resolve().parent
DEFAULT_DATABASE_PATH = (
    Path("/tmp/visitor_count.sqlite3")
    if os.environ.get("VERCEL")
    else BASE_DIR / "visitor_count.sqlite3"
)
DATABASE_PATH = Path(os.environ.get("VISITOR_DB_PATH", DEFAULT_DATABASE_PATH))
app = Flask(__name__, static_folder=None)


def initialize_database() -> None:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    with closing(sqlite3.connect(DATABASE_PATH)) as connection:
        with connection:
            connection.execute(
                """
                CREATE TABLE IF NOT EXISTS visitor_count (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    total INTEGER NOT NULL CHECK (total >= 0)
                )
                """
            )
            connection.execute(
                "INSERT OR IGNORE INTO visitor_count (id, total) VALUES (1, 0)"
            )


def increment_visitor_count() -> int:
    with closing(sqlite3.connect(DATABASE_PATH, timeout=10)) as connection:
        with connection:
            connection.execute(
                "UPDATE visitor_count SET total = total + 1 WHERE id = 1"
            )
            result = connection.execute(
                "SELECT total FROM visitor_count WHERE id = 1"
            ).fetchone()
    return result[0]


initialize_database()


@app.get("/")
def home():
    return send_from_directory(BASE_DIR, "index.html")


@app.get("/style.css")
def stylesheet():
    return send_from_directory(BASE_DIR, "style.css")


@app.get("/script.js")
def javascript():
    return send_from_directory(BASE_DIR, "script.js")


@app.get("/assets/<path:filename>")
def asset(filename: str):
    return send_from_directory(BASE_DIR / "assets", filename)


@app.post("/api/visits")
def record_visit():
    response = jsonify({"visits": increment_visitor_count()})
    response.headers["Cache-Control"] = "no-store"
    return response


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    app.run(host="127.0.0.1", port=port, debug=False)
