# Development Guide

## Project Overview

The AI Data Agent is a full-stack application that combines modern web technologies with AI-powered data analysis. This guide provides comprehensive information for developers who want to contribute to or extend the project.

## 🏗️ Architecture Deep Dive

### Frontend Architecture

#### Component Structure
```
src/
├── components/          # React components
│   ├── Dashboard.tsx    # Main dashboard layout
│   ├── ChatInterface.tsx# AI chat interface
│   ├── DataVisualization.tsx # Charts and graphs
│   ├── FileUpload.tsx   # File upload component
│   ├── FileList.tsx     # File management
│   ├── QueryInterface.tsx # AI query interface
│   └── ToolsPanel.tsx   # Data tools and utilities
├── services/           # API and external services
│   └── apiService.ts   # Backend API communication
├── App.tsx             # Main application component
└── index.tsx           # Application entry point
```

#### State Management
- **React Hooks**: useState, useEffect, useMemo for component state
- **Context API**: Global state for user preferences and file selection
- **Local Storage**: Persistent user settings and preferences

#### Styling Architecture
- **Material-UI**: Base component library with custom theming
- **CSS Modules**: Component-specific styles
- **Responsive Design**: Mobile-first approach with breakpoints

### Backend Architecture

#### Application Structure
```
backend/
├── app/                # Main application package
│   ├── core/          # Configuration and settings
│   │   └── config.py  # Database and app configuration
│   ├── models/        # Database models and schemas
│   │   ├── base.py   # SQLAlchemy models
│   │   └── schemas.py # Pydantic schemas
│   ├── routers/       # API route handlers (future)
│   ├── services/      # Business logic
│   │   ├── excel_processor.py # Excel file processing
│   │   └── gemini_service.py  # AI integration
│   └── utils/         # Utility functions
│       ├── database.py # Dynamic table management
│       └── init_db.py # Database initialization
├── main.py            # FastAPI application
├── requirements.txt   # Python dependencies
└── uploads/           # File upload directory
```

#### Service Layer Architecture
- **Excel Processor**: Handles file parsing and data extraction
- **AI Service**: Manages Google Gemini AI integration
- **Database Manager**: Handles dynamic schema creation
- **File Service**: Manages file operations and storage

### Database Design

#### Dynamic Schema Approach
The system uses a dynamic schema approach that adapts to any Excel file structure:

```sql
-- Core metadata tables (static)
uploaded_files:
- id, filename, file_path, status, metadata

file_sheets:
- id, file_id, sheet_name, table_name, metadata

sheet_columns:
- id, sheet_id, column_name, data_type, metadata

-- Dynamic data tables (created per Excel sheet)
file_1_sheet1_data:
- id, file_id, row_index, col1, col2, col3, ...
```

#### Data Quality Tracking
```sql
data_quality_issues:
- id, file_id, issue_type, severity, description, resolution
```

## 🚀 Development Setup

### Prerequisites

#### System Requirements
- **Node.js**: 16.0.0 or higher
- **Python**: 3.8.0 or higher
- **Git**: Latest version
- **PostgreSQL**: 13.0 or higher (optional, SQLite for development)

#### Development Tools
- **VS Code**: Recommended IDE with extensions
  - ES7+ React/Redux/React-Native snippets
  - Prettier - Code formatter
  - ESLint
  - Python extension
  - Material-UI Snippets

### Environment Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd ai-data-agent
```

#### 2. Backend Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\\Scripts\\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment configuration
cp .env.example .env

# Edit .env with your settings
# Add Google Gemini API key
# Configure database URL
```

#### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Copy environment configuration
cp .env.example .env.local

# Edit .env.local
# REACT_APP_API_URL=http://localhost:8000
```

#### 4. Database Setup
```bash
# Database tables are created automatically on startup
# For development, SQLite is used by default
# For production, configure PostgreSQL in .env
```

### Running Development Servers

#### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
python main.py
# API available at http://localhost:8000
# Swagger docs at http://localhost:8000/docs
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm start
# Application available at http://localhost:3000
```

## 🔧 Development Workflow

### Code Organization

#### Adding New Features

**Backend Feature Development**
1. **Create Service Module**
   ```python
   # backend/app/services/new_feature.py
   class NewFeatureService:
       def __init__(self):
           pass

       def process_data(self, data):
           # Implementation
           pass
   ```

2. **Add API Endpoints**
   ```python
   # backend/main.py
   @app.post("/new-feature")
   async def new_feature_endpoint(request: NewFeatureRequest):
       result = new_feature_service.process_data(request.data)
       return {"result": result}
   ```

3. **Add Database Models (if needed)**
   ```python
   # backend/app/models/base.py
   class NewFeature(Base):
       __tablename__ = "new_features"
       id = Column(Integer, primary_key=True)
       # Add fields
   ```

4. **Add Tests**
   ```python
   # tests/test_new_feature.py
   def test_new_feature():
       # Test implementation
       pass
   ```

**Frontend Feature Development**
1. **Create Component**
   ```typescript
   // frontend/src/components/NewFeature.tsx
   const NewFeature: React.FC = () => {
     return (
       <Box>
         {/* Component implementation */}
       </Box>
     );
   };
   ```

