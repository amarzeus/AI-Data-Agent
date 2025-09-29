# Troubleshooting Guide

## 🔧 Complete Troubleshooting Guide for AI Data Agent

This comprehensive guide covers common issues, error messages, and solutions for the AI Data Agent platform.

## 📋 Quick Reference

| Issue Category | Common Symptoms | Quick Fix |
|----------------|----------------|-----------|
| **Installation** | "Module not found", "Permission denied" | Check prerequisites, use virtual environment |
| **Database** | "Connection failed", "Table not found" | Verify credentials, check database status |
| **API Keys** | "Unauthorized", "Invalid API key" | Check key format, verify quotas |
| **File Upload** | "File too large", "Invalid format" | Check file size limits, format requirements |
| **Performance** | "Slow responses", "Timeout errors" | Check system resources, optimize queries |
| **Frontend** | "Build errors", "Runtime errors" | Clear cache, reinstall dependencies |

## 1. Installation Issues

### ❌ "Python not found" or "python3: command not found"

**Symptoms:**
- Setup script fails
- Cannot create virtual environment

**Solutions:**

#### Check Python Installation
```bash
# Check if Python is installed
python3 --version
which python3

# If not found, install Python
# Ubuntu/Debian
sudo apt update
sudo apt install python3.12 python3.12-venv python3.12-dev

# CentOS/RHEL
sudo yum install python3.12 python3.12-pip

# macOS
brew install python@3.12
```

#### Alternative Python Versions
```bash
# If Python 3.12 is not available, use available version
python3.10 --version
python3.11 --version

# Update requirements.txt to use available version
sed -i 's/python3.12/python3.10/g' requirements.txt
```

### ❌ "Node.js not found" or "npm: command not found"

**Symptoms:**
- Frontend setup fails
- Cannot install npm dependencies

**Solutions:**

#### Install Node.js
```bash
# Using NodeSource (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Using NVM (alternative)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18
```

#### Verify Installation
```bash
node --version  # Should show v18.x.x
npm --version   # Should show 8.x.x or 9.x.x
```

### ❌ "Permission denied" when running scripts

**Symptoms:**
- Cannot execute setup.sh or start.sh
- "bash: ./setup.sh: Permission denied"

**Solutions:**
```bash
# Make scripts executable
chmod +x setup.sh start.sh

# If still failing, check ownership
ls -la setup.sh
sudo chown $USER:$USER setup.sh start.sh
```

### ❌ Backend dependency installation fails

**Symptoms:**
- "pip install -r requirements.txt" fails
- Module compilation errors

**Solutions:**

#### Upgrade pip
```bash
python3 -m pip install --upgrade pip
```

#### Install system dependencies
```bash
# Ubuntu/Debian
sudo apt install build-essential python3-dev

# CentOS/RHEL
sudo yum groupinstall "Development Tools"
sudo yum install python3-devel
```

#### Clear pip cache
```bash
pip cache purge
rm -rf ~/.cache/pip
```

#### Install specific versions
```bash
# Install core dependencies first
pip install fastapi==0.104.1 uvicorn==0.24.0 sqlalchemy==2.0.23

# Then install the rest
pip install -r requirements.txt
```

### ❌ Frontend npm install fails

**Symptoms:**
- "npm install" hangs or fails
- Node-sass compilation errors

**Solutions:**

#### Clear npm cache
```bash
npm cache clean --force
```

#### Delete and reinstall
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### Use alternative registry
```bash
npm config set registry https://registry.npmjs.org/
npm install
```

## 2. Configuration Issues

### ❌ "Environment variable not found"

**Symptoms:**
- Backend fails to start
- "KeyError: 'GOOGLE_API_KEY'"

**Solutions:**

#### Check environment file exists
```bash
ls -la backend/.env
ls -la frontend/.env.local
```

#### Verify environment variables
```bash
cd backend
cat .env | grep GOOGLE_API_KEY
echo $GOOGLE_API_KEY  # Should show your key
```

#### Recreate environment files
```bash
cd backend
cp .env.example .env
nano .env  # Add your API key

cd ../frontend
cp .env.example .env.local
nano .env.local  # Update API URL
```

### ❌ Database connection failed

**Symptoms:**
- Backend fails to start
- "Connection refused" or "authentication failed"

**Solutions:**

