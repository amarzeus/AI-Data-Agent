# 🚀 Vercel Deployment Guide for AI Data Agent

This guide explains how to deploy your AI Data Agent to Vercel.com for the frontend and provides options for backend deployment.

## 📋 Architecture Overview

Your AI Data Agent consists of:
- **Frontend**: React application (deployed to Vercel)
- **Backend**: Python FastAPI application (deployed to Railway/Render/Heroku)

## 🛠️ Prerequisites

- **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
- **Git Repository**: Push your code to GitHub, GitLab, or Bitbucket
- **Node.js**: Version 16+ (for local development and deployment)

## 🚀 Quick Deployment (Automated)

### Option 1: Using the Deployment Script

```bash
# Make the script executable (already done)
chmod +x deploy.sh

# Run the deployment script
./deploy.sh
```

This script will:
1. Check prerequisites (Node.js, Vercel CLI)
2. Install frontend dependencies
3. Build the React application
4. Deploy to Vercel
5. Provide next steps

### Option 2: Manual Deployment

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```

#### Step 3: Deploy Frontend
```bash
# Deploy to Vercel
vercel --prod

# Or for first-time setup with custom domain:
vercel --prod
```

## ⚙️ Configuration Files Created

The following files have been configured for optimal Vercel deployment:

### `vercel.json`
```json
{
  "version": 2,
  "builds": [
    {
      "src": "frontend/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/frontend/build/$1"
    }
  ],
  "outputDirectory": "frontend/build",
  "installCommand": "cd frontend && npm install",
  "buildCommand": "cd frontend && npm run build"
}
```

### `.vercelignore`
Excludes unnecessary files from deployment to optimize build times and reduce package size.

## 🔧 Environment Variables

### For Vercel (Frontend)

Set these in your Vercel dashboard (Project Settings > Environment Variables):

```bash
REACT_APP_API_URL=https://your-backend-service.com
```

**Important**: The environment variable name must match exactly what's used in your code:
```typescript
const API_BASE_URL = process.env.REACT_APP_API_URL || `http://localhost:8000`;
```

## 🖥️ Backend Deployment Options

Since Vercel doesn't support Python/Flask/FastAPI directly, you need to deploy your backend separately:

### Option A: Railway (Recommended) ⭐

1. **Sign up**: Go to [railway.app](https://railway.app) and connect your GitHub
2. **Deploy Backend**:
   ```bash
   # Push your code to GitHub first
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```
3. **Create Railway App**:
   - Go to Railway dashboard
   - Click "New Project"
   - Select "Deploy from GitHub"
   - Choose your repository
   - Railway will auto-detect Python and set up the service

4. **Configure Environment Variables** in Railway:
   ```bash
   GOOGLE_API_KEY=your_google_api_key
   DATABASE_URL=postgresql://... (if using PostgreSQL)
   ```

### Option B: Render

1. **Sign up**: Go to [render.com](https://render.com)
2. **Create Web Service**:
   - Connect your GitHub repository
   - Select "Web Service"
   - Set build command: `pip install -r requirements.txt`
   - Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Option C: Heroku

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli
2. **Create Heroku App**:
   ```bash
   heroku create your-app-name
   ```
3. **Deploy**:
   ```bash
   git push heroku main
   ```

## 🌐 Domain Configuration

### Custom Domain Setup

#### For Vercel (Frontend):
1. Go to your Vercel project dashboard
2. Navigate to "Settings" > "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

#### For Backend (Railway/Render/Heroku):
1. Configure custom domain in your backend hosting provider
2. Update the `REACT_APP_API_URL` to point to your backend domain

## 🔍 Testing Your Deployment

### 1. Frontend Deployment Test
```bash
# Check if frontend is accessible
curl https://your-frontend.vercel.app
```

### 2. Backend API Test
```bash
# Test backend health endpoint
curl https://your-backend.railway.app/health
```

### 3. End-to-End Test
1. Open your frontend URL in browser
2. Try uploading a file
3. Test AI queries
4. Verify all features work correctly

## 🛠️ Troubleshooting

### Common Issues

#### 1. Build Failures
```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing dependencies
# - Build script errors
# - Environment variable issues
```

#### 2. API Connection Issues
- Ensure `REACT_APP_API_URL` is set correctly in Vercel
- Verify CORS settings in your backend
- Check network requests in browser dev tools

#### 3. Environment Variables Not Working
- Double-check variable names match exactly
- Ensure variables are set in production environment
- Redeploy after adding new variables

### Debug Commands
```bash
# Check Vercel deployment status
vercel ls

# View deployment logs
vercel logs --follow

# Check environment variables
vercel env ls
```

## 📊 Monitoring and Maintenance

### Vercel Analytics
- Built-in analytics available in Vercel dashboard
- Monitor traffic, errors, and performance

### Backend Monitoring
- Use your backend hosting provider's monitoring tools
- Set up health check endpoints
- Monitor API response times

### Database Backups
- Set up automated backups for your database
- Test restore procedures regularly

## 🔒 Security Considerations

### Frontend Security
- HTTPS is automatically enabled on Vercel
- Set secure headers in your React app if needed

### Backend Security
- Configure CORS properly in your FastAPI app
- Use HTTPS for all API communications
- Secure API keys and sensitive environment variables

### Environment Variables Security
- Never commit sensitive data to Git
- Use your hosting provider's secret management
- Rotate API keys regularly

## 📈 Performance Optimization

### Frontend Optimization
- Vercel automatically optimizes static assets
- Consider code splitting for large applications
- Optimize images and other assets

### Backend Optimization
- Use connection pooling for databases
- Implement caching where appropriate
- Monitor and optimize API response times

## 🚀 Advanced Configuration

### Custom Build Settings
If you need custom build configurations, modify `vercel.json`:

```json
{
  "buildCommand": "cd frontend && npm run build",
  "installCommand": "cd frontend && npm install",
  "env": {
    "NODE_ENV": "production"
  }
}
```

### Multiple Environments
```bash
# Deploy to staging
vercel --prod=false

# Set different environment variables per environment
vercel env add REACT_APP_API_URL staging
```

## 🤝 Getting Help

### Resources
- **Vercel Documentation**: https://vercel.com/docs
- **Railway Documentation**: https://docs.railway.app
- **React Deployment Guide**: https://create-react-app.dev/docs/deployment/

### Support
- **Vercel Support**: Available through your Vercel dashboard
- **Community**: GitHub issues, Stack Overflow
- **Backend Provider**: Use their respective support channels

---

## 🎉 Deployment Checklist

- [ ] ✅ Vercel account created and configured
- [ ] ✅ Git repository connected to Vercel
- [ ] ✅ Frontend deployed successfully
- [ ] ✅ Backend deployed to Railway/Render/Heroku
- [ ] ✅ Environment variables configured
- [ ] ✅ Custom domain set up (optional)
- [ ] ✅ All features tested end-to-end
- [ ] ✅ Monitoring configured
- [ ] ✅ Security settings verified

**Congratulations! Your AI Data Agent is now live on the internet! 🎊**