2. **Add API Integration**
   ```typescript
   // frontend/src/services/apiService.ts
   export const newFeatureAPI = {
     async process(data: any) {
       return apiService.request('/new-feature', {
         method: 'POST',
         body: JSON.stringify(data)
       });
     }
   };
   ```

3. **Add to Dashboard**
   ```typescript
   // frontend/src/components/Dashboard.tsx
   import NewFeature from './NewFeature';

   const Dashboard = () => {
     return (
       <Box>
         <NewFeature />
       </Box>
     );
   };
   ```

### Database Migrations

#### Adding New Models
1. **Update Model Definition**
   ```python
   # backend/app/models/base.py
   class NewModel(Base):
       __tablename__ = "new_table"
       id = Column(Integer, primary_key=True)
       name = Column(String(255))
   ```

2. **Create Migration**
   ```bash
   # Using Alembic (when implemented)
   alembic revision --autogenerate -m "Add new model"
   alembic upgrade head
   ```

3. **Update Schemas**
   ```python
   # backend/app/models/schemas.py
   class NewModelResponse(BaseModel):
       id: int
       name: str
   ```

### Testing

#### Backend Testing
```python
# tests/test_excel_processor.py
import pytest
from app.services.excel_processor import excel_processor

def test_excel_processing():
    # Test implementation
    pass

def test_file_validation():
    # Test implementation
    pass
```

#### Frontend Testing
```typescript
// frontend/src/components/__tests__/DataVisualization.test.tsx
import { render, screen } from '@testing-library/react';
import DataVisualization from '../DataVisualization';

test('renders visualization component', () => {
  render(<DataVisualization data={[]} columns={[]} numericColumns={[]} />);
  expect(screen.getByText('Data Visualization')).toBeInTheDocument();
});
```

#### Running Tests
```bash
# Backend
cd backend && ./venv/bin/pytest

# Frontend
cd frontend && npm test

# Coverage
cd frontend && npm test -- --coverage
```

## 🔍 Debugging

### Common Development Issues

#### Backend Issues

**Import Errors**
```bash
# Check Python path
import sys
print(sys.path)

# Verify virtual environment activation
which python  # Should show virtual environment path
```

**Database Connection Issues**
```python
# Test database connection
from app.core.config import engine
try:
    connection = engine.connect()
    print("Database connected successfully")
    connection.close()
except Exception as e:
    print(f"Database connection failed: {e}")
```

**AI API Issues**
```python
# Test Gemini API connection
from app.services.gemini_service import gemini_service
try:
    response = gemini_service.test_connection()
    print("AI service connected")
except Exception as e:
    print(f"AI service error: {e}")
```

#### Frontend Issues

**Build Errors**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix common issues
# - Check import paths
# - Verify type definitions
# - Update @types packages
```

**Runtime Errors**
```javascript
// Check browser console
// Look for:
// - API connection errors
// - Component mounting errors
// - State update issues
```

### Logging

#### Backend Logging
```python
# backend/main.py
import logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)
```

#### Frontend Logging
```typescript
// Use browser console
console.log('Debug information');
console.error('Error details');
```

## 🚀 Performance Optimization

### Frontend Performance

#### Code Splitting
```javascript
// Dynamic imports for route-based splitting
const DataVisualization = lazy(() => import('./components/DataVisualization'));

// Component-based splitting
const HeavyComponent = lazy(() => import('./HeavyComponent'));
```

#### Memoization
```typescript
// Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Component logic */}</div>;
});

// Use useMemo for expensive calculations
const processedData = useMemo(() => {
  return data.map(item => item.value * 2);
}, [data]);
```

#### Image Optimization
```typescript
// Use next-gen image formats
// Implement lazy loading
// Optimize bundle size
```

### Backend Performance

#### Database Optimization
```sql
-- Add appropriate indexes
CREATE INDEX idx_file_status ON uploaded_files(status);
CREATE INDEX idx_file_created ON uploaded_files(created_at);

-- Optimize queries
EXPLAIN ANALYZE SELECT * FROM uploaded_files WHERE status = 'completed';
```

#### Caching
```python
# Implement response caching
from functools import lru_cache

@lru_cache(maxsize=128)
def expensive_operation(data):
    # Implementation
    pass
```

#### Async Processing
```python
# Use background tasks for heavy operations
from fastapi import BackgroundTasks

@app.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    # Immediate response
    background_tasks.add_task(process_file_heavy, file)
    return {"message": "File uploaded, processing in background"}
```

## 🔒 Security Considerations

### File Upload Security
```python
# backend/main.py
from fastapi import File, UploadFile, HTTPException
import magic  # For file type detection

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    # Validate file type
    if not file.filename.endswith(('.xlsx', '.xls')):
        raise HTTPException(400, "Invalid file type")

    # Check file size
    if file.size > MAX_FILE_SIZE:
        raise HTTPException(400, "File too large")

    # Validate file content
    content = await file.read()
    if not is_valid_excel(content):
        raise HTTPException(400, "Invalid Excel file")