#### SQLite Issues (Development)
```bash
# Check database file
ls -la backend/ai_data_agent.db

# Check permissions
chmod 644 backend/ai_data_agent.db

# Test connection
cd backend && source venv/bin/activate
python -c "from app.core.config import engine; engine.connect(); print('Connected!')"
```

#### PostgreSQL Issues (Production)
```bash
# Check PostgreSQL service
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Check connection
psql -h localhost -U ai_user -d ai_data_agent

# Test from Python
cd backend && source venv/bin/activate
python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.getenv('DATABASE_URL'))
try:
    engine.connect()
    print('Database connection successful!')
except Exception as e:
    print(f'Connection failed: {e}')
"
```

### ❌ Google Gemini API key issues

**Symptoms:**
- AI queries return errors
- "Invalid API key" or "quota exceeded"

**Solutions:**

#### Verify API key format
```bash
# Check key format (should start with 'AIza')
echo $GOOGLE_API_KEY | head -c 20

# Test API connectivity
curl -H "Content-Type: application/json" \
     -H "Authorization: Bearer $GOOGLE_API_KEY" \
     "https://generativelanguage.googleapis.com/v1/models"
```

#### Check API quotas
1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Check your API usage dashboard
3. Verify you haven't exceeded rate limits

#### Get new API key
1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Update `backend/.env`

## 3. Runtime Issues

### ❌ Port already in use

**Symptoms:**
- "Address already in use" error
- Cannot start backend or frontend

**Solutions:**

#### Find used ports
```bash
# Check what's using the ports
lsof -i :3000
lsof -i :8000

# Kill processes using the ports
kill -9 $(lsof -t -i :3000)
kill -9 $(lsof -t -i :8000)
```

#### Use different ports
```bash
# Backend
cd backend && PORT=8001 python main.py

# Frontend
cd frontend && PORT=3001 npm start
```

#### Use enhanced startup script
```bash
./start.sh  # Automatically finds free ports
```

### ❌ File upload fails

**Symptoms:**
- "File too large" error
- "Invalid file format"

**Solutions:**

#### Check file size limits
```bash
# Check configured limit
cd backend && grep MAX_FILE_SIZE_MB .env

# Check upload directory
ls -la uploads/
mkdir -p uploads
chmod 755 uploads
```

#### Verify file format
```bash
# Check file type
file your_file.xlsx
# Should show "Microsoft Excel" or similar

# Check file extension
ls -la your_file.*
```

#### Test with sample file
```bash
# Use the included sample file
ls -la backend/sample_*.xlsx
```

### ❌ AI responses are slow or fail

**Symptoms:**
- Queries timeout
- "Internal server error" on AI requests

**Solutions:**

#### Check internet connectivity
```bash
ping google.com
curl -I https://generativelanguage.googleapis.com
```

#### Verify API key and quotas
```bash
# Check API key is set
cd backend && echo $GOOGLE_API_KEY

# Monitor API usage
# Visit: https://aistudio.google.com/app/apikey
```

#### Test with simple query
```bash
curl -X POST http://localhost:8000/query \
     -H "Content-Type: application/json" \
     -d '{"query": "test", "file_id": 1}'
```

## 4. Performance Issues

### 🐌 Slow file processing

**Symptoms:**
- Large files take very long to process
- System becomes unresponsive

**Solutions:**

#### Check system resources
```bash
# Monitor CPU and memory
htop
free -h

# Check disk space
df -h
```

#### Optimize file processing
```bash
# For large files, consider chunked processing
# Modify backend/app/services/excel_processor.py
# Add chunk_size parameter
```

#### Database optimization
```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM file_data WHERE file_id = 1;

-- Add indexes if needed
CREATE INDEX IF NOT EXISTS idx_file_data_file_id ON file_data(file_id);
```

### 🐌 Slow AI responses

**Symptoms:**
- AI queries take 30+ seconds
- Timeout errors

**Solutions:**

#### Check network latency
```bash
# Test API latency
time curl -s https://generativelanguage.googleapis.com/v1/models

# Check DNS resolution
nslookup generativelanguage.googleapis.com
```

#### Implement response caching
```python
# Add caching to backend
from functools import lru_cache

@lru_cache(maxsize=100)
def get_ai_response(query, context):
    # Cache frequent queries
    pass
```

### 🐌 High memory usage

**Symptoms:**
- System slows down during processing
- Out of memory errors

