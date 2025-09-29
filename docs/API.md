# API Documentation

## Overview

The AI Data Agent API is built with FastAPI and provides RESTful endpoints for file management, data processing, and AI-powered analysis.

- **Base URL**: `http://localhost:8000`
- **API Documentation**: `http://localhost:8000/docs` (Swagger UI)
- **Alternative Docs**: `http://localhost:8000/redoc` (ReDoc)

## Authentication

Currently, no authentication is required. The API uses environment-based configuration for external services like Google Gemini AI.

## File Management Endpoints

### Upload File

**Endpoint**: `POST /upload`

**Description**: Upload and process an Excel file

**Content-Type**: `multipart/form-data`

**Parameters**:
- `file` (required): Excel file (.xlsx, .xls)

**Response**:
```json
{
  "message": "File uploaded and processed successfully",
  "file_id": 1,
  "filename": "sales_data.xlsx",
  "unique_filename": "abc123_sales_data.xlsx",
  "size": 245760,
  "file_hash": "abc123...",
  "validation": {
    "is_valid": true,
    "row_count": 1000,
    "column_count": 8,
    "columns": ["Date", "Product", "Sales", "Region"]
  },
  "processing_time_seconds": 2.34,
  "status": "success",
  "processed_data": {
    "dataframe_info": {
      "shape": [1000, 8],
      "columns": ["Date", "Product", "Sales", "Region", "..."],
      "dtypes": {"Date": "datetime64[ns]", "Sales": "float64"},
      "null_counts": {"Date": 0, "Sales": 5}
    },
    "numeric_stats": {
      "Sales": {
        "mean": 456.78,
        "median": 432.10,
        "std": 123.45,
        "min": 50.00,
        "max": 999.99
      }
    },
    "column_analysis": {
      "Product": {
        "dtype": "object",
        "unique_count": 25,
        "null_count": 0,
        "is_categorical": true
      }
    }
  }
}
```

**Error Response**:
```json
{
  "detail": "Only Excel files (.xlsx, .xls) are allowed"
}
```

### List Files

**Endpoint**: `GET /files`

**Description**: Get list of uploaded files with pagination

**Query Parameters**:
- `skip` (optional): Number of files to skip (default: 0)
- `limit` (optional): Maximum number of files to return (default: 100, max: 1000)

**Response**:
```json
{
  "files": [
    {
      "id": 1,
      "filename": "abc123_sales_data.xlsx",
      "original_filename": "sales_data.xlsx",
      "file_size": 245760,
      "status": "completed",
      "total_rows": 1000,
      "total_columns": 8,
      "created_at": "2024-12-27T14:30:00Z",
      "processed_at": "2024-12-27T14:30:02Z",
      "processing_time_seconds": 2.34
    }
  ],
  "total": 1,
  "skip": 0,
  "limit": 100
}
```

### Get File Details

**Endpoint**: `GET /files/{file_id}`

**Description**: Get detailed information about a specific file

**Path Parameters**:
- `file_id` (required): ID of the uploaded file

**Response**:
```json
{
  "id": 1,
  "filename": "abc123_sales_data.xlsx",
  "original_filename": "sales_data.xlsx",
  "file_path": "/app/uploads/abc123_sales_data.xlsx",
  "file_size": 245760,
  "file_hash": "abc123...",
  "mime_type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "status": "completed",
  "total_rows": 1000,
  "total_columns": 8,
  "total_sheets": 3,
  "sheet_names": ["Sales_Q1", "Sales_Q2", "Sales_Q3"],
  "cleaning_metadata": {
    "Sales_Q1": {
      "original_row_count": 1000,
      "cleaned_row_count": 980,
      "rows_removed": 20,
      "quality_score": 95.5,
      "issues": ["20 duplicate rows removed"],
      "cleaning_steps": ["Removed duplicates", "Filled missing values"]
    }
  },
  "created_at": "2024-12-27T14:30:00Z",
  "processed_at": "2024-12-27T14:30:02Z",
  "processing_time_seconds": 2.34,
  "sheets": [
    {
      "id": 1,
      "sheet_name": "Sales_Q1",
      "table_name": "file_1_sales_q1",
      "row_count": 980,
      "column_count": 8,
      "status": "completed",
      "data_quality_score": 95.5
    }
  ]
}
```

### Get File Metadata

**Endpoint**: `GET /files/{file_id}/metadata`

**Description**: Get metadata and cleaning information for a file

**Path Parameters**:
- `file_id` (required): ID of the uploaded file

**Response**:
```json
{
  "file_id": 1,
  "filename": "sales_data.xlsx",
  "sheet_names": ["Sales_Q1", "Sales_Q2", "Sales_Q3"],
  "cleaning_metadata": {
    "Sales_Q1": {
      "original_row_count": 1000,
      "cleaned_row_count": 980,
      "rows_removed": 20,
      "quality_score": 95.5,
      "issues": ["20 duplicate rows removed"],
      "cleaning_steps": ["Removed duplicates", "Filled missing values"]
    }
  },
  "total_quality_score": 94.2
}
```

