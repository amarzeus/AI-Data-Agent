import pytest
from datetime import datetime
from app.models.base import UploadedFile, FileSheet, SheetColumn, DataQualityIssue, QueryHistory
from app.models.schemas import (
    FileUploadResponse, FileProcessingStatus, SheetInfo, ColumnInfo,
    DataQualityIssueSchema, NaturalLanguageQuery, QueryResponse,
    AIQueryRequest, AIQueryResponse, HealthCheckResponse
)

class TestBaseModels:
    """Test SQLAlchemy base models"""

    def test_uploaded_file_creation(self, db_session):
        """Test UploadedFile model instantiation"""
        file = UploadedFile(
            filename="test.xlsx",
            original_filename="original.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel"
        )
        db_session.add(file)
        db_session.flush()  # Apply defaults without committing
        assert file.filename == "test.xlsx"
        assert file.status == "uploaded"
        assert file.total_sheets == 0

    def test_file_sheet_creation(self, db_session):
        """Test FileSheet model instantiation"""
        sheet = FileSheet(
            file_id=1,
            sheet_name="Sheet1",
            table_name="table_1"
        )
        db_session.add(sheet)
        db_session.flush()  # Apply defaults without committing
        assert sheet.sheet_name == "Sheet1"
        assert sheet.status == "pending"
        assert sheet.has_headers is True

    def test_sheet_column_creation(self, db_session):
        """Test SheetColumn model instantiation"""
        column = SheetColumn(
            sheet_id=1,
            file_id=1,
            column_name="Name",
            column_index=0,
            detected_data_type="string"
        )
        db_session.add(column)
        db_session.flush()  # Apply defaults without committing
        assert column.column_name == "Name"
        assert column.detected_data_type == "string"
        assert column.is_nullable is True

    def test_data_quality_issue_creation(self, db_session):
        """Test DataQualityIssue model instantiation"""
        issue = DataQualityIssue(
            file_id=1,
            issue_type="missing_values",
            severity="high",
            description="Missing values detected"
        )
        db_session.add(issue)
        db_session.flush()  # Apply defaults without committing
        assert issue.issue_type == "missing_values"
        assert issue.severity == "high"
        assert issue.resolved is False

    def test_query_history_creation(self, db_session):
        """Test QueryHistory model instantiation"""
        query = QueryHistory(
            file_id=1,
            natural_language_query="Show sales by region"
        )
        db_session.add(query)
        db_session.flush()  # Apply defaults without committing
        assert query.natural_language_query == "Show sales by region"
        assert query.status == "completed"

class TestPydanticSchemas:
    """Test Pydantic schema validation"""

    def test_file_upload_response(self):
        """Test FileUploadResponse schema"""
        response = FileUploadResponse(
            message="Upload successful",
            filename="test.xlsx",
            size=1024,
            file_path="/tmp/test.xlsx"
        )
        assert response.message == "Upload successful"
        assert response.size == 1024

    def test_file_processing_status(self):
        """Test FileProcessingStatus schema"""
        status = FileProcessingStatus(
            file_id=1,
            status="completed",
            progress=100.0
        )
        assert status.file_id == 1
        assert status.progress == 100.0

    def test_sheet_info(self):
        """Test SheetInfo schema"""
        sheet = SheetInfo(
            sheet_id=1,
            sheet_name="Sheet1",
            table_name="table_1",
            row_count=100,
            column_count=5,
            has_headers=True,
            status="completed"
        )
        assert sheet.sheet_name == "Sheet1"
        assert sheet.row_count == 100

    def test_column_info(self):
        """Test ColumnInfo schema"""
        column = ColumnInfo(
            column_id=1,
            column_name="Name",
            original_column_name="Name",
            column_index=0,
            detected_data_type="string",
            confidence_score=0.9,
            is_nullable=True,
            unique_values_count=50,
            null_values_count=0
        )
        assert column.column_name == "Name"
        assert column.detected_data_type == "string"

    def test_data_quality_issue_schema(self):
        """Test DataQualityIssueSchema"""
        issue = DataQualityIssueSchema(
            issue_id=1,
            issue_type="missing_values",
            severity="medium",
            description="Some missing values",
            row_number=1,
            column_name="Name"
        )
        assert issue.severity == "medium"
        assert issue.resolved is False

    def test_natural_language_query(self):
        """Test NaturalLanguageQuery schema"""
        query = NaturalLanguageQuery(
            query="Show top sales",
            file_id=1,
            include_visualization=True
        )
        assert query.query == "Show top sales"
        assert query.include_visualization is True

    def test_query_response(self):
        """Test QueryResponse schema"""
        response = QueryResponse(
            query_id=1,
            original_query="Show sales",
            processed_query="Show sales",
            sql_query="SELECT * FROM sales",
            response_text="Results found",
            visualization_type="bar",
            visualization_data={},
            execution_time_ms=150.5,
            rows_returned=10,
            status="completed"
        )
        assert response.execution_time_ms == 150.5
        assert response.status == "completed"

    def test_ai_query_request(self):
        """Test AIQueryRequest schema"""
        request = AIQueryRequest(
            query="Analyze sales data",
            file_id=1
        )
        assert request.query == "Analyze sales data"

    def test_ai_query_response(self):
        """Test AIQueryResponse schema"""
        response = AIQueryResponse(
            status="success",
            query="Analyze sales",
            sql_query="SELECT * FROM sales",
            visualizations=[]
        )
        assert response.status == "success"
        assert len(response.visualizations) == 0

    def test_health_check_response(self):
        """Test HealthCheckResponse schema"""
        health = HealthCheckResponse(
            status="healthy",
            database="connected",
            timestamp=datetime.now(),
            version="1.0.0"
        )
        assert health.status == "healthy"
        assert health.version == "1.0.0"

    def test_schema_validation_errors(self):
        """Test schema validation with invalid data"""
        with pytest.raises(ValueError):
            # Empty query should fail
            NaturalLanguageQuery(query="")

        with pytest.raises(ValueError):
            # Invalid progress value
            FileProcessingStatus(
                file_id=1,
                status="processing",
                progress=150.0  # Should be <= 100
            )
