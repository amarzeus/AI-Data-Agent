import pytest
import pandas as pd
import tempfile
import os
from unittest.mock import patch, MagicMock
from app.utils.database import (
    DynamicTableManager, create_dynamic_table_from_schema,
    insert_dataframe_to_table, get_table_schema, execute_sql, table_manager
)
from app.utils.init_db import create_tables, drop_tables

class TestDynamicTableManager:
    """Test DynamicTableManager class"""

    def test_sanitize_table_name(self):
        """Test table name sanitization"""
        manager = DynamicTableManager()

        assert manager.sanitize_table_name("Sheet1") == "sheet1"
        assert manager.sanitize_table_name("My Sheet!") == "my_sheet_"
        assert manager.sanitize_table_name("123Sheet") == "t_123sheet"
        assert manager.sanitize_table_name("") == ""

    def test_sanitize_column_name(self):
        """Test column name sanitization"""
        manager = DynamicTableManager()

        assert manager.sanitize_column_name("Column Name") == "column_name"
        assert manager.sanitize_column_name("123Column") == "col_123column"
        assert manager.sanitize_column_name("Col@#$%") == "col____"

    def test_detect_column_type_numeric(self):
        """Test column type detection for numeric data"""
        manager = DynamicTableManager()

        # Integer series
        series = pd.Series([1, 2, 3, 4, 5])
        result = manager.detect_column_type(series)
        assert result['type'] == 'INTEGER'
        assert result['nullable'] == False

        # Float series
        series = pd.Series([1.1, 2.2, 3.3])
        result = manager.detect_column_type(series)
        assert result['type'] == 'FLOAT'

    def test_detect_column_type_text(self):
        """Test column type detection for text data"""
        manager = DynamicTableManager()

        series = pd.Series(['apple', 'banana', 'cherry'])
        result = manager.detect_column_type(series)
        assert result['type'] == 'TEXT'

    def test_detect_column_type_boolean(self):
        """Test column type detection for boolean data"""
        manager = DynamicTableManager()

        series = pd.Series([True, False, True])
        result = manager.detect_column_type(series)
        assert result['type'] == 'BOOLEAN'

    def test_detect_column_type_datetime(self):
        """Test column type detection for datetime data"""
        manager = DynamicTableManager()

        series = pd.Series(['2023-01-01', '2023-01-02'])
        result = manager.detect_column_type(series)
        assert result['type'] == 'DATETIME'

    def test_detect_column_type_empty(self):
        """Test column type detection for empty series"""
        manager = DynamicTableManager()

        series = pd.Series([], dtype=object)
        result = manager.detect_column_type(series)
        assert result['type'] == 'TEXT'
        assert result['nullable'] is True

    def test_detect_column_type_nullable(self):
        """Test column type detection with null values"""
        manager = DynamicTableManager()

        series = pd.Series([1, 2, None, 4])
        result = manager.detect_column_type(series)
        assert result['nullable'] == True

    def test_calculate_file_hash(self):
        """Test file hash calculation"""
        manager = DynamicTableManager()

        # Create a temporary file
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            tmp.write(b"test content")
            tmp_path = tmp.name

        try:
            hash_value = manager.calculate_file_hash(tmp_path)
            assert isinstance(hash_value, str)
            assert len(hash_value) == 32  # MD5 hash length
        finally:
            os.unlink(tmp_path)

class TestDatabaseFunctions:
    """Test standalone database utility functions"""

    @patch('app.utils.database.engine')
    def test_create_dynamic_table_from_schema(self, mock_engine):
        """Test dynamic table creation from schema"""
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        schema = {
            'table_name': 'test_table',
            'columns': [
                {'name': 'id', 'type': 'INTEGER', 'nullable': False, 'primary_key': True},
                {'name': 'name', 'type': 'TEXT', 'nullable': True}
            ]
        }

        result = create_dynamic_table_from_schema(schema, mock_engine)
        assert result == 'test_table'
        mock_conn.exec_driver_sql.assert_called_once()
        mock_conn.commit.assert_called_once()

    @patch('app.utils.database.engine')
    def test_insert_dataframe_to_table(self, mock_engine):
        """Test DataFrame insertion into table"""
        df = pd.DataFrame({'A': [1, 2], 'B': ['x', 'y']})

        with patch('pandas.DataFrame.to_sql') as mock_to_sql:
            result = insert_dataframe_to_table(df, 'test_table', mock_engine, file_id=1)
            assert result == 2
            # The to_sql is called on the connection object from engine.begin()
            mock_to_sql.assert_called_once()
            call_args = mock_to_sql.call_args
            assert call_args[0][0] == 'test_table'  # table_name
            assert call_args[1]['if_exists'] == 'append'
            assert call_args[1]['index'] == False

    @patch('app.utils.database.engine')
    def test_get_table_schema(self, mock_engine):
        """Test getting table schema"""
        mock_conn = MagicMock()
        mock_engine.connect.return_value.__enter__.return_value = mock_conn

        # Mock PRAGMA result
        mock_result = [
            (0, 'id', 'INTEGER', 0, None, 1),
            (1, 'file_id', 'INTEGER', 0, None, 0),
            (2, 'name', 'TEXT', 0, None, 0),
            (3, 'created_at', 'DATETIME', 0, None, 0)
        ]
        mock_conn.exec_driver_sql.return_value = mock_result

        schema = get_table_schema('test_table', mock_engine)
        assert 'name' in schema
        assert schema['name'] == 'TEXT'
        assert 'id' not in schema  # Should skip metadata columns

    @patch('app.utils.database.engine')
    @patch('pandas.read_sql')
    def test_execute_sql(self, mock_read_sql, mock_engine):
        """Test SQL execution"""
        mock_df = pd.DataFrame({'result': [1, 2, 3]})
        mock_read_sql.return_value = mock_df

        result = execute_sql('test_table', 'SELECT * FROM data', mock_engine)
        assert len(result) == 3
        mock_read_sql.assert_called_once_with('SELECT * FROM test_table LIMIT 200', mock_engine)

class TestInitDB:
    """Test database initialization functions"""

    @patch('app.utils.init_db.Base.metadata.create_all')
    @patch('app.utils.init_db.table_manager.create_tables')
    def test_create_tables_success(self, mock_table_create, mock_base_create):
        """Test successful table creation"""
        mock_base_create.return_value = None
        mock_table_create.return_value = True

        result = create_tables()
        assert result is True
        mock_base_create.assert_called_once()
        mock_table_create.assert_called_once()

    @patch('app.utils.init_db.Base.metadata.create_all')
    def test_create_tables_failure(self, mock_base_create):
        """Test table creation failure"""
        mock_base_create.side_effect = Exception("DB error")

        result = create_tables()
        assert result is False

    @patch('app.utils.init_db.Base.metadata.drop_all')
    def test_drop_tables_success(self, mock_base_drop):
        """Test successful table dropping"""
        mock_base_drop.return_value = None

        result = drop_tables()
        assert result is True
        mock_base_drop.assert_called_once()

    @patch('app.utils.init_db.Base.metadata.drop_all')
    def test_drop_tables_failure(self, mock_base_drop):
        """Test table dropping failure"""
        mock_base_drop.side_effect = Exception("DB error")

        result = drop_tables()
        assert result is False
