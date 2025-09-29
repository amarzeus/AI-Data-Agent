# Installation Guide

## 📋 Complete Installation Guide for AI Data Agent

This comprehensive guide covers all aspects of installing and configuring the AI Data Agent platform, from initial setup to production deployment.

## 🎯 Quick Reference

| Component | Time Estimate | Difficulty | Prerequisites |
|-----------|---------------|------------|---------------|
| **Backend** | 5-10 minutes | Easy | Python 3.12+, Google API Key |
| **Frontend** | 3-5 minutes | Easy | Node.js 16+ |
| **Database** | 2-5 minutes | Easy | SQLite (dev) or PostgreSQL (prod) |
| **Production** | 15-30 minutes | Medium | Docker, cloud platform |

## 1. Prerequisites

### System Requirements

#### Minimum Specifications
- **Operating System**: Linux (Ubuntu 20.04+), macOS (10.15+), or Windows 10+
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 2GB free space
- **Network**: Internet connection for API calls

#### Software Dependencies

##### Required
- **Python 3.12+** - Core backend runtime
- **Node.js 16+** - Frontend development and runtime
- **Git** - Version control and cloning
- **Google Gemini API Key** - AI functionality

##### Optional (Enhanced Features)
- **PostgreSQL 13+** - Production database
- **Redis 6+** - Caching and session management
- **Docker & Docker Compose** - Containerized deployment

### API Key Setup

#### Google Gemini AI API Key (Required)

1. **Visit Google AI Studio**
   ```
   https://aistudio.google.com/
   ```

2. **Sign In**
   - Use your Google account
   - Accept terms of service

3. **Create API Key**
   - Click "Create API key" button
   - Choose "Create API key in new project"
   - Copy the generated key

4. **Store Securely**
   ```bash
   # Add to backend/.env file
   echo "GOOGLE_API_KEY=your_api_key_here" >> backend/.env
   ```

   ⚠️ **Security Note**: Never commit API keys to version control.

## 2. Automated Installation

### One-Command Setup (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd ai-data-agent

# Run automated setup
./setup.sh
```

**What the setup script does:**
- ✅ Validates system prerequisites
- 🔧 Creates Python virtual environment
- ⚛️ Installs Node.js dependencies
- 📝 Generates environment configuration files
- 🔐 Prompts for API key configuration
- 🎯 Provides next steps and access URLs

### Verification Steps

After running setup, verify installation:

```bash
# Check backend
cd backend
source venv/bin/activate
python -c "import fastapi; print('✅ FastAPI installed')"

# Check frontend
cd ../frontend
npm --version
node --version
```

## 3. Manual Installation

### Backend Installation

#### Step 1: Environment Setup
```bash
cd backend

# Create virtual environment
python3 -m venv venv

# Activate environment
source venv/bin/activate  # Linux/macOS
# venv\Scripts\activate   # Windows
```

#### Step 2: Dependency Installation
```bash
# Upgrade pip
pip install --upgrade pip

# Install core dependencies
pip install -r requirements.txt

# Verify installation
pip list | grep fastapi
pip list | grep pandas
```

#### Step 3: Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit configuration
nano .env  # or your preferred editor
```

**Required Environment Variables:**
```env
# API Configuration
HOST=0.0.0.0
PORT=8000

# Database (SQLite for development)
DATABASE_URL=sqlite:///./ai_data_agent.db

# Google Gemini AI (Required)
GOOGLE_API_KEY=your_gemini_api_key_here

# File Upload
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=uploads

# CORS
FRONTEND_URL=http://localhost:3000
```

#### Step 4: Database Initialization
```bash
# Database tables are created automatically on first run
# Test database connection
python -c "from app.core.config import engine; print('Database connected successfully')"
```

### Frontend Installation

#### Step 1: Navigate and Install
```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm list --depth=0
```

#### Step 2: Configuration
```bash
# Copy environment template
cp .env.example .env.local

# Edit configuration
nano .env.local
```

**Frontend Environment Variables:**
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:8000
```

#### Step 3: Build Verification
```bash
# Test build process
npm run build

# Verify no TypeScript errors
npx tsc --noEmit
```

## 4. Database Setup

### SQLite (Development - Default)

SQLite is included and configured by default. No additional setup required.

**Database File Location:**
```
backend/ai_data_agent.db
```

**Features:**
- ✅ Zero configuration
- ✅ Single file database
- ✅ Automatic schema creation
- ❌ Not suitable for concurrent production use

### PostgreSQL (Production)

#### Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql

# Start service
sudo systemctl start postgresql  # Linux
brew services start postgresql   # macOS
```

#### Database Creation
```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE ai_data_agent;
CREATE USER ai_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE ai_data_agent TO ai_user;
\q
```

#### Backend Configuration
```env
# Update backend/.env
DATABASE_URL=postgresql://ai_user:secure_password@localhost:5432/ai_data_agent
```

## 5. Development Environment

### IDE Configuration

#### Visual Studio Code
```json
// .vscode/settings.json
{
  "python.defaultInterpreterPath": "backend/venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "typescript.preferences.importModuleSpecifier": "relative"
}
```

