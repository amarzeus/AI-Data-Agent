# Implementation Plan

The overall goal is to implement a fully functional AI Data Agent that allows users to upload Excel files, automatically process and clean the data into a dynamic SQL database, query the data using natural language via an AI agent (Gemini), and display results with interactive charts and tables in a three-column React dashboard layout.

This implementation builds on the existing codebase, which includes a FastAPI backend with Excel processing and Gemini integration, and a React frontend with MUI components for upload, chat, playground, and tools panels. The current setup handles basic file upload and preview but lacks dynamic database schema creation, data cleaning for dirty/inconsistent data, natural language to SQL conversion, safe SQL execution, multi-sheet support, and dynamic visualizations. The approach involves enhancing the backend for robust data ingestion and AI-driven analysis while updating the frontend for intuitive interaction and rendering. This fits into the existing system by extending the /upload endpoint for cleaning and table creation, adding /generate-sql and /execute-sql endpoints, and integrating AI responses with visualizations in the chat and playground areas. The implementation addresses the PRD's core requirements for handling vague queries, dirty data (missing values, duplicates, type inconsistencies, unnamed columns), and intelligent chart selection, ensuring the platform is production-ready with error handling, validation, and user feedback.

The system will use SQLite for development (configurable to PostgreSQL), Pandas for Excel parsing, SQLAlchemy for dynamic ORM models, Google Gemini for NL to SQL generation and explanations, and Recharts for frontend visualizations. Data quality checks will include disclaimers for incomplete data, and the AI will infer intent for aggregations/comparisons.

[Types]  
The type system will be extended with Pydantic models for dynamic data schemas and AI responses, and TypeScript interfaces for frontend API payloads.

Detailed type definitions:

- Backend (Pydantic models in backend/app/models/schemas.py):
  - DynamicColumnSchema: name: str, type: str (e.g., 'VARCHAR', 'INTEGER', 'DATE'), nullable: bool, constraints: Optional[Dict[str, Any]] = None
  - DynamicTableSchema: table_name: str, columns: List[DynamicColumnSchema], primary_key: Optional[str] = None, relationships: Optional[List[Dict]] = None
  - CleanedDataMetadata: original_shape: Tuple[int, int], cleaned_shape: Tuple[int, int], cleaning_steps: List[str], issues_found: Dict[str, int] (e.g., {'missing_values': 5, 'duplicates': 2}), data_quality_score: float (0-1)
  - AIQueryRequest: query: str, file_id: int, context: Optional[str] = None (e.g., column descriptions)
  - AIQueryResponse: status: str ('success' | 'error' | 'partial'), sql_query: str, executed_results: Optional[Dict[str, Any]] = None (with 'data': List[Dict], 'columns': List[Dict[str, str]], 'row_count': int), visualizations: Optional[List[Dict[str, Any]]] = None (each with 'type': str ('bar' | 'line' | 'pie' | 'table'), 'data': List[Dict], 'config': Dict), explanation: str, data_quality_disclaimer: Optional[str] = None, error: Optional[str] = None
  - Validation rules: All strings non-empty where required, file_id > 0, visualizations limited to 5 per response, SQL queries must pass basic safety checks (no DROP/DELETE/UPDATE unless explicit).

- Frontend (TypeScript interfaces in frontend/src/services/apiService.ts):
  - DynamicTableInfo: tableName: string, columns: Array<{name: string, type: string, nullable: boolean}>, primaryKey?: string
  - CleaningMetadata: originalShape: {rows: number, cols: number}, cleanedShape: {rows: number, cols: number}, steps: string[], issues: Record<string, number>, qualityScore: number
  - AIQueryRequest: query: string, fileId?: number, context?: string
  - AIQueryResponse: status: string, query: string, sqlQuery?: string, executedResults?: {data: Record<string, any>[], columns: Array<{name: string, type: string}>, rowCount: number}, visualizations?: Array<{type: 'bar' | 'line' | 'pie' | 'scatter' | 'table', data: Record<string, any>[], config: Record<string, any> }>, explanation?: string, dataQualityDisclaimer?: string, error?: string
  - Relationships: AIQueryResponse.visualizations reference executedResults.data; CleaningMetadata integrates with UploadResponse.