**Solutions:**

#### Monitor memory usage
```bash
# Real-time monitoring
htop

# Check process memory
ps aux --sort=-%mem | head -10
```

#### Optimize memory usage
```python
# In Python code, use generators for large datasets
def process_large_file(file_path):
    for chunk in pd.read_excel(file_path, chunksize=1000):
        yield process_chunk(chunk)
```

## 5. Frontend Issues

### ❌ Build errors

**Symptoms:**
- "npm run build" fails
- TypeScript compilation errors

**Solutions:**

#### Clear build cache
```bash
cd frontend
rm -rf build node_modules/.cache
npm install
```

#### Check TypeScript configuration
```bash
npx tsc --noEmit
```

#### Update dependencies
```bash
npm update
npm audit fix
```

### ❌ Runtime errors

**Symptoms:**
- White screen after loading
- JavaScript console errors

**Solutions:**

#### Check browser console
1. Open browser DevTools (F12)
2. Check Console tab for errors
3. Check Network tab for failed requests

#### Verify API connectivity
```bash
# Test backend API
curl http://localhost:8000/health

# Check CORS configuration
cd backend && grep FRONTEND_URL .env
```

#### Clear browser cache
```bash
# Hard refresh
Ctrl+Shift+R (Linux/Windows)
Cmd+Shift+R (Mac)
```

### ❌ Styling issues

**Symptoms:**
- Components not displaying correctly
- Missing CSS styles

**Solutions:**

#### Check CSS loading
```bash
# In browser DevTools, check Network tab
# Look for main.css or similar files

# Check if CSS files exist
ls -la frontend/build/static/css/
```

#### Clear browser cache and cookies
```bash
# In Chrome/Chromium
chrome://settings/clearBrowserData
# Select "Cached images and files"
```

## 6. Database Issues

### ❌ Database corruption

**Symptoms:**
- "Database disk image is malformed"
- Cannot connect to database

**Solutions:**

#### SQLite recovery
```bash
# Backup current database
cp backend/ai_data_agent.db backend/ai_data_agent.backup.db

# Try to dump and recreate
cd backend && source venv/bin/activate
python -c "
import sqlite3
conn = sqlite3.connect('ai_data_agent.db')
conn.execute('VACUUM')
conn.close()
"
```

#### PostgreSQL recovery
```bash
# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log

# Try to repair
sudo -u postgres psql ai_data_agent -c "REINDEX DATABASE ai_data_agent;"
```

### ❌ Slow database queries

**Symptoms:**
- Queries taking longer than expected
- High CPU usage on database

**Solutions:**

#### Analyze query performance
```sql
-- Enable query timing
\timing on

-- Analyze specific queries
EXPLAIN ANALYZE SELECT * FROM queries WHERE created_at > NOW() - INTERVAL '1 day';
```

#### Add database indexes
```sql
-- Common indexes for AI Data Agent
CREATE INDEX IF NOT EXISTS idx_files_status_created ON files(status, created_at);
CREATE INDEX IF NOT EXISTS idx_queries_file_created ON queries(file_id, created_at);
CREATE INDEX IF NOT EXISTS idx_file_data_file_column ON file_data(file_id, column_name);
```

## 7. Production Issues

### ❌ Service crashes

**Symptoms:**
- Services stop unexpectedly
- 500 internal server errors

**Solutions:**

#### Check service logs
```bash
# Backend logs
sudo journalctl -u ai-agent-backend -f

# System logs
sudo tail -f /var/log/syslog

# Application logs
sudo tail -f /home/aiagent/app/backend/logs/app.log
```

#### Restart services
```bash
sudo systemctl restart ai-agent-backend
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

### ❌ SSL certificate issues

**Symptoms:**
- "Certificate expired" warnings
- HTTPS connections fail

**Solutions:**

#### Check certificate status
```bash
# Check expiration
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test certificate
curl -I https://yourdomain.com
```

#### Nginx SSL configuration
```bash
# Test SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

## 8. Development Issues

### ❌ Hot reload not working

**Symptoms:**
- Code changes not reflected in browser
- Need to restart servers manually

**Solutions:**

#### Backend hot reload
```bash
# Backend should auto-reload with uvicorn
# If not working, check file watching
cd backend && source venv/bin/activate
python main.py --reload
```

