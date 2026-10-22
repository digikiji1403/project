
import getpass
import os
import sys

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import make_url

# Load the project's existing local database configuration.
PROJECT_ROOT = os.path.abspath(
    os.path.join(os.path.dirname(__file__), "..", "..")
)
sys.path.insert(0, os.path.join(PROJECT_ROOT, "backend"))

from app.db.database import engine as local_engine
from app.db import models  # noqa: F401
from app.db.database import Base

TABLE_ORDER = [
    "users",
    "learning_stats",
    "documents",
    "conversations",
    "document_chunks",
    "study_materials",
    "study_plan_sessions",
    "chat_messages",
    "quiz_attempts",
]


def normalized_url(raw_url):
    url = make_url(raw_url.strip())
    if url.drivername == "postgresql":
        url = url.set(drivername="postgresql+psycopg")
    return url


def row_counts(connection, tables):
    return {
        table: connection.execute(
            text(f'SELECT COUNT(*) FROM "{table}"')
        ).scalar_one()
        for table in tables
    }


def main():
    print("StudyMate AI local-to-Neon migration")
    print("Your local DATABASE_URL will not be changed.")

    raw_url = getpass.getpass(
        "Paste the NEW Neon DATABASE_URL (input hidden): "
    )
    if not raw_url.strip():
        raise SystemExit("No Neon URL supplied. Nothing changed.")

    neon_url = normalized_url(raw_url)
    del raw_url

    # Never print either connection URL.
    target_engine = create_engine(
        neon_url,
        pool_pre_ping=True,
        connect_args={"connect_timeout": 15},
    )

    try:
        expected_tables = set(Base.metadata.tables.keys())

        with local_engine.connect() as source, target_engine.connect() as target:
            source_tables = set(inspect(source).get_table_names())
            target_tables = set(inspect(target).get_table_names())

            missing_source = expected_tables - source_tables
            missing_target = expected_tables - target_tables

            if missing_source:
                raise RuntimeError(
                    f"Local database is missing tables: {sorted(missing_source)}"
                )
            if missing_target:
                raise RuntimeError(
                    f"Neon is missing tables: {sorted(missing_target)}. "
                    "Run the project's schema migrations first."
                )

            source_counts = row_counts(source, TABLE_ORDER)
            target_counts = row_counts(target, TABLE_ORDER)

            print("\nLocal row counts:")
            for table in TABLE_ORDER:
                print(f"  {table}: {source_counts[table]}")

            print("\nNeon row counts:")
            for table in TABLE_ORDER:
                print(f"  {table}: {target_counts[table]}")

            if not any(source_counts.values()):
                raise RuntimeError("Local database is empty; refusing migration.")

            if any(target_counts.values()):
                raise RuntimeError(
                    "Neon is not empty. No data was copied. "
                    "A separate merge plan is required."
                )

            # Verify compatible column names before copying.
            source_inspector = inspect(source)
            target_inspector = inspect(target)

            for table in TABLE_ORDER:
                src_cols = {
                    c["name"] for c in source_inspector.get_columns(table)
                }
                dst_cols = {
                    c["name"] for c in target_inspector.get_columns(table)
                }
                if src_cols != dst_cols:
                    raise RuntimeError(
                        f"Column mismatch in {table}: "
                        f"local-only={sorted(src_cols - dst_cols)}, "
                        f"Neon-only={sorted(dst_cols - src_cols)}"
                    )

        # Copy in dependency order, inside one destination transaction.
        with local_engine.connect() as source:
            with target_engine.begin() as target:
                # Recheck emptiness inside the write transaction.
                current_counts = row_counts(target, TABLE_ORDER)
                if any(current_counts.values()):
                    raise RuntimeError(
                        "Neon gained rows during validation; refusing to copy."
                    )

                for table in TABLE_ORDER:
                    result = source.execute(text(f'SELECT * FROM "{table}"'))
                    columns = list(result.keys())
                    rows = result.fetchall()

                    if not rows:
                        continue

                    column_sql = ", ".join(f'"{c}"' for c in columns)
                    bind_sql = ", ".join(f":p{i}" for i in range(len(columns)))
                    insert_sql = text(
                        f'INSERT INTO "{table}" ({column_sql}) '
                        f"VALUES ({bind_sql})"
                    )

                    payload = [
                        {f"p{i}": row[i] for i in range(len(columns))}
                        for row in rows
                    ]
                    target.execute(insert_sql, payload)
                    print(f"Copied {len(rows)} rows into {table}.")

                # Update PostgreSQL sequences for tables with integer IDs.
                for table in TABLE_ORDER:
                    pk = inspect(target).get_pk_constraint(table)
                    pk_columns = pk.get("constrained_columns") or []
                    if pk_columns != ["id"]:
                        continue

                    column_type = next(
                        c["type"]
                        for c in inspect(target).get_columns(table)
                        if c["name"] == "id"
                    )
                    if "INT" not in str(column_type).upper():
                        continue

                    target.execute(
                        text(
                            "SELECT setval("
                            "pg_get_serial_sequence(:table_name, 'id'), "
                            "COALESCE((SELECT MAX(id) FROM "
                            f'"{table}"' "), 1), "
                            f"EXISTS (SELECT 1 FROM \"{table}\"))"
                        ),
                        {"table_name": table},
                    )

        with target_engine.connect() as target:
            final_counts = row_counts(target, TABLE_ORDER)

        print("\nMigration committed. Final counts:")
        for table in TABLE_ORDER:
            print(
                f"  {table}: local={source_counts[table]}, "
                f"Neon={final_counts[table]}"
            )

        if source_counts != final_counts:
            raise RuntimeError(
                "Post-migration counts differ. Stop and investigate before "
                "using the deployed application."
            )

        print("\nDatabase row counts match.")
        print(
            "Note: this migrates database rows only, not PDF files or "
            "Pinecone vectors."
        )

    finally:
        target_engine.dispose()


if __name__ == "__main__":
    main()