[Files]
File modifications will include new services for data cleaning and SQL generation, updates to existing backend files for dynamic DB handling, new frontend components for drag-drop upload and viz rendering, and API service extensions.

Detailed breakdown:
- New files to be created (with full paths and purpose):
  - backend/app/services/data_cleaner.py: Implements DataCleaner class for handling dirty data (rename unnamed columns, standardize types/dates/text, fill/remove missing values/duplicates).
  - backend/app/services/sql_generator.py: Implements SQLGenerator class using Gemini to convert NL queries to safe SQL, with validation and viz config generation.
  - backend/app/routers/ai.py: New router for /generate-sql and /execute-sql endpoints.
  - frontend/src/components/DragDropUpload.tsx: Drag-and-drop file upload component with validation and progress feedback.
  - frontend/src/components/QueryResultsViz.tsx: Renders dynamic charts/tables based on AI response visualizations using Recharts.
  - frontend/src/components/DataCleaningReport.tsx: Displays cleaning metadata and quality issues in ToolsPanel.

- Existing files to be modified (with specific changes):  
  - backend/main.py: Add import for ai router, include_router(ai_router); Update /upload to call data_cleaner.clean() after excel_processor, create dynamic table via database utils, store table_name and cleaning_metadata in UploadedFile.
  - backend/app/services/excel_processor.py: Enhance process_excel_file to support multi-sheet (return dict of sheet_name: df), integrate data_cleaner, handle unnamed columns/sheets.
  - backend/app/services/gemini_service.py: Add execute_ai_query using SQLGenerator, generate explanation and quality disclaimer.
  - backend/app/utils/database.py: Add create_dynamic_table_from_schema(table_schema: DynamicTableSchema), insert_dataframe_to_table(df: pd.DataFrame, table_name: str), execute_sql(sql: str, table_name: str) -> Dict with results.
  - backend/app/models/base.py: Add dynamic_table_name: Optional[str] = None, cleaning_metadata: Optional[CleanedDataMetadata] = None to UploadedFile model.
  - backend/app/models/schemas.py: Add the new Pydantic models listed in [Types].
  - frontend/src/components/FileUploadModal.tsx: Integrate DragDropUpload as primary method, fallback to FileUpload; Update onUploadSuccess to handle new fields (dynamic_table_name, cleaning_metadata).
  - frontend/src/services/apiService.ts: Add generateSQL(request: AIQueryRequest): Promise<AIQueryResponse>, executeSQL(fileId: number, sql: string): Promise<ExecutedResults>; Update UploadResponse interface with dynamic_table_name?: string, cleaning_metadata?: CleaningMetadata.
  - frontend/src/components/ChatInterface.tsx: Update Message interface with sqlQuery?: string, visualizations?: Array<VizConfig>, explanation?: string; In chatMutation, call generateSQL, then if sqlQuery, call executeSQL, render QueryResultsViz for visualizations, display explanation/disclaimer.
  - frontend/src/components/PlaygroundArea.tsx: Integrate QueryResultsViz for manual viz selection, add tab for cleaning report using DataCleaningReport.
  - frontend/src/components/ToolsPanel.tsx: Add buttons to trigger cleaning report, manual data ops (filter/sort via new API if needed).
  - frontend/src/App.tsx: Pass cleaning_metadata to Dashboard if available.
  - frontend/package.json: Add "recharts": "^2.8.0" for visualizations.

- Files to be deleted or moved: None.

- Configuration file updates:
  - backend/app/core/config.py: Add MAX_SHEETS: int = 10, AI_MODEL: str = "gemini-pro", SQL_SAFETY_LEVEL: str = "read-only".
  - backend/.env: Ensure GOOGLE_API_KEY is set (user to provide).
  - frontend/.env: REACT_APP_API_URL=http://localhost:8000.

[Functions]
Function modifications will add data cleaning routines, SQL generation/execution, and frontend handlers for AI responses and viz rendering.