#### Frontend hot reload
```bash
cd frontend
npm start
# Should show "webpack compiled successfully"
```

### ❌ Tests failing

**Symptoms:**
- "pytest" or "npm test" fails
- CI/CD pipeline failures

**Solutions:**

#### Backend tests
```bash
cd backend && source venv/bin/activate

# Install test dependencies
pip install pytest pytest-asyncio pytest-mock

# Run specific test
pytest tests/test_services.py::test_excel_processor -v

# Run all tests
pytest -v
```

#### Frontend tests
```bash
cd frontend

# Run tests
npm test

# Run specific test
npm test -- --testNamePattern="component-name"

# Update snapshots
npm test -- --updateSnapshot
```

## 9. Docker Issues

### ❌ Docker build fails

**Symptoms:**
- "docker-compose up" fails during build
- Container exits immediately

**Solutions:**

#### Check Docker installation
```bash
docker --version
docker-compose --version

# Restart Docker service
sudo systemctl restart docker
```

#### Fix Dockerfile issues
```bash
# Check for syntax errors
docker build -t ai-data-agent-test ../backend

# Check container logs
docker logs <container-id>
```

### ❌ Container networking issues

**Symptoms:**
- Services cannot communicate
- "Connection refused" between containers

**Solutions:**

#### Check network configuration
```bash
docker network ls
docker network inspect ai_agent_network

# Test connectivity
docker exec backend_container ping frontend_container
```

#### Fix service dependencies
```yaml
# In docker-compose.yml
depends_on:
  - db
  - redis
```

## 10. Security Issues

### ❌ Unauthorized access

**Symptoms:**
- Unexpected file uploads
- Database modifications

**Solutions:**

#### Check access logs
```bash
# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Application logs
sudo tail -f /home/aiagent/app/backend/logs/access.log
```

#### Implement authentication
```python
# Add to FastAPI
from fastapi import HTTPException

@app.middleware("http")
async def auth_middleware(request, call_next):
    # Add authentication logic
    pass
```

### ❌ File upload vulnerabilities

**Symptoms:**
- Suspicious files uploaded
- Unusual file types

**Solutions:**

#### Add file validation
```python
# In upload endpoint
ALLOWED_EXTENSIONS = {'.xlsx', '.xls'}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

def validate_file(file):
    # Add comprehensive validation
    pass
```

#### Scan uploaded files
```bash
# Install virus scanner
sudo apt install clamav

# Add to upload process
clamscan uploaded_file.xlsx
```

## 11. Getting Additional Help

### 📚 Documentation Resources
- **[Installation Guide](./INSTALLATION.md)** - Complete setup instructions
- **[Getting Started](./GETTING_STARTED.md)** - First steps guide
- **[API Reference](./API.md)** - Detailed API documentation
- **[Development Guide](./DEVELOPMENT.md)** - Contributing guidelines

### 🐛 Reporting Issues

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Step-by-step instructions
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, versions, browser
6. **Error Messages**: Copy relevant error logs
7. **Screenshots**: Visual evidence if applicable

### 💬 Community Support
- **GitHub Issues**: Report bugs and request features
- **Discussions**: Join community conversations
- **Email**: Contact maintainers for urgent issues

### 🔧 Advanced Debugging

#### Enable debug logging
```bash
# Backend
export LOG_LEVEL=DEBUG
python main.py

# Frontend
export REACT_APP_DEBUG=true
npm start
```

#### Database debugging
```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;  -- Log queries > 1s
```

#### Network debugging
```bash
# Monitor network traffic
sudo tcpdump -i lo port 8000

# Check open connections
ss -tuln | grep :8000
```

---

## 🎯 Issue Resolution Workflow

1. **Identify the symptom** - What exactly is happening?
2. **Check the logs** - Look for error messages
3. **Verify configuration** - Check environment variables and settings
4. **Test connectivity** - Verify network and database connections
5. **Try the solutions** - Work through the relevant solution steps
6. **Document the fix** - Note what worked for future reference

### Still Stuck?

If you're still experiencing issues:

1. **Check the complete documentation** in the `/docs` folder
2. **Search existing GitHub issues** for similar problems
3. **Create a new issue** with detailed information
4. **Contact the development team** for priority support

---

**Remember**: Most issues can be resolved by checking logs, verifying configuration, and following the step-by-step solutions above. Don't hesitate to ask for help if needed!