#### PyCharm/WebStorm
- Configure Python interpreter: `backend/venv/bin/python`
- Enable TypeScript support
- Configure working directory for frontend

### Development Tools

#### Backend Development
```bash
# Install development dependencies
pip install pytest pytest-asyncio black isort

# Run tests
pytest

# Format code
black app/
isort app/
```

#### Frontend Development
```bash
# Install development tools
npm install --save-dev prettier eslint

# Run linting
npm run lint

# Format code
npm run format
```

## 6. Production Setup

### Environment Variables for Production

```env
# Security
DEBUG=False
SECRET_KEY=your-secret-key-here

# Database
DATABASE_URL=postgresql://prod_user:prod_pass@prod_host:5432/prod_db

# Logging
LOG_LEVEL=WARNING
LOG_FILE=/var/log/ai_data_agent/app.log

# Performance
WORKERS=4
MAX_FILE_SIZE_MB=100
```

### SSL/TLS Configuration

#### Using Let's Encrypt (Recommended)
```bash
# Install certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure in .env
SSL_CERT_FILE=/etc/letsencrypt/live/yourdomain.com/fullchain.pem
SSL_KEY_FILE=/etc/letsencrypt/live/yourdomain.com/privkey.pem
```

## 7. Verification and Testing

### System Health Checks

#### Backend Health Check
```bash
# Test API endpoints
curl http://localhost:8000/health

# Check database connectivity
cd backend && source venv/bin/activate
python -c "from app.core.config import engine; engine.connect(); print('✅ Database OK')"
```

#### Frontend Health Check
```bash
cd frontend

# Test build
npm run build

# Start development server
npm start
# Visit http://localhost:3000
```

### Functionality Testing

#### File Upload Test
1. Start both backend and frontend servers
2. Upload a sample Excel file
3. Verify file processing completes successfully
4. Check database for uploaded file record

#### AI Query Test
1. Ensure Google API key is configured
2. Upload a test file with sample data
3. Ask a natural language question
4. Verify AI response is generated

## 8. Troubleshooting

### Installation Issues

#### "Python module not found"
```bash
# Ensure virtual environment is activated
which python  # Should show venv path
pip install missing-module-name
```

#### "Node module not found"
```bash
# Clear npm cache
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

#### "Permission denied"
```bash
# Make scripts executable
chmod +x setup.sh start.sh

# Fix directory permissions
sudo chown -R $USER:$USER .
```

### Configuration Issues

#### Database Connection Errors
```bash
# Test database connection
python -c "import psycopg2; conn = psycopg2.connect('your_connection_string')"

# Check PostgreSQL service
sudo systemctl status postgresql
```

#### API Key Issues
```bash
# Verify API key format
echo $GOOGLE_API_KEY | head -c 20

# Test API connectivity
curl -H "Authorization: Bearer $GOOGLE_API_KEY" \
     "https://generativelanguage.googleapis.com/v1/models"
```

## 9. Performance Optimization

### Memory Optimization
```bash
# Monitor memory usage
htop

# Optimize Python garbage collection
export PYTHONOPTIMIZE=1
```

### Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_files_created_at ON files(created_at);
CREATE INDEX idx_queries_file_id ON queries(file_id);
```

### Frontend Optimization
```bash
# Enable gzip compression
echo "gzip on;" > nginx.conf

# Optimize React bundle
npm run build -- --prod
```

## 10. Security Considerations

### API Key Security
- Store in environment variables only
- Use different keys for development/production
- Rotate keys regularly
- Monitor API usage

### File Upload Security
- Validate file types and sizes
- Scan uploaded files for malware
- Implement rate limiting
- Use secure file storage

### Network Security
- Use HTTPS in production
- Configure CORS properly
- Implement authentication if needed
- Monitor for suspicious activity

## 11. Backup and Recovery

### Database Backup
```bash
# SQLite backup
cp backend/ai_data_agent.db backend/ai_data_agent.backup.db

# PostgreSQL backup
pg_dump ai_data_agent > ai_data_agent_backup.sql
```

### Configuration Backup
```bash
# Backup environment files
cp backend/.env backend/.env.backup
cp frontend/.env.local frontend/.env.local.backup

# Backup uploaded files
tar -czf uploads_backup.tar.gz backend/uploads/
```

## 12. Updates and Maintenance

### Updating Dependencies
```bash
# Backend
cd backend && source venv/bin/activate
pip install --upgrade -r requirements.txt

# Frontend
cd frontend
npm update
```

### Database Migrations
```bash
# Apply schema changes (if using Alembic)
cd backend && source venv/bin/activate
alembic upgrade head
```

---

## 🎉 Next Steps

After successful installation:

1. **[Start the Application](./README.md#running-the-application)** - Launch both servers
2. **[Upload Test Data](./USER_GUIDE.md#upload-your-data)** - Try with sample files
3. **[Ask AI Questions](./USER_GUIDE.md#ask-questions)** - Test natural language queries
4. **[Explore Features](./USER_GUIDE.md#explore-results)** - Create visualizations and exports

For additional help, check:
- **[Troubleshooting Guide](./README.md#troubleshooting)**
- **[API Documentation](./API.md)**
- **[Development Guide](./DEVELOPMENT.md)**