Detailed breakdown:
- New functions (name, signature, file path, purpose):
  - clean_data(df: pd.DataFrame, sheet_name: str) -> Tuple[pd.DataFrame, CleanedDataMetadata], backend/app/services/data_cleaner.py: Applies cleaning steps (rename columns, handle missing/duplicates/types/dates/text), returns cleaned DF and metadata.
  - generate_sql_query(request: AIQueryRequest) -> str, backend/app/services/sql_generator.py: Uses Gemini to generate SQL from NL query, with table schema context.
  - validate_and_sanitize_sql(sql: str, table_name: str) -> str, backend/app/services/sql_generator.py: Checks for dangerous ops (DROP/DELETE), limits SELECT to table, sanitizes.
  - generate_viz_config(results: Dict, query: str) -> List[Dict], backend/app/services/sql_generator.py: Uses Gemini to suggest chart types/configs based on results (e.g., bar for categoricals, line for time series).
  - create_dynamic_table(schema: DynamicTableSchema) -> str, backend/app/utils/database.py: Creates SQL table with dynamic columns, returns table_name.
  - insert_to_dynamic_table(df: pd.DataFrame, table_name: str), backend/app/utils/database.py: Inserts cleaned data, handles type mapping.
  - execute_safe_sql(sql: str, table_name: str) -> Dict[str, Any], backend/app/utils/database.py: Executes SELECT, returns rows/columns/count.
  - handleDragDrop(files: FileList), frontend/src/components/DragDropUpload.tsx: Validates Excel files, calls apiService.uploadFile, shows progress.
  - renderVisualization(viz: VizConfig), frontend/src/components/QueryResultsViz.tsx: Renders Recharts component based on type (BarChart, LineChart, PieChart, Table).
  - displayCleaningReport(metadata: CleaningMetadata), frontend/src/components/DataCleaningReport.tsx: Shows steps, issues, score with MUI components.

- Modified functions (exact name, current file path, required changes):
  - process_excel_file(file_path: str) -> Dict, backend/app/services/excel_processor.py: Update to handle multi-sheet (pd.read_excel(sheet_name=None)), call clean_data per sheet, infer schema from cleaned DF, return {sheets: Dict[str, Dict]} with metadata.
  - upload_file(file: UploadFile, db: Session), backend/main.py: After saving file, call excel_processor.process_excel_file, create dynamic table per main sheet or all, update UploadedFile with table_name and metadata; Add error handling for large files (>50MB).
  - analyze_dataframe(df_info: Dict), backend/app/services/gemini_service.py: Rename to execute_ai_query(request: AIQueryRequest), integrate sql_generator.generate_sql_query, execute_safe_sql, generate_viz_config, _generate_explanation, _check_data_quality.
  - uploadFile(file: File): Promise<UploadResponse>, frontend/src/services/apiService.ts: Update response handling for new fields.
  - chatMutation in ChatInterface, frontend/src/components/ChatInterface.tsx: Change to use generateSQL, then executeSQL if sqlQuery present, update message with full AIQueryResponse.

- Removed functions (name, file path, reason, migration strategy): None; All existing functions are extended.

[Classes]
Class modifications will enhance models for dynamic data and add new service classes.

Detailed breakdown:
- New classes (name, file path, key methods, inheritance):
  - DataCleaner, backend/app/services/data_cleaner.py, key methods: clean(), _rename_unnamed_columns(), _handle_missing_values(), _standardize_data_types(), _remove_duplicates(); No inheritance.
  - SQLGenerator, backend/app/services/sql_generator.py, key methods: generate_query(), validate_sql(), generate_visualization_config(); Uses Gemini client.
  - AIRouter = APIRouter(prefix="/ai"), backend/app/routers/ai.py, key methods: post("/generate-sql"), post("/execute-sql"); Inherits from FastAPI APIRouter.

- Modified classes (exact name, file path, specific modifications):
  - UploadedFile (SQLAlchemy model), backend/app/models/base.py: Add dynamic_table_name: Column(String, nullable=True), cleaning_metadata: Column(JSON, nullable=True); Add __repr__ for debugging.
  - ExcelProcessor, backend/app/services/excel_processor.py: Add multi_sheet_support: bool = True in __init__, update process_excel_file to return sheet-specific metadata.
  - GeminiService (implicit), backend/app/services/gemini_service.py: Add methods for SQL generation and quality checks.

