#!/bin/bash

# AI Data Agent Deployment Script
# This script helps deploy the application to Vercel and other platforms

set -e

echo "🚀 AI Data Agent Deployment Script"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
check_nodejs() {
    print_status "Checking Node.js installation..."
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 16+ to continue."
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm to continue."
        exit 1
    fi

    print_success "Node.js $(node --version) and npm $(npm --version) are installed"
}

# Check if Vercel CLI is installed
check_vercel_cli() {
    print_status "Checking Vercel CLI installation..."
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI is not installed. Installing globally..."
        npm install -g vercel
    fi
    print_success "Vercel CLI is available"
}

# Install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    cd frontend
    npm install
    cd ..
    print_success "Frontend dependencies installed"
}

# Build frontend
build_frontend() {
    print_status "Building frontend..."
    cd frontend
    npm run build
    cd ..
    print_success "Frontend built successfully"
}

# Deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."

    # Check if already logged in to Vercel
    if ! vercel whoami &> /dev/null; then
        print_warning "You need to login to Vercel first"
        print_status "Running: vercel login"
        vercel login
    fi

    print_status "Deploying frontend to Vercel..."
    vercel --prod

    print_success "Frontend deployed to Vercel!"
}

# Display deployment information
show_deployment_info() {
    print_status "Deployment completed!"
    echo
    echo "📋 Next Steps:"
    echo "1. Deploy your backend to Railway, Render, or Heroku"
    echo "2. Update REACT_APP_API_URL in Vercel dashboard"
    echo "3. Test your deployed application"
    echo
    echo "🔧 Backend Deployment Options:"
    echo "• Railway: https://railway.app (Recommended for Python)"
    echo "• Render: https://render.com"
    echo "• Heroku: https://heroku.com"
    echo
    echo "📝 Environment Variables to Set:"
    echo "• REACT_APP_API_URL=https://your-backend-url.com"
    echo
    echo "🎉 Your app should now be live!"
}

# Main deployment flow
main() {
    echo
    print_status "Starting deployment process..."

    check_nodejs
    check_vercel_cli
    install_frontend_deps
    build_frontend
    deploy_to_vercel
    show_deployment_info

    print_success "Deployment script completed successfully!"
}

# Run main function
main "$@"
