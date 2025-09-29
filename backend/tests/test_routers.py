import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from app.models.base import UploadedFile

class TestAIRouter:
    """Test AI router endpoints"""

    def test_generate_sql_success(self, client, db_session, mock_gemini):
        """Test successful SQL generation"""
        # Create a test file in the database
        test_file = UploadedFile(
            filename="test.xlsx",
            original_filename="test.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel",
            dynamic_table_name="test_table"
        )
        db_session.add(test_file)
        db_session.commit()
        db_session.refresh(test_file)

        # Mock the Gemini service response
        mock_gemini.return_value.execute_ai_query.return_value = {
            "status": "completed",
            "query": "Show all data",
            "sql_query": "SELECT * FROM test_table",
            "executed_results": {"data": [], "columns": [], "row_count": 0},
            "visualizations": [],
            "explanation": "Test explanation"
        }

        response = client.post("/ai/generate-sql", json={
            "query": "Show all data",
            "file_id": test_file.id
        })

        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "completed"
        assert data["sql_query"] == "SELECT * FROM test_table"

    def test_generate_sql_missing_query(self, client):
        """Test SQL generation with missing query"""
        response = client.post("/ai/generate-sql", json={})

        assert response.status_code == 400
        assert "Query cannot be empty" in response.json()["detail"]

    def test_generate_sql_missing_file_id(self, client):
        """Test SQL generation with missing file_id"""
        response = client.post("/ai/generate-sql", json={
            "query": "Show all data"
        })

        assert response.status_code == 400
        assert "file_id is required" in response.json()["detail"]

    def test_generate_sql_file_not_found(self, client):
        """Test SQL generation with non-existent file"""
        response = client.post("/ai/generate-sql", json={
            "query": "Show all data",
            "file_id": 999
        })

        assert response.status_code == 404
        assert "File not found" in response.json()["detail"]

    def test_generate_sql_no_dynamic_table(self, client, db_session):
        """Test SQL generation with file that has no dynamic table"""
        # Create a test file without dynamic table
        test_file = UploadedFile(
            filename="test.xlsx",
            original_filename="test.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel"
        )
        db_session.add(test_file)
        db_session.commit()
        db_session.refresh(test_file)

        response = client.post("/ai/generate-sql", json={
            "query": "Show all data",
            "file_id": test_file.id
        })

        assert response.status_code == 400
        assert "does not have a dynamic table" in response.json()["detail"]

    def test_execute_sql_success(self, client, db_session):
        """Test successful SQL execution"""
        # Create a test file
        test_file = UploadedFile(
            filename="test.xlsx",
            original_filename="test.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel",
            dynamic_table_name="test_table"
        )
        db_session.add(test_file)
        db_session.commit()
        db_session.refresh(test_file)

        # Mock execute_sql function
        with patch('app.utils.database.execute_sql') as mock_execute:
            mock_df = MagicMock()
            mock_df.to_dict.return_value = [{"id": 1, "name": "test"}]
            mock_df.__len__ = lambda: 1
            mock_df.columns = ["id", "name"]
            mock_df.__getitem__ = lambda self, key: MagicMock(dtype="int64") if key == "id" else MagicMock(dtype="object")
            mock_execute.return_value = mock_df

            response = client.post("/ai/execute-sql", json={
                "file_id": test_file.id,
                "sql_query": "SELECT * FROM test_table"
            })

            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "success"
            assert len(data["data"]) == 1
            assert data["row_count"] == 1

    def test_execute_sql_missing_params(self, client):
        """Test SQL execution with missing parameters"""
        response = client.post("/ai/execute-sql", json={})

        assert response.status_code == 400
        assert "file_id and sql_query are required" in response.json()["detail"]

    def test_execute_sql_file_not_found(self, client):
        """Test SQL execution with non-existent file"""
        response = client.post("/ai/execute-sql", json={
            "file_id": 999,
            "sql_query": "SELECT * FROM test_table"
        })

        assert response.status_code == 404
        assert "File not found" in response.json()["detail"]

    def test_execute_sql_no_dynamic_table(self, client, db_session):
        """Test SQL execution with file that has no dynamic table"""
        # Create a test file without dynamic table
        test_file = UploadedFile(
            filename="test.xlsx",
            original_filename="test.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel"
        )
        db_session.add(test_file)
        db_session.commit()
        db_session.refresh(test_file)

        response = client.post("/ai/execute-sql", json={
            "file_id": test_file.id,
            "sql_query": "SELECT * FROM test_table"
        })

        assert response.status_code == 400
        assert "does not have a dynamic table" in response.json()["detail"]

    @patch('app.routers.ai.get_gemini_service')
    def test_generate_sql_service_error(self, mock_get_service, client, db_session):
        """Test SQL generation with service error"""
        # Create a test file
        test_file = UploadedFile(
            filename="test.xlsx",
            original_filename="test.xlsx",
            file_path="/tmp/test.xlsx",
            file_size=1024,
            file_hash="abc123",
            mime_type="application/vnd.ms-excel",
            dynamic_table_name="test_table"
        )
        db_session.add(test_file)
        db_session.commit()
        db_session.refresh(test_file)

        # Mock service to raise exception
        mock_service = MagicMock()
        mock_service.execute_ai_query.side_effect = Exception("Service error")
        mock_get_service.return_value = mock_service

        response = client.post("/ai/generate-sql", json={
            "query": "Show all data",
            "file_id": test_file.id
        })

        assert response.status_code == 500
        assert "SQL generation failed" in response.json()["detail"]