- Removed classes (name, file path, replacement strategy): None.

[Dependencies]
Dependency modifications include adding frontend viz libraries and backend NLP tools, with version pins for compatibility.

Details of new packages, version changes, and integration requirements:
- Backend (backend/requirements.txt updates):
  - Add nltk==3.8.1 (already present, ensure download on init), python-dateutil==2.8.2 for date standardization.
  - Version change: numpy==1.26.4 (for Python 3.12 compatibility).
  - Integration: In data_cleaner.py, import nltk for text stemming if needed; Ensure psycopg2-binary for PostgreSQL switch.

- Frontend (frontend/package.json updates):
  - New: "recharts": "^2.8.0" for dynamic charts, "@types/recharts": "^1.8.0" for TS.
  - Integration: Import in QueryResultsViz.tsx; npm install after update.

No version downgrades; All new deps are non-breaking.

[Testing]
The testing approach includes unit tests for backend services (cleaning, SQL gen), integration tests for API endpoints, and frontend component tests for upload/viz rendering, with e2e for full flow.

Test file requirements:
- backend/tests/test_data_cleaner.py: Unit tests for cleaning methods (e.g., test_handle_missing_values with sample DF).
- backend/tests/test_sql_generator.py: Mock Gemini, test NL to SQL conversion and validation.
- backend/tests/test_api.py: Pytest for /upload (multi-sheet, dirty data), /generate-sql, /execute-sql using TestClient.
- frontend/src/components/__tests__/DragDropUpload.test.tsx: React Testing Library for drag events, file validation.
- frontend/src/components/__tests__/QueryResultsViz.test.tsx: Snapshot tests for chart rendering.
- e2e/cypress/integration/dashboard.spec.js: Cypress for upload -> query -> viz flow.

Existing test modifications:
- test_backend.py: Expand to cover new endpoints/services, add fixtures for sample Excel files.
- frontend/src/App.test.tsx: Add tests for Dashboard three-column layout with mock data.

Validation strategies:
- Backend: Pytest coverage >80%, mock DB with SQLite in-memory, assert cleaned data shapes/issues.
- Frontend: Jest coverage >70%, mock API responses, visual regression with Storybook for viz.
- E2E: Test dirty data scenarios (missing cols, duplicates), vague queries (e.g., "top products"), error cases (invalid SQL, no file).
- Manual: Browser testing for drag-drop on Chrome/Firefox, responsive layout.

[Implementation Order]
The implementation sequence starts with backend data handling, then AI integration, frontend updates, and finally testing/integration.

1. Update backend/requirements.txt with numpy fix, run pip install in backend/venv.
2. Implement backend/app/services/data_cleaner.py and integrate into excel_processor.py for multi-sheet cleaning.
3. Enhance backend/app/utils/database.py with dynamic table creation/insert/execute functions.
4. Create backend/app/services/sql_generator.py and update gemini_service.py for AI query flow.
5. Add backend/app/routers/ai.py and update backend/main.py with new endpoints and /upload enhancements.
6. Update backend/app/models/base.py and schemas.py with new fields/models.
7. Create frontend/src/components/DragDropUpload.tsx and integrate into FileUploadModal.tsx.
8. Update frontend/src/services/apiService.ts with new methods/interfaces.
9. Enhance frontend/src/components/ChatInterface.tsx for AI responses, SQL display, and QueryResultsViz integration.
10. Create frontend/src/components/QueryResultsViz.tsx and DataCleaningReport.tsx, integrate into PlaygroundArea.tsx and ToolsPanel.tsx.
11. Update frontend/package.json, run npm install, and verify three-column layout in Dashboard.tsx/App.tsx.
12. Add tests as specified, run pytest and npm test.
13. Manual e2e testing: Start backend/frontend, upload sample dirty Excel, query via chat, verify viz/explanation.
14. Documentation updates in docs/USER_GUIDE.md and API.md.
