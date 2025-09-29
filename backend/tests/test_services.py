import pytest
import pandas as pd
import os
import tempfile
from unittest.mock import Mock, patch, MagicMock
from app.services.excel_processor import ExcelProcessor
from app.services.gemini_service import GeminiService, get_gemini_service
from app.services.sql_generator import sql_generator
from app.services.data_cleaner import data_cleaner

class TestExcelProcessor:
    """Test ExcelProcessor service"""

    def test_processor_initialization(self):
        """Test ExcelProcessor initialization"""
        processor = ExcelProcessor()
        assert processor.upload_dir == "uploads"
        assert os.path.exists(processor.upload_dir)

    def test_validate_excel_file_valid(self):
        """Test validation of valid Excel file"""
        processor = ExcelProcessor()

        # Create a temporary Excel file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df = pd.DataFrame({'A': [1, 2, 3], 'B': ['x', 'y', 'z']})
            df.to_excel(tmp.name, index=False)

            result = processor.validate_excel_file(tmp.name)
            assert result["is_valid"] is True
            assert result["row_count"] == 3
            assert result["column_count"] == 2
            assert "A" in result["columns"]
            assert "B" in result["columns"]

            os.unlink(tmp.name)

    def test_validate_excel_file_invalid(self):
        """Test validation of invalid file"""
        processor = ExcelProcessor()

        # Create a temporary text file
        with tempfile.NamedTemporaryFile(suffix='.txt', delete=False) as tmp:
            tmp.write(b"This is not an Excel file")
            tmp.flush()

            result = processor.validate_excel_file(tmp.name)
            assert result["is_valid"] is False
            assert "error" in result

            os.unlink(tmp.name)

    def test_get_preview_data(self):
        """Test getting preview data"""
        processor = ExcelProcessor()

        # Create a temporary Excel file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df = pd.DataFrame({'A': [1, 2, 3, 4, 5], 'B': ['a', 'b', 'c', 'd', 'e']})
            df.to_excel(tmp.name, index=False)

            preview = processor.get_preview_data(tmp.name, rows=3)
            assert len(preview) == 3
            assert preview[0]['A'] == 1
            assert preview[0]['B'] == 'a'

            os.unlink(tmp.name)

    @patch('app.services.data_cleaner.data_cleaner.clean')
    def test_process_excel_file(self, mock_clean):
        """Test processing Excel file"""
        processor = ExcelProcessor()

        # Mock the cleaner
        mock_clean.return_value = (pd.DataFrame({'A': [1, 2], 'B': ['x', 'y']}), {"issues": []})

        # Create a temporary Excel file
        with tempfile.NamedTemporaryFile(suffix='.xlsx', delete=False) as tmp:
            df = pd.DataFrame({'A': [1, 2], 'B': ['x', 'y']})
            df.to_excel(tmp.name, index=False)

            result = processor.process_excel_file(tmp.name)
            assert result["status"] == "success"
            assert "processed_sheets" in result
            assert "Sheet1" in result["processed_sheets"]
            assert result["dataframe_info"]["shape"] == (2, 2)

            os.unlink(tmp.name)

class TestGeminiService:
    """Test GeminiService"""

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"})
    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_service_initialization(self, mock_model, mock_configure):
        """Test GeminiService initialization"""
        service = GeminiService()
        assert service.api_key == "test_key"
        mock_configure.assert_called_once_with(api_key="test_key")
        mock_model.assert_called_once_with('gemini-2.0-flash')

    @patch.dict(os.environ, {}, clear=True)
    def test_service_initialization_no_key(self):
        """Test initialization without API key"""
        with pytest.raises(ValueError, match="GEMINI_API_KEY environment variable is required"):
            GeminiService()

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"})
    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    def test_get_gemini_service_singleton(self, mock_model, mock_configure):
        """Test singleton pattern for get_gemini_service"""
        service1 = get_gemini_service()
        service2 = get_gemini_service()
        assert service1 is service2

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"})
    @patch('google.generativeai.configure')
    @patch('google.generativeai.GenerativeModel')
    @patch('app.services.gemini_service.sql_generator.generate_query')
    @patch('app.services.gemini_service.execute_sql')
    @patch('app.services.gemini_service.sql_generator.generate_visualizations')
    def test_execute_ai_query(self, mock_viz, mock_execute, mock_sql, mock_model, mock_configure):
        """Test AI query execution"""
        # Setup mocks
        mock_sql.return_value = "SELECT * FROM test_table"
        mock_execute.return_value = pd.DataFrame({'A': [1, 2], 'B': ['x', 'y']})
        mock_viz.return_value = [{"type": "bar", "data": []}]

        service = GeminiService()
        service._generate_explanation = Mock(return_value="Test explanation")
        service._check_data_quality = Mock(return_value=None)

        result = service.execute_ai_query(
            {"query": "Show all data"},
            "test_table",
            None  # engine not used in this test
        )

        assert result["status"] == "completed"
        assert result["sql_query"] == "SELECT * FROM test_table"
        assert len(result["executed_results"]["data"]) == 2
        assert len(result["visualizations"]) == 1

class TestSQLGenerator:
    """Test SQLGenerator service"""

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"})
    def test_generate_query_basic(self):
        """Test basic SQL query generation"""
        schema = {"columns": [{"name": "id", "type": "INTEGER"}, {"name": "name", "type": "TEXT"}]}
        query = sql_generator.generate_query("Show all records", schema, "test_table", "")
        assert "SELECT" in query.upper()
        assert "test_table" in query

    @patch.dict(os.environ, {"GEMINI_API_KEY": "test_key"})
    def test_generate_visualizations(self):
        """Test visualization generation"""
        data_info = {
            "columns": [{"name": "sales", "type": "float64"}, {"name": "region", "type": "object"}],
            "data": [{"sales": 100, "region": "North"}, {"sales": 200, "region": "South"}]
        }
        schema = {"columns": []}

        viz = sql_generator.generate_visualizations("Show sales by region", data_info, schema)
        assert isinstance(viz, list)
        # Should generate at most 3 visualizations
        assert len(viz) <= 3

class TestDataCleaner:
    """Test DataCleaner service"""

    def test_clean_basic_dataframe(self):
        """Test basic data cleaning"""
        df = pd.DataFrame({
            'A': [1, 2, None, 4],
            'B': ['a', 'b', 'c', 'd'],
            'C': [1.1, 2.2, 3.3, None]
        })

        cleaned_df, metadata = data_cleaner.clean(df)

        assert isinstance(cleaned_df, pd.DataFrame)
        assert "issues" in metadata
        assert "cleaning_steps" in metadata

    def test_clean_empty_dataframe(self):
        """Test cleaning empty dataframe"""
        df = pd.DataFrame()

        cleaned_df, metadata = data_cleaner.clean(df)

        assert len(cleaned_df) == 0
        assert isinstance(metadata, dict)

    def test_clean_dataframe_with_duplicates(self):
        """Test cleaning dataframe with duplicates"""
        df = pd.DataFrame({
            'A': [1, 1, 2, 2],
            'B': ['a', 'a', 'b', 'b']
        })

        cleaned_df, metadata = data_cleaner.clean(df)

        # Should handle duplicates appropriately
        assert isinstance(cleaned_df, pd.DataFrame)
        assert "duplicates_removed" in metadata or "issues" in metadata
