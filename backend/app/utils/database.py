"""
Database utilities for dynamic table creation and management
"""

import re
import hashlib
from typing import Dict, List, Any, Optional
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, Table, MetaData
from sqlalchemy.sql import func
from ..core.config import engine
import pandas as pd
from datetime import datetime

DEFAULT_SQL_LIMIT = 200
SAFE_SQL_PATTERN = re.compile(r"^\s*SELECT\b", re.IGNORECASE)
FORBIDDEN_SQL_TOKENS = {
    "INSERT",
    "UPDATE",
    "DELETE",
    "DROP",
    "ALTER",
    "TRUNCATE",
    "MERGE",
    "CALL",
    "EXEC",
    "PRAGMA",
}
COMMENT_TOKENS = ("--", "/*", "//")

class DynamicTableManager:
    """Manages dynamic table creation based on Excel structures"""

    def __init__(self):
        self.metadata = MetaData()
        self.dynamic_tables = {}

    def sanitize_table_name(self, name: str) -> str:
        """Convert sheet name to a valid table name"""
        # Remove special characters and spaces
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', name)
        # Ensure it starts with a letter or underscore
        if sanitized and not sanitized[0].isalpha() and sanitized[0] != '_':
            sanitized = 't_' + sanitized
        # Limit length
        return sanitized[:63].lower()

    def detect_column_type(self, series: pd.Series) -> Dict[str, Any]:
        """Detect the appropriate SQL column type for a pandas series"""

        # Handle empty series
        if series.empty or series.isna().all():
            return {
                'type': 'TEXT',
                'nullable': True,
                'default': None
            }

        # Get non-null values for type detection
        non_null_values = series.dropna()

        if non_null_values.empty:
            return {
                'type': 'TEXT',
                'nullable': True,
                'default': None
            }

        # Detect data types
        detected_type = None
        confidence = 0.0

        # Try to detect as boolean
        if self._is_boolean_series(non_null_values):
            detected_type = 'BOOLEAN'
            confidence = 1.0

        # Try to detect as numeric first (more specific)
        elif self._is_numeric_series(non_null_values):
            if self._is_integer_series(non_null_values):
                detected_type = 'INTEGER'
                confidence = 1.0
            else:
                detected_type = 'FLOAT'
                confidence = 0.95

        # Try to detect as datetime (only if not numeric)
        elif self._is_datetime_series(non_null_values):
            detected_type = 'DATETIME'
            confidence = 0.9

        # Default to text
        else:
            detected_type = 'TEXT'
            confidence = 0.8

        # Check for nullability
        null_ratio = series.isna().sum() / len(series)
        is_nullable = null_ratio > 0

        return {
            'type': detected_type,
            'nullable': is_nullable,
            'confidence': confidence,
            'null_ratio': null_ratio
        }

    def _is_boolean_series(self, series: pd.Series) -> bool:
        """Check if series contains boolean values"""
        unique_values = series.unique()
        return len(unique_values) <= 2 and all(val in [True, False, 0, 1, 'true', 'false', 'True', 'False', 'TRUE', 'FALSE', 0.0, 1.0] for val in unique_values)

    def _is_datetime_series(self, series: pd.Series) -> bool:
        """Check if series contains datetime values"""
        try:
            pd.to_datetime(series)
            return True
        except (ValueError, TypeError):
            return False

    def _is_numeric_series(self, series: pd.Series) -> bool:
        """Check if series contains numeric values"""
        try:
            pd.to_numeric(series)
            return True
        except (ValueError, TypeError):
            return False

    def _is_integer_series(self, series: pd.Series) -> bool:
        """Check if numeric series contains integers"""
        try:
            numeric_series = pd.to_numeric(series)
            return all(val == int(val) for val in numeric_series.dropna())
        except (ValueError, TypeError):
            return False

    def create_dynamic_table(self, sheet_name: str, columns: List[Dict[str, Any]]) -> Table:
        """Create a dynamic SQLAlchemy table based on column specifications"""

        table_name = self.sanitize_table_name(sheet_name)

        # Avoid duplicate table names
        counter = 1
        original_name = table_name
        while table_name in self.dynamic_tables:
            table_name = f"{original_name}_{counter}"
            counter += 1

        # Define columns
        columns_def = []

        # Add ID column
        columns_def.append(
            Column('id', Integer, primary_key=True, autoincrement=True)
        )

        # Add file_id to link to uploaded file
        columns_def.append(
            Column('file_id', Integer, nullable=False, index=True)
        )

        # Add data columns
        for col_info in columns:
            col_name = self.sanitize_column_name(col_info['name'])

            if col_info['type'] == 'INTEGER':
                columns_def.append(Column(col_name, Integer, nullable=col_info['nullable']))
            elif col_info['type'] == 'FLOAT':
                columns_def.append(Column(col_name, Float, nullable=col_info['nullable']))
            elif col_info['type'] == 'BOOLEAN':
                columns_def.append(Column(col_name, Boolean, nullable=col_info['nullable']))
            elif col_info['type'] == 'DATETIME':
                columns_def.append(Column(col_name, DateTime(timezone=True), nullable=col_info['nullable']))
            else:
                # Default to TEXT with appropriate length
                max_length = min(col_info.get('max_length', 255), 1000)
                columns_def.append(Column(col_name, String(max_length), nullable=col_info['nullable']))

        # Add metadata columns
        columns_def.extend([
            Column('created_at', DateTime(timezone=True), server_default=func.now()),
            Column('updated_at', DateTime(timezone=True), server_default=func.now(), onupdate=func.now()),
            Column('row_index', Integer, nullable=False),  # Original row index from Excel
        ])

        # Create table
        table = Table(table_name, self.metadata, *columns_def)
        self.dynamic_tables[table_name] = table

        return table

    def sanitize_column_name(self, name: str) -> str:
        """Convert column name to a valid SQL column name"""
        # Replace spaces and special characters with underscores
        sanitized = re.sub(r'[^a-zA-Z0-9_]', '_', str(name))
        # Ensure it starts with a letter or underscore
        if sanitized and not sanitized[0].isalpha() and sanitized[0] != '_':
            sanitized = 'col_' + sanitized
        # Limit length
        return sanitized[:63].lower()

    def create_tables(self):
        """Create all tables in the database"""
        try:
            self.metadata.create_all(bind=engine)
            return True
        except Exception as e:
            print(f"Error creating tables: {e}")
            return False

    def get_table(self, table_name: str) -> Optional[Table]:
        """Get a dynamic table by name"""
        return self.dynamic_tables.get(table_name)

    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate hash of uploaded file for duplicate detection"""
        hash_md5 = hashlib.md5()
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()

def create_dynamic_table_from_schema(schema: Dict[str, Any], engine) -> str:
    """Create a dynamic table from schema dict"""
    table_name = schema['table_name']
    columns = schema['columns']

    # Build CREATE TABLE SQL
    column_defs = []

    # Add additional metadata columns
    column_defs.append('file_id INTEGER NOT NULL')
    column_defs.append('created_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    column_defs.append('updated_at DATETIME DEFAULT CURRENT_TIMESTAMP')
    column_defs.append('row_index INTEGER NOT NULL')

    # Add data columns
    for col in columns:
        col_def = f'"{col["name"]}" {col["type"]}'
        if not col.get('nullable', True):
            col_def += " NOT NULL"
        if col.get('primary_key'):
            col_def += " PRIMARY KEY"
        column_defs.append(col_def)

    sql = f'CREATE TABLE IF NOT EXISTS "{table_name}" (id INTEGER PRIMARY KEY AUTOINCREMENT, {", ".join(column_defs)})'

    # Retry logic for SQLite locking issues
    max_retries = 3
    retry_delay = 0.1

    for attempt in range(max_retries):
        try:
            # Use the engine directly with exec_driver_sql for DDL
            with engine.connect() as conn:
                conn.exec_driver_sql(sql)
                conn.commit()
            return table_name
        except Exception as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                import time
                time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                continue
            print(f"Error creating table {table_name}: {e}")
            raise


def insert_dataframe_to_table(df: pd.DataFrame, table_name: str, engine, file_id: int = None) -> int:
    """Insert DataFrame into dynamic table"""
    # Retry logic for SQLite locking issues
    max_retries = 3
    retry_delay = 0.1

    for attempt in range(max_retries):
        try:
            # Add file_id and row_index columns
            df_copy = df.copy()
            df_copy['file_id'] = file_id
            df_copy['row_index'] = range(len(df_copy))

            # Insert data with explicit transaction management
            with engine.begin() as connection:
                df_copy.to_sql(table_name, connection, if_exists='append', index=False)
            return len(df_copy)
        except Exception as e:
            if "database is locked" in str(e) and attempt < max_retries - 1:
                import time
                time.sleep(retry_delay * (2 ** attempt))  # Exponential backoff
                continue
            print(f"Error inserting data into {table_name}: {e}")
            raise


def get_table_schema(table_name: str, engine) -> Dict[str, str]:
    """Get column schema for a table as dict of column_name: type"""
    try:
        with engine.connect() as conn:
            result = conn.exec_driver_sql(f"PRAGMA table_info({table_name})")
            schema = {}
            for row in result:
                col_name = row[1]  # name
                col_type = row[2]  # type
                # Skip metadata columns
                if col_name not in ['id', 'file_id', 'created_at', 'updated_at', 'row_index']:
                    schema[col_name] = col_type
            return schema
    except Exception as e:
        print(f"Error getting schema for {table_name}: {e}")
        return {}


def _sanitize_sql(sql: str) -> str:
    """Basic SQL sanitization to remove comments and enforce SELECT only."""
    stripped = sql.strip()
    if not SAFE_SQL_PATTERN.match(stripped):
        raise ValueError("Only SELECT statements are allowed")

    upper_sql = stripped.upper()
    for token in FORBIDDEN_SQL_TOKENS:
        if token in upper_sql:
            raise ValueError(f"Forbidden SQL operation detected: {token}")

    for token in COMMENT_TOKENS:
        if token in stripped:
            stripped = stripped.split(token)[0].strip()

    if "LIMIT" not in upper_sql:
        stripped = f"{stripped.rstrip(';')} LIMIT {DEFAULT_SQL_LIMIT}";

    return stripped


def execute_sql(table_name: str, sql: str, engine) -> pd.DataFrame:
    """Execute sanitized SQL query on dynamic table"""
    try:
        sanitized_sql = _sanitize_sql(sql)
        safe_sql = sanitized_sql.replace('FROM data', f'FROM {table_name}').replace('from data', f'from {table_name}')
        return pd.read_sql(safe_sql, engine)
    except Exception as e:
        print(f"Error executing SQL: {e}")
        raise


# Global instance
table_manager = DynamicTableManager()
