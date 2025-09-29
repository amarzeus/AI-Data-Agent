# AI Data Agent Documentation

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [User Guide](#user-guide)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

The AI Data Agent is a modern, AI-powered platform that revolutionizes how users interact with Excel data. Instead of complex formulas and manual analysis, users can simply upload their Excel files and ask natural language questions about their data.

### 🤖 AI-Powered Analysis

At the heart of the platform is Google Gemini AI integration that understands natural language queries and provides intelligent insights, statistical analysis, and actionable recommendations.

### 🎨 Modern Interface

The platform features a professional, responsive interface built with React and Material-UI, providing an intuitive experience across all devices.

### 📊 Dynamic Data Processing

The system automatically adapts to any Excel file structure, creating dynamic database schemas and handling various data types, formats, and quality issues.

## ✨ Features

### Core Functionality
- **Excel File Upload**: Drag-and-drop interface supporting .xlsx and .xls files
- **Natural Language Queries**: Ask questions in plain English about your data
- **AI-Powered Insights**: Google Gemini AI provides analysis and recommendations
- **Interactive Visualizations**: Multiple chart types with export capabilities
- **Pivot Tables**: Dynamic data summarization and analysis
- **Real-time Processing**: Fast data analysis with progress indicators

### Advanced Features
- **Dynamic Schema Creation**: Automatically adapts to any Excel structure
- **Data Quality Analysis**: Identifies and reports data quality issues
- **Multiple Chart Types**: Bar, line, area, pie, scatter, and histogram charts
- **Export Options**: PNG, SVG, and CSV export functionality
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Professional UI**: Modern Material-UI design with custom theming

### Technical Features
- **Type Safety**: Full TypeScript implementation
- **Database Flexibility**: PostgreSQL and SQLite support
- **Modular Architecture**: Easy to extend and maintain
- **Error Handling**: Comprehensive error management and user feedback
- **Performance Optimized**: Efficient data processing and rendering

## 🏗️ Architecture

### System Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│◄──►│  FastAPI Backend│◄──►│ Google Gemini AI│
│                 │    │                 │    │                 │
│ - Material-UI   │    │ - SQLAlchemy    │    │ - Natural       │
│ - TypeScript    │    │ - Pandas        │    │   Language      │
│ - Recharts      │    │ - Dynamic DB    │    │   Processing    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Database      │
                       │ - Dynamic Tables│
                       │ - Metadata      │
                       │ - Quality Data  │
                       └─────────────────┘
```

### Technology Stack

#### Frontend
- **React 18.2.0**: Modern React with hooks and concurrent features
- **TypeScript**: Type-safe development
- **Material-UI**: Professional component library
- **Recharts**: Powerful charting library
- **React Dropzone**: File upload with drag-and-drop
- **React Hot Toast**: Beautiful notifications

#### Backend
- **Python 3.12**: Modern Python runtime
- **FastAPI**: High-performance async web framework
- **SQLAlchemy**: Powerful ORM with dynamic schema support
- **Pandas**: Data manipulation and analysis
- **Google Generative AI**: AI-powered query processing
- **OpenPyXL**: Excel file processing

#### Database
- **PostgreSQL**: Primary database (recommended for production)
- **SQLite**: Development and testing database
- **Dynamic Schema**: Automatic table creation based on Excel structure

### Data Flow Architecture

1. **File Upload**: User uploads Excel file via drag-and-drop interface
2. **File Processing**: Backend validates and processes Excel file using Pandas
3. **Schema Creation**: Dynamic database tables created based on Excel structure
4. **Data Storage**: Processed data stored in database with metadata
5. **AI Analysis**: Google Gemini AI analyzes data based on user queries
6. **Visualization**: Frontend renders interactive charts and tables
7. **Export**: Users can export results in multiple formats

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- Python 3.12+
- Google Gemini API key

### One-Command Setup

```bash
git clone <repository-url>
cd ai-data-agent
./setup.sh  # Automated setup script
```

### Manual Setup

```bash
# Backend setup
cd backend
python3.12 -m venv venv
source venv/bin/activate  # On Windows: venv\\Scripts\\activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys

# Frontend setup
cd frontend
npm install
cp .env.example .env.local
# Edit .env.local with API URLs

# Run applications
# Terminal 1 - Backend
cd backend && ./venv/bin/python main.py

# Terminal 2 - Frontend
cd frontend && npm start
```

## 📦 Installation

### Backend Installation

1. **Create Virtual Environment**
   ```bash
   cd backend
   python3.12 -m venv venv
   source venv/bin/activate  # On Windows: venv\\Scripts\\activate
   ```

2. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your configuration:
   ```env
   # Database
   DATABASE_URL=postgresql://username:password@localhost/ai_data_agent

   # Google Gemini AI
   GOOGLE_API_KEY=your_gemini_api_key_here

   # Server Configuration
   HOST=0.0.0.0
   PORT=8000
   ```

4. **Database Initialization**
   ```bash
   # Tables are created automatically on startup
   ./venv/bin/python main.py
   ```

### Frontend Installation

1. **Install Dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env.local
   ```

   Edit `.env.local`:
   ```env
   REACT_APP_API_URL=http://localhost:8000
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# API Configuration
HOST=0.0.0.0
PORT=8000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost/ai_data_agent
# For development:
# DATABASE_URL=sqlite:///./ai_data_agent.db

# Google Gemini AI
GOOGLE_API_KEY=your_api_key_here

# File Upload
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=uploads

# CORS
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

#### Frontend (.env.local)
```env
REACT_APP_API_URL=http://localhost:8000
```

### Database Configuration

#### PostgreSQL Setup (Production)
```sql
-- Create database
CREATE DATABASE ai_data_agent;

-- Create user
CREATE USER ai_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE ai_data_agent TO ai_user;

-- Tables are created automatically by SQLAlchemy
```

#### SQLite Setup (Development)
```bash
# SQLite database file is created automatically
# Location: backend/ai_data_agent.db
```

## 📚 API Documentation

### Base URL
```
http://localhost:8000
```

### Authentication
Currently, no authentication is required. API keys are configured via environment variables.

### Endpoints

#### File Management

##### Upload File
```http
POST /upload
Content-Type: multipart/form-data

Body: file=<excel_file>
```

**Response:**
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
  "status": "success"
}
```

##### List Files
```http
GET /files?skip=0&limit=100
```

**Response:**
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

##### Get File Details
```http
GET /files/{file_id}
```

##### Get File Preview
```http
GET /files/{file_id}/preview?rows=10
```

##### Delete File
```http
DELETE /files/{file_id}
```

#### AI Query Processing

##### Process Query
```http
POST /query
Content-Type: application/json

{
  "query": "What were our top-selling products last quarter?",
  "file_id": 1
}
```

**Response:**
```json
{
  "query_id": 1,
  "query": "What were our top-selling products last quarter?",
  "response": "Based on your data, Product A had the highest sales...",
  "insights": [
    "Product A: $45,000 (35% of total)",
    "Product B: $32,000 (25% of total)",
    "Product C: $28,000 (22% of total)"
  ],
  "recommendations": [
    "Consider increasing inventory for Product A",
    "Review pricing strategy for Product C"
  ],
  "suggested_visualization": "bar_chart",
  "status": "completed",
  "execution_time_ms": 1250
}
```

### Error Handling

All endpoints return appropriate HTTP status codes and error messages:

```json
{
  "detail": "Error description",
  "error_code": "ERROR_CODE"
}
```

Common status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found
- `422`: Validation Error
- `500`: Internal Server Error

## 👥 User Guide

### Getting Started

1. **Upload Your Data**
   - Click and drag Excel files into the upload area
   - Or click to browse and select files
   - Supported formats: .xlsx, .xls
   - Maximum file size: 50MB

2. **Ask Questions**
   - Type natural language questions in the chat interface
   - Examples:
     - "What were our top-selling products last quarter?"
     - "Show me the revenue trend over the past year"
     - "Compare sales performance between regions"

3. **Explore Results**
   - View AI-generated insights and analysis
   - Create interactive visualizations
   - Export results for reporting

### Using Visualizations

#### Chart Types
- **Bar Chart**: Compare values across categories
- **Line Chart**: Show trends over time
- **Area Chart**: Display cumulative data
- **Pie Chart**: Show proportions and percentages
- **Scatter Plot**: Explore relationships between variables
- **Histogram**: Understand data distribution

#### Customization Options
- Change chart types with one click
- Select different columns for X and Y axes
- Adjust aggregation methods (sum, average, count, etc.)
- Toggle legends and grid lines
- Customize colors and styling

### Export Options

- **PNG/SVG**: Export charts as images
- **CSV**: Export data tables
- **Copy**: Copy visualizations to clipboard

## 💻 Development

### Project Structure

```
ai-data-agent/
├── backend/                 # Python FastAPI application
│   ├── app/
│   │   ├── core/           # Configuration and settings
│   │   ├── models/         # Database models and schemas
│   │   ├── routers/        # API route handlers
│   │   ├── services/       # Business logic services
│   │   └── utils/          # Utility functions
│   ├── main.py             # Application entry point
│   ├── requirements.txt     # Python dependencies
│   └── uploads/            # File upload directory
├── frontend/               # React TypeScript application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── services/       # API services
│   │   └── App.tsx         # Main application
│   ├── package.json        # Node.js dependencies
│   └── tsconfig.json       # TypeScript configuration
└── docs/                   # Documentation
```

### Development Workflow

1. **Start Backend**
   ```bash
   cd backend
   source venv/bin/activate
   python main.py
   ```

2. **Start Frontend**
   ```bash
   cd frontend
   npm start
   ```

3. **Access Application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Code Style

#### Python
- Follow PEP 8 guidelines
- Use type hints for all functions
- Maximum line length: 88 characters
- Use descriptive variable names

#### TypeScript/React
- Use functional components with hooks
- Follow ESLint configuration
- Use meaningful component names
- Implement proper error boundaries

### Testing

#### Backend Testing
```bash
cd backend
./venv/bin/python -m pytest
```

#### Frontend Testing
```bash
cd frontend
npm test
```

#### Manual Testing Checklist
- [ ] File upload with different Excel formats
- [ ] Natural language query processing
- [ ] Chart generation and customization
- [ ] Export functionality
- [ ] Responsive design on different devices
- [ ] Error handling for invalid inputs

## 🚢 Deployment

### Production Deployment

#### Backend Deployment

1. **Environment Setup**
   ```bash
   # Production environment variables
   HOST=0.0.0.0
   PORT=8000
   DATABASE_URL=postgresql://prod_user:prod_pass@prod_host/prod_db
   LOG_LEVEL=WARNING
   ```

2. **Database Setup**
   ```sql
   -- Production PostgreSQL setup
   CREATE DATABASE ai_data_agent_prod;
   CREATE USER prod_user WITH PASSWORD 'secure_password';
   GRANT ALL PRIVILEGES ON DATABASE ai_data_agent_prod TO prod_user;
   ```

3. **Server Deployment**
   ```bash
   # Using uvicorn for production
   ./venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
   ```

#### Frontend Deployment

1. **Build Production Bundle**
   ```bash
   npm run build
   ```

2. **Serve Static Files**
   ```bash
   # Using serve
   npx serve -s build -l 3000

   # Or using nginx
   # Configure nginx to serve the build directory
   ```

### Docker Deployment

#### Docker Compose (Recommended)

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/ai_data_agent
    depends_on:
      - db
    volumes:
      - ./uploads:/app/uploads

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - REACT_APP_API_URL=http://localhost:8000

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=ai_data_agent
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### Docker Build

```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
```

### Cloud Deployment

#### AWS Deployment
- **Backend**: ECS Fargate or EC2
- **Frontend**: S3 + CloudFront
- **Database**: RDS PostgreSQL
- **File Storage**: S3 for uploaded files

#### Google Cloud Deployment
- **Backend**: Cloud Run or Compute Engine
- **Frontend**: Cloud Storage + Load Balancer
- **Database**: Cloud SQL PostgreSQL
- **AI Services**: Google Gemini API (already configured)

#### Azure Deployment
- **Backend**: Container Instances or App Service
- **Frontend**: Blob Storage + CDN
- **Database**: Azure Database for PostgreSQL

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues

**Database Connection Failed**
```bash
# Check database connectivity
./venv/bin/python -c "from app.core.config import engine; engine.connect()"

# Verify DATABASE_URL format
echo $DATABASE_URL
```

**File Upload Issues**
```bash
# Check upload directory permissions
ls -la uploads/

# Verify file size limits
# Check MAX_FILE_SIZE_MB in .env
```

**AI API Issues**
```bash
# Verify API key
echo $GOOGLE_API_KEY

# Test API connectivity
curl -H "Content-Type: application/json" \
     -d '{"query": "test"}' \
     http://localhost:8000/query
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

**Runtime Errors**
```bash
# Check browser console for errors
# Verify API URL configuration
# Check network connectivity to backend
```

**Styling Issues**
```bash
# Clear browser cache
# Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
# Check if CSS files are loading
```

### Performance Issues

**Slow File Processing**
- Check available memory and CPU
- Consider processing large files in background
- Optimize Excel reading with pandas settings

**Slow AI Responses**
- Verify internet connectivity
- Check Google Gemini API quotas
- Consider response caching for frequent queries

**Database Performance**
- Add appropriate indexes
- Consider database connection pooling
- Optimize query performance

### Logs and Debugging

#### Backend Logs
```bash
# View application logs
./venv/bin/python main.py  # Check console output

# Configure log level
export LOG_LEVEL=DEBUG
```

#### Frontend Logs
- Open browser developer tools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for API request/response

#### Database Logs
```sql
-- Enable query logging (development only)
SET log_statement = 'all';
```

## 🤝 Contributing

### Development Setup

1. **Fork the Repository**
   ```bash
   git clone https://github.com/your-username/ai-data-agent.git
   cd ai-data-agent
   ```

2. **Create Development Environment**
   ```bash
   # Backend
   cd backend
   python3 -m venv venv-dev
   source venv-dev/bin/activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt  # Development dependencies

   # Frontend
   cd frontend
   npm install
   ```

3. **Run Tests**
   ```bash
   # Backend tests
   cd backend && ./venv-dev/bin/pytest

   # Frontend tests
   cd frontend && npm test
   ```

### Code Standards

#### Python
- Follow PEP 8 style guide
- Use type hints for all functions
- Write docstrings for all modules, classes, and functions
- Maximum line length: 88 characters
- Use descriptive variable and function names

#### TypeScript/React
- Use functional components with hooks
- Follow ESLint and Prettier configurations
- Write JSDoc comments for complex functions
- Use meaningful component and variable names
- Implement proper error boundaries

#### Git Commit Messages
```
feat: add new AI query processing feature
fix: resolve file upload validation issue
docs: update API documentation
test: add unit tests for Excel processor
refactor: optimize database queries
```

### Pull Request Process

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

2. **Make Changes**
   - Follow code standards
   - Add tests for new functionality
   - Update documentation

3. **Run Tests**
   ```bash
   # Backend
   cd backend && ./venv/bin/pytest

   # Frontend
   cd frontend && npm test
   ```

4. **Submit Pull Request**
   - Provide clear description of changes
   - Reference related issues
   - Include screenshots for UI changes

### Adding New Features

#### Backend Features
1. Create new service in `app/services/`
2. Add API endpoints in `app/routers/`
3. Update database models if needed
4. Add comprehensive tests
5. Update API documentation

#### Frontend Features
1. Create new components in `src/components/`
2. Add API service methods in `src/services/`
3. Update TypeScript interfaces
4. Add unit tests
5. Update user documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** for powering natural language processing
- **Material-UI** for the beautiful component library
- **Recharts** for the powerful charting capabilities
- **FastAPI** for the high-performance backend framework
- **Pandas** for data manipulation and analysis

## 📞 Support

### Getting Help

- **Documentation**: Check this comprehensive guide
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community discussions
- **Email**: Contact the development team

### Reporting Bugs

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, versions
6. **Screenshots**: Visual evidence if applicable
7. **Logs**: Relevant error messages

### Feature Requests

Feature requests are welcome! Please provide:

1. **Use Case**: Describe the problem you're trying to solve
2. **Proposed Solution**: How you think it should work
3. **Alternatives**: Other solutions you've considered
4. **Additional Context**: Screenshots, examples, or references

---

**Built with ❤️ using modern web technologies and AI**