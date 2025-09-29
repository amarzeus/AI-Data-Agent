# 🤖 AI Data Agent

> **Your Intelligent Data Analysis Partner**

A modern, AI-powered platform that transforms how users interact with Excel data. Simply upload your files and ask questions in plain English - the AI does the rest!

[![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
[![Python](https://img.shields.io/badge/Python-3.12-green.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688.svg)](https://fastapi.tiangolo.com/)
[![Google Gemini AI](https://img.shields.io/badge/Gemini%20AI-Enabled-orange.svg)](https://ai.google.dev/)

## ✨ Key Features

### 🚀 **AI-Powered Analysis**
- **Natural Language Queries**: Ask questions in plain English
- **Google Gemini AI**: Intelligent insights and recommendations
- **Context-Aware Responses**: Understands your data structure
- **Actionable Insights**: Statistical analysis with business recommendations

### 📊 **Advanced Visualizations**
- **6 Chart Types**: Bar, Line, Area, Pie, Scatter, Histogram
- **Interactive Pivot Tables**: Dynamic data summarization
- **Export Options**: PNG, SVG, CSV formats
- **Customizable Styling**: Professional charts with your branding

### 🎨 **Modern Interface**
- **Two-Column Layout**: AI Chat on left, Data Playground on right
- **Collapsible Tools**: Hover-accessible tools menu in header
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Drag-and-Drop Upload**: Intuitive file handling
- **Real-time Processing**: Live progress and feedback

### 🔧 **Enterprise Ready**
- **Dynamic Schema**: Adapts to any Excel structure automatically
- **Multi-Sheet Support**: Process Excel files with multiple worksheets
- **Data Quality Analysis**: Identifies and reports data issues per sheet
- **Scalable Architecture**: Production-ready with proper error handling
- **Comprehensive APIs**: Full REST API for integration

## 🚀 Quick Start

### ⚡ One-Command Setup (Recommended)

```bash
git clone <repository-url>
cd ai-data-agent
./setup.sh  # Automated setup and configuration
```

The setup script will:
- ✅ Check system prerequisites
- 🔧 Set up Python virtual environment
- ⚛️ Install Node.js dependencies
- 📝 Create environment configuration files
- 🎯 Provide next steps for running the application

### 📋 Prerequisites

**System Requirements:**
- **Node.js**: 16.0 or higher
- **Python**: 3.12 or higher
- **Git**: For cloning the repository
- **Google Gemini API Key**: Get yours at [Google AI Studio](https://aistudio.google.com/)

**Optional (for enhanced features):**
- **PostgreSQL**: For production database (SQLite included for development)
- **Redis**: For caching and session management

### 🛠️ Manual Installation

#### Backend Setup (Python/FastAPI)

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your Google Gemini API key
   nano .env  # or your preferred editor
   ```

5. **Start the backend server:**
   ```bash
   python main.py
   ```

#### Frontend Setup (React/TypeScript)

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment:**
   ```bash
   cp .env.example .env.local
   # Edit .env.local to point to your backend URL
   nano .env.local
   ```

4. **Start the development server:**
   ```bash
   npm start
   ```

### 🚀 Running the Application

#### Option 1: Enhanced Startup Script (Recommended)

```bash
./start.sh
```

This script provides:
- 🔍 Automatic port detection (finds available ports)
- 🌐 Network information display
- 📱 Local and network access URLs
- 🔧 Automatic cleanup on exit
- 🎯 Enhanced error handling

#### Option 2: Manual Startup

**Terminal 1 - Backend:**
```bash
cd backend
source venv/bin/activate
python main.py
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

### 🌐 Access URLs

After startup, access the application at:

- **Frontend**: http://localhost:3000 (or the port shown by start.sh)
- **Backend API**: http://localhost:8000 (or the port shown by start.sh)
- **API Documentation**: http://localhost:8000/docs
- **Network Access**: http://[your-ip]:3000 (from other devices on your network)

### 🔧 Environment Configuration

#### Backend Configuration (.env)

```env
# API Configuration
HOST=0.0.0.0
PORT=8000

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost/ai_data_agent
# For development (SQLite):
# DATABASE_URL=sqlite:///./ai_data_agent.db

# Google Gemini AI (Required)
GOOGLE_API_KEY=your_gemini_api_key_here

# File Upload Settings
MAX_FILE_SIZE_MB=50
UPLOAD_DIR=uploads

# CORS Configuration
FRONTEND_URL=http://localhost:3000

# Logging
LOG_LEVEL=INFO
```

#### Frontend Configuration (.env.local)

```env
REACT_APP_API_URL=http://localhost:8000
```

### 🔐 Getting Your Google Gemini API Key

1. Visit [Google AI Studio](https://aistudio.google.com/)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key and add it to your `backend/.env` file

**⚠️ Important**: Keep your API key secure and never commit it to version control.

## 📋 Example Usage

### 1. Upload Your Excel File
```
Drag and drop your sales_data.xlsx file
→ System validates and processes automatically
→ Data quality analysis completed
```

### 2. Ask Natural Language Questions
```
"What were our top-selling products last quarter?"
"Show me the revenue trend over the past year"
"Compare sales performance between regions"
"Which customers have the highest lifetime value?"
```

### 3. Get AI-Powered Insights
```
AI Response:
"Based on your data, Product A had the highest sales at $45,000 (35% of total).
Product B came in second with $32,000 (25%).

Key Insights:
• Sales increased 15% compared to previous quarter
• Product A shows strongest growth trend
• Consider increasing inventory for Product A

Recommended Actions:
• Review pricing strategy for Product C
• Focus marketing efforts on top-performing regions"
```

### 4. Create Visualizations
```
→ AI suggests bar chart for product comparison
→ Click "Create Visualization"
→ Customize colors, labels, and styling
→ Export as PNG for presentations
```

## 📚 Documentation

### 📖 **Complete Documentation Available**

| Guide | Description | Audience |
|-------|-------------|----------|
| **[📋 README.md](docs/README.md)** | Comprehensive project overview | Everyone |
| **[🔌 API.md](docs/API.md)** | Detailed API documentation | Developers |
| **[👥 USER_GUIDE.md](docs/USER_GUIDE.md)** | Step-by-step user instructions | End Users |
| **[💻 DEVELOPMENT.md](docs/DEVELOPMENT.md)** | Developer guide and contribution | Contributors |
| **[📊 SUMMARY.md](docs/SUMMARY.md)** | Project summary and achievements | All |

### 🎯 **Quick Links**
- **[Setup Instructions](docs/README.md#installation)** - Get started in minutes
- **[API Reference](docs/API.md)** - Complete endpoint documentation
- **[User Guide](docs/USER_GUIDE.md)** - Learn how to use the platform
- **[Development Guide](docs/DEVELOPMENT.md)** - Contribute to the project

## 🏗️ Architecture

### Technology Stack
```
Frontend (React/TypeScript)
├── React 18.2.0 + Hooks
├── Material-UI + Custom Theming
├── Recharts + Interactive Charts
├── TypeScript + Type Safety
└── Responsive Design

Backend (Python/FastAPI)
├── FastAPI + Async Performance
├── SQLAlchemy + Dynamic ORM
├── Pandas + Data Processing
├── Google Gemini AI + NLP
└── OpenPyXL + Excel Processing

Database
├── PostgreSQL + Production Ready
├── SQLite + Development
└── Dynamic Schema Creation
```

### System Flow
```
Excel File → Upload → Validation → Processing → Database → AI Analysis → Visualization → Export
```

## 🤝 Contributing

We welcome contributions! Here's how to get involved:

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Test** thoroughly
5. **Submit** a pull request

### Development Resources
- **[Development Guide](docs/DEVELOPMENT.md)** - Complete contributor documentation
- **[Code Standards](docs/DEVELOPMENT.md#code-standards)** - Follow our coding standards
- **[Testing Guide](docs/DEVELOPMENT.md#testing)** - How to test your changes
- **[API Documentation](docs/API.md)** - Understand the backend APIs

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Google Gemini AI** - Powers our natural language processing
- **Material-UI** - Beautiful, accessible component library
- **Recharts** - Powerful, interactive charting library
- **FastAPI** - High-performance async web framework
- **Pandas** - Essential data manipulation and analysis

## 🔧 Troubleshooting

### Common Setup Issues

#### ❌ "Python not found" or "Node.js not found"
**Solution**: Install the required versions:
```bash
# Check versions
python3 --version  # Should be 3.12+
node --version     # Should be 16+

# Install Python (Ubuntu/Debian)
sudo apt update
sudo apt install python3.12 python3.12-venv

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### ❌ "Permission denied" when running setup scripts
**Solution**: Make scripts executable:
```bash
chmod +x setup.sh start.sh
```

#### ❌ Backend dependency installation fails
**Solution**: Common solutions:
```bash
# Upgrade pip first
pip install --upgrade pip

# Install specific versions
pip install fastapi==0.104.1 uvicorn==0.24.0

# Clear pip cache if needed
pip cache purge
```

#### ❌ Frontend npm install fails
**Solution**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Common Runtime Issues

#### ❌ "Google API key not configured"
**Solution**:
1. Get your API key from [Google AI Studio](https://aistudio.google.com/)
2. Edit `backend/.env` and add: `GOOGLE_API_KEY=your_key_here`
3. Restart the backend server

#### ❌ "Database connection failed"
**Solution**:
```bash
# For SQLite (default)
ls -la backend/ai_data_agent.db

# For PostgreSQL
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Test connection
cd backend && source venv/bin/activate
python -c "from app.core.config import engine; print('Connected successfully')"
```

#### ❌ Port already in use
**Solution**: Use the enhanced startup script:
```bash
./start.sh  # Automatically finds free ports
```

Or manually find and use different ports:
```bash
# Find free ports
lsof -i :3000  # Check if port 3000 is in use
lsof -i :8000  # Check if port 8000 is in use

# Use different ports
cd frontend && PORT=3001 npm start
cd backend && PORT=8001 python main.py
```

#### ❌ File upload fails
**Solution**:
```bash
# Check upload directory permissions
ls -la backend/uploads/

# Create directory if missing
mkdir -p backend/uploads
chmod 755 backend/uploads

# Check file size limits in .env
# MAX_FILE_SIZE_MB=50
```

### Development Issues

#### ❌ Hot reload not working
**Solution**:
```bash
# Frontend: Restart the development server
cd frontend && npm start

# Backend: The server should auto-reload on file changes
# If not, restart manually
cd backend && source venv/bin/activate && python main.py
```

#### ❌ TypeScript compilation errors
**Solution**:
```bash
cd frontend

# Clear build cache
rm -rf build node_modules/.cache

# Reinstall dependencies
npm install

# Check TypeScript configuration
npx tsc --noEmit
```

### Performance Issues

#### 🐌 Slow file processing
- Check available system memory
- Consider processing large files in background
- Monitor CPU usage during processing

#### 🐌 Slow AI responses
- Verify internet connectivity
- Check Google Gemini API quotas
- Consider response caching for frequent queries

### Getting Additional Help

#### 📚 Documentation
- **[Complete Documentation](docs/README.md)** - Comprehensive guides
- **[API Reference](docs/API.md)** - Detailed API documentation
- **[User Guide](docs/USER_GUIDE.md)** - Step-by-step instructions
- **[Development Guide](docs/DEVELOPMENT.md)** - Contributing guidelines

#### 🐛 Support Channels
- **Issues**: Report bugs and request features on GitHub
- **Discussions**: Join community conversations
- **Email**: Contact maintainers for questions

#### 📞 Resources
- **[Troubleshooting Guide](docs/README.md#troubleshooting)** - Extended solutions
- **[Performance Guide](docs/README.md#performance-issues)** - Optimization tips
- **[FAQ](docs/README.md#faq)** - Frequently asked questions

---

## 🎊 **Ready to Transform Your Data Analysis?**

The AI Data Agent is **production-ready** and waiting for your data! Experience the future of data analysis with AI-powered insights and intuitive visualizations.

**🚀 Get Started Today:**
1. **[📖 Read the Documentation](docs/README.md)**
2. **[🔌 Explore the API](docs/API.md)**
3. **[👥 Follow the User Guide](docs/USER_GUIDE.md)**
4. **[💻 Contribute to Development](docs/DEVELOPMENT.md)**

---

**Built with ❤️ using modern web technologies and AI innovation**

*Making data analysis accessible to everyone, one question at a time.*