### Export File

**Endpoint**: `GET /files/{file_id}/export`

**Description**: Export processed file data

**Path Parameters**:
- `file_id` (required): ID of the uploaded file

**Query Parameters**:
- `format` (optional): Export format - 'csv', 'excel' (default: 'excel')
- `sheet` (optional): Specific sheet name to export (default: all sheets)

**Response**: File download

### Get File Preview

**Endpoint**: `GET /files/{file_id}/preview`

**Description**: Get preview data from a processed file

**Path Parameters**:
- `file_id` (required): ID of the uploaded file

**Query Parameters**:
- `rows` (optional): Number of rows to preview (default: 10, max: 100)

**Response**:
```json
{
  "file_id": 1,
  "filename": "sales_data.xlsx",
  "preview_rows": 10,
  "data": [
    {
      "Date": "2024-01-01",
      "Product": "Product A",
      "Sales": 450.50,
      "Region": "North"
    },
    {
      "Date": "2024-01-02",
      "Product": "Product B",
      "Sales": 320.75,
      "Region": "South"
    }
  ]
}
```

### Delete File

**Endpoint**: `DELETE /files/{file_id}`

**Description**: Delete a file and all associated data

**Path Parameters**:
- `file_id` (required): ID of the uploaded file

**Response**:
```json
{
  "message": "File deleted successfully",
  "file_id": 1,
  "filename": "sales_data.xlsx"
}
```

## AI Query Processing Endpoints

### Process Query

**Endpoint**: `POST /query`

**Description**: Process a natural language query using AI

**Content-Type**: `application/json`

**Request Body**:
```json
{
  "query": "What were our top-selling products last quarter?",
  "file_id": 1
}
```

**Response**:
```json
{
  "query_id": 1,
  "query": "What were our top-selling products last quarter?",
  "response": "Based on your data, Product A had the highest sales at $45,000, representing 35% of total sales. Product B came in second with $32,000 (25%), followed by Product C with $28,000 (22%).",
  "insights": [
    "Product A: $45,000 (35% of total)",
    "Product B: $32,000 (25% of total)",
    "Product C: $28,000 (22% of total)"
  ],
  "recommendations": [
    "Consider increasing inventory for Product A as it shows strong demand",
    "Review pricing strategy for Product C to improve market share"
  ],
  "suggested_visualization": "bar",
  "status": "completed",
  "execution_time_ms": 1250,
  "rows_returned": 3
}
```

## System Endpoints

### Health Check

**Endpoint**: `GET /health`

**Description**: Check system health and status

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-12-27T14:30:00Z",
  "version": "1.0.0"
}
```

### Root

**Endpoint**: `GET /`

**Description**: API information and status

**Response**:
```json
{
  "message": "AI Data Agent API",
  "version": "1.0.0",
  "status": "running"
}
```

## Data Types

### File Status
- `uploaded`: File has been uploaded but not processed
- `processing`: File is being processed
- `completed`: File has been successfully processed
- `failed`: File processing failed

### Chart Types
- `bar`: Bar chart for categorical comparisons
- `line`: Line chart for trend analysis
- `area`: Area chart for cumulative data
- `pie`: Pie chart for proportional data
- `scatter`: Scatter plot for correlation analysis
- `histogram`: Histogram for distribution analysis

### Aggregation Types
- `sum`: Sum of values
- `avg`: Average of values
- `count`: Count of values
- `min`: Minimum value
- `max`: Maximum value

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input parameters |
| 404 | Not Found - Resource not found |
| 422 | Validation Error - Request body validation failed |
| 500 | Internal Server Error - Server-side error |

## Rate Limiting

Currently, no rate limiting is implemented. For production deployment, consider implementing rate limiting based on your usage patterns.

## Response Formats

### Success Response
```json
{
  "data": {...},
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "detail": "Error description",
  "error_code": "ERROR_CODE"
}
```

## SDKs and Libraries

### Python Client (Coming Soon)
```python
from ai_data_agent import Client

client = Client(api_key="your-api-key")
files = client.list_files()
result = client.query("What are our top products?", file_id=1)
```

### JavaScript Client (Coming Soon)
```javascript
import { AIPlaygroundClient } from '@ai-playground/sdk';

const client = new AIPlaygroundClient({ apiKey: 'your-api-key' });
const files = await client.files.list();
const result = await client.query('What are our top products?', { fileId: 1 });
```

## Webhooks (Future Feature)

Webhook support for file processing completion and query results will be added in future versions.

## API Versioning

Current API version: v1
Future versions will be available at `/v2/` endpoints.

## Support

For API support and questions:
- Check the troubleshooting guide
- Review the example requests
- Contact the development team