```

### API Security
```python
# Rate limiting (future implementation)
from slowapi import Limiter, _rate_limit_exceeded

limiter = Limiter(key_func=get_remote_address)

@app.post("/query")
@limiter.limit("10/minute")
async def process_query(request: QueryRequest):
    # Implementation
    pass
```

### Data Protection
- Files stored with unique identifiers
- Automatic cleanup of old files
- No permanent storage of sensitive data
- Secure database configuration

## 📦 Deployment

### Development Deployment
```bash
# Using Docker Compose (recommended)
docker-compose -f docker-compose.dev.yml up

# Manual deployment
# Terminal 1
cd backend && ./venv/bin/python main.py

# Terminal 2
cd frontend && npm run build && npm run start
```

### Production Deployment

#### Using Docker
```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  backend:
    image: ai-playground-backend:latest
    environment:
      - DATABASE_URL=postgresql://prod:prod@db:5432/prod
    deploy:
      replicas: 3

  frontend:
    image: ai-playground-frontend:latest
    deploy:
      replicas: 2

  db:
    image: postgres:15
    volumes:
      - postgres_prod:/var/lib/postgresql/data
```

#### Environment Variables
```env
# Production .env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
GOOGLE_API_KEY=your_prod_key
JWT_SECRET=your_jwt_secret
```

## 🧪 Testing Strategy

### Unit Tests
```python
# Backend unit test
def test_excel_processor():
    processor = ExcelProcessor()
    result = processor.validate_excel_file("test.xlsx")
    assert result["is_valid"] == True
```

### Integration Tests
```python
# Test API endpoints
def test_upload_endpoint():
    response = client.post("/upload", files={"file": "test.xlsx"})
    assert response.status_code == 200
```

### End-to-End Tests
```typescript
// Frontend E2E test
test('complete user journey', async () => {
  // Upload file
  // Ask question
  // Verify response
  // Check visualization
});
```

## 📚 Code Standards

### Python Standards
- **PEP 8**: Code style and formatting
- **Type Hints**: Use for all function parameters and returns
- **Docstrings**: Google/Sphinx style for all modules
- **Line Length**: 88 characters maximum
- **Imports**: Group standard library, third-party, local imports

### TypeScript Standards
- **ESLint**: Follow project ESLint configuration
- **Prettier**: Code formatting
- **Interfaces**: Define for all data structures
- **Error Handling**: Proper try-catch with typed errors

### Git Standards
- **Branch Naming**: feature/feature-name, fix/bug-name, docs/update
- **Commit Messages**: Clear, descriptive messages
- **Pull Requests**: Detailed descriptions with screenshots

## 🔧 Tool Configuration

### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

### ESLint Configuration
```json
{
  "extends": ["react-app", "react-app/jest"],
  "rules": {
    "no-console": "warn",
    "no-debugger": "error"
  }
}
```

### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true
}
```

## 🚨 Error Handling

### Backend Error Handling
```python
# backend/main.py
from fastapi import HTTPException
from fastapi.responses import JSONResponse

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error_code": "INTERNAL_ERROR"}
    )
```

### Frontend Error Handling
```typescript
// frontend/src/services/apiService.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const handleApiError = (error: any): ApiError => {
  if (error.response) {
    return new ApiError(error.response.status, error.response.data.detail);
  }
  return new ApiError(500, 'Network error');
};
```

## 📊 Monitoring and Analytics

### Application Monitoring
```python
# Backend monitoring
from prometheus_client import Counter, Histogram

request_count = Counter('requests_total', 'Total requests', ['method', 'endpoint'])
request_duration = Histogram('request_duration_seconds', 'Request duration')

@app.middleware("http")
async def monitor_requests(request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time

    request_count.labels(method=request.method, endpoint=request.url.path).inc()
    request_duration.observe(process_time)

    return response
```

### Error Tracking
```typescript
// Frontend error tracking
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-sentry-dsn',
  environment: process.env.NODE_ENV
});
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup Python
        uses: actions/setup-python@v2
        with:
          python-version: '3.9'
      - name: Install dependencies
        run: |
          cd backend && pip install -r requirements.txt
          cd ../frontend && npm install
      - name: Run tests
        run: |
          cd backend && pytest
          cd ../frontend && npm test
```

## 🤝 Contributing

### Getting Started
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

### Contribution Guidelines
- Follow existing code style
- Add tests for new features
- Update documentation
- Ensure all tests pass
- Use meaningful commit messages

### Code Review Process
- All submissions require review
- Maintainers will provide feedback
- Address review comments
- Squash commits before merging

## 📞 Support

### Development Support
- **Issues**: Use GitHub issues for bug reports
- **Discussions**: Use GitHub discussions for questions
- **Email**: Contact maintainers for sensitive issues

### Resources
- **Documentation**: This comprehensive guide
- **API Reference**: Swagger documentation at /docs
- **Community**: Join discussions with other developers

---

**Happy Coding! 🚀**

This development guide provides everything you need to contribute to and extend the AI Data Agent. The project is designed to be maintainable, scalable, and developer-friendly.