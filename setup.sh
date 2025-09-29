#!/bin/bash

# AI Data Agent - Automated Setup Script
# This script sets up the complete development environment

echo "🤖 AI Data Agent - Automated Setup"
echo "=================================="

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is required but not installed."
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

if ! command_exists python3; then
    echo "❌ Python 3 is required but not installed."
    echo "Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Setup backend
echo ""
echo "🔧 Setting up backend..."

cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Backend setup completed successfully"
else
    echo "❌ Backend setup failed"
    echo "Please run: cd backend && source venv/bin/activate && pip install -r requirements.txt"
    exit 1
fi

# Setup frontend
echo ""
echo "⚛️ Setting up frontend..."

cd ../frontend

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

if [ $? -eq 0 ]; then
    echo "✅ Frontend setup completed successfully"
else
    echo "❌ Frontend setup failed"
    echo "Please run: cd frontend && npm install"
    exit 1
fi

# Create environment files
echo ""
echo "📝 Setting up environment configuration..."

# Backend environment
cd ../backend
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Created backend/.env from template"
    echo "⚠️  Please edit backend/.env and add your Google Gemini API key"
else
    echo "✅ Backend .env already exists"
fi

# Frontend environment
cd ../frontend
if [ ! -f ".env.local" ]; then
    cp .env.example .env.local
    echo "✅ Created frontend/.env.local from template"
else
    echo "✅ Frontend .env.local already exists"
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "🚀 To start the application:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd backend"
echo "  source venv/bin/activate"
echo "  python main.py"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd frontend"
echo "  npm start"
echo ""
echo "🌐 Access the application:"
echo "  Frontend: http://localhost:3000"
echo "  Backend API: http://localhost:8000"
echo "  API Documentation: http://localhost:8000/docs"
echo ""
echo "📚 For more information, check the documentation in the docs/ folder"
echo ""
echo "💡 Quick tip: Make sure to add your Google Gemini API key to backend/.env"