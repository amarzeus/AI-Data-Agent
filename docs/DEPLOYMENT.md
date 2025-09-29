# Deployment Guide

## 🚀 Production Deployment Guide for AI Data Agent

This comprehensive guide covers deploying the AI Data Agent to production environments, including cloud platforms, Docker containers, and traditional server deployments.

## 📋 Deployment Options

| Method | Difficulty | Scalability | Maintenance | Cost |
|--------|------------|-------------|-------------|------|
| **Docker Compose** | 🟢 Easy | 🟡 Medium | 🟢 Low | 🟢 Low |
| **Docker Swarm** | 🟡 Medium | 🟢 High | 🟡 Medium | 🟡 Medium |
| **Kubernetes** | 🔴 Hard | 🟢 High | 🔴 High | 🔴 High |
| **Cloud Platform** | 🟡 Medium | 🟢 High | 🟢 Low | 🔴 High |
| **Traditional Server** | 🟢 Easy | 🟡 Medium | 🟡 Medium | 🟡 Medium |

## 1. Pre-Deployment Checklist

### System Requirements

#### Production Server Specifications
- **CPU**: 2+ cores (4+ recommended for heavy usage)
- **RAM**: 4GB minimum (8GB+ recommended)
- **Storage**: 20GB+ SSD storage
- **Network**: 10Mbps+ upload/download speed

#### Software Requirements
- **Docker**: 20.10+ (for containerized deployment)
- **Docker Compose**: 2.0+ (for orchestration)
- **Nginx**: 1.20+ (for reverse proxy)
- **PostgreSQL**: 13+ (production database)
- **Redis**: 6+ (caching, optional)

### Security Checklist

- [ ] SSL/TLS certificates configured
- [ ] Firewall rules set up
- [ ] API keys secured in environment variables
- [ ] Database credentials encrypted
- [ ] File upload directory secured
- [ ] Regular backup strategy implemented
- [ ] Monitoring and alerting configured

## 2. Docker Deployment (Recommended)

### Docker Compose Setup

#### 1. Create Production Environment Files

```bash
# Create production environment
mkdir -p production
cd production

# Copy and customize docker-compose.yml
cp ../docker-compose.prod.yml ./docker-compose.yml
```

**docker-compose.yml:**
```yaml
version: '3.8'
services:
  # PostgreSQL Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_data_agent_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    networks:
      - ai_agent_network
    restart: unless-stopped

  # Redis Cache
  redis:
    image: redis:7-alpine
    command: redis-server --appendonly yes
    volumes:
      - redis_data:/data
    networks:
      - ai_agent_network
    restart: unless-stopped

  # Backend API
  backend:
    build:
      context: ../backend
      dockerfile: ../docker/backend.Dockerfile
    environment:
      - DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@db:5432/ai_data_agent_prod
      - REDIS_URL=redis://redis:6379
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
      - ENVIRONMENT=production
      - WORKERS=4
    volumes:
      - ../uploads:/app/uploads
      - ./logs:/app/logs
    depends_on:
      - db
      - redis
    networks:
      - ai_agent_network
    restart: unless-stopped

  # Frontend Application
  frontend:
    build:
      context: ../frontend
      dockerfile: ../docker/frontend.Dockerfile
    environment:
      - REACT_APP_API_URL=https://${DOMAIN}
    depends_on:
      - backend
    networks:
      - ai_agent_network
    restart: unless-stopped

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ../frontend/build:/usr/share/nginx/html
    depends_on:
      - frontend
    networks:
      - ai_agent_network
    restart: unless-stopped

volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local

networks:
  ai_agent_network:
    driver: bridge
```

#### 2. Create Production Dockerfiles

**Backend Dockerfile:**
```dockerfile
FROM python:3.12-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create non-root user
RUN useradd --create-home --shell /bin/bash app \
    && chown -R app:app /app
USER app

# Create necessary directories
RUN mkdir -p uploads logs

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine

COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### 3. Environment Configuration

**Create .env.production:**
```bash
# Domain and SSL
DOMAIN=yourdomain.com
SSL_EMAIL=admin@yourdomain.com

# Database
DB_USER=ai_prod_user
DB_PASSWORD=secure_random_password_here

# Google AI
GOOGLE_API_KEY=your_production_api_key

# Security
SECRET_KEY=your_app_secret_key_here

# Performance
MAX_WORKERS=4
MAX_FILE_SIZE_MB=100
```

#### 4. SSL Certificate Setup

```bash
# Install certbot
sudo apt install certbot

# Generate SSL certificate
sudo certbot certonly --standalone \
    --agree-tos \
    --register-unsafely-without-email \
    -d $DOMAIN

# Auto-renewal
sudo crontab -e
# Add: 0 3 * * * certbot renew --quiet
```

### Deployment Commands

```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Update deployment
docker-compose pull
docker-compose up -d --no-deps backend frontend
```

## 3. Cloud Platform Deployment

### AWS Deployment

#### Using AWS ECS Fargate

**1. Create ECS Cluster**
```bash
aws ecs create-cluster --cluster-name ai-data-agent-prod
```

**2. Create Task Definitions**

**Backend Task Definition:**
```json
{
  "family": "ai-data-agent-backend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "2048",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-registry/backend:latest",
      "essential": true,
      "environment": [
        {"name": "DATABASE_URL", "value": "postgresql://..."},
        {"name": "GOOGLE_API_KEY", "valueFrom": "arn:aws:secretsmanager:..."}
      ],
      "portMappings": [{"containerPort": 8000}],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ai-data-agent-backend",
          "awslogs-region": "us-east-1"
        }
      }
    }
  ]
}
```

**3. Set Up Load Balancer**
```bash
# Create target group
aws elbv2 create-target-group \
    --name ai-data-agent-backend-tg \
    --protocol HTTP \
    --port 8000 \
    --vpc-id vpc-xxxxx

# Create load balancer
aws elbv2 create-load-balancer \
    --name ai-data-agent-alb \
    --subnets subnet-1 subnet-2 \
    --security-groups sg-xxxxx
```

### Google Cloud Deployment

#### Using Cloud Run

**1. Build and Push Container**
```bash
# Build container
gcloud builds submit --tag gcr.io/PROJECT-ID/ai-data-agent

# Deploy to Cloud Run
gcloud run deploy ai-data-agent \
    --image gcr.io/PROJECT-ID/ai-data-agent \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated
```

**2. Configure Environment Variables**
```bash
gcloud run services update ai-data-agent \
    --set-env-vars DATABASE_URL=...,GOOGLE_API_KEY=...
```

### Azure Deployment

#### Using Azure Container Instances

**1. Create Resource Group**
```bash
az group create --name ai-data-agent-rg --location eastus
```

**2. Deploy Container**
```bash
az container create \
    --resource-group ai-data-agent-rg \
    --name ai-data-agent \
    --image your-registry/ai-data-agent:latest \
    --environment-variables DATABASE_URL=... GOOGLE_API_KEY=... \
    --ports 80 443 \
    --cpu 2 \
    --memory 4
```

## 4. Traditional Server Deployment

### Ubuntu Server Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y python3.12 python3.12-venv python3.12-dev \
    postgresql postgresql-contrib nginx redis-server \
    certbot python3-certbot-nginx ufw

# Configure firewall
sudo ufw allow 'OpenSSH'
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

#### 2. Application Setup
```bash
# Create application user
sudo useradd --create-home --shell /bin/bash aiagent

# Clone application
sudo -u aiagent git clone <repository> /home/aiagent/app
cd /home/aiagent/app

# Setup backend
cd backend
python3.12 -m venv venv
./venv/bin/pip install -r requirements.txt
sudo cp ai-agent-backend.service /etc/systemd/system/
sudo systemctl enable ai-agent-backend
sudo systemctl start ai-agent-backend

# Setup frontend
cd ../frontend
npm install
npm run build
sudo cp -r build /var/www/html/ai-agent
```

#### 3. Nginx Configuration

**Create /etc/nginx/sites-available/ai-data-agent:**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        root /var/www/html/ai-agent;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # File uploads
    location /uploads/ {
        alias /home/aiagent/app/backend/uploads/;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

## 5. Database Migration and Backup

### Database Backup Strategy

#### PostgreSQL Backup
```bash
# Create backup script
sudo tee /home/aiagent/backup-db.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
pg_dump -h localhost -U ai_prod_user ai_data_agent_prod > /home/aiagent/backups/db_backup_$DATE.sql
find /home/aiagent/backups -name "db_backup_*.sql" -mtime +7 -delete
EOF

sudo chmod +x /home/aiagent/backup-db.sh

# Add to crontab
sudo crontab -e
# Add: 0 2 * * * /home/aiagent/backup-db.sh
```

#### File Backup
```bash
# Create file backup script
sudo tee /home/aiagent/backup-files.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf /home/aiagent/backups/files_backup_$DATE.tar.gz /home/aiagent/app/backend/uploads/
find /home/aiagent/backups -name "files_backup_*.tar.gz" -mtime +7 -delete
EOF

sudo chmod +x /home/aiagent/backup-files.sh

# Add to crontab
sudo crontab -e
# Add: 0 3 * * * /home/aiagent/backup-files.sh
```

### Database Migration

#### For Schema Updates
```bash
# Create migration script
cd backend
source venv/bin/activate

# Generate migration
alembic revision --autogenerate -m "update_schema"

# Apply migration
alembic upgrade head
```

## 6. Monitoring and Maintenance

### Application Monitoring

#### Using Prometheus + Grafana

**Docker Compose Monitoring Stack:**
```yaml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
```

### Log Management

#### Centralized Logging with ELK Stack

**Filebeat Configuration:**
```yaml
filebeat.inputs:
- type: log
  paths:
    - /home/aiagent/app/backend/logs/*.log
  fields:
    service: ai-data-agent-backend

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
```

### Health Checks and Alerts

#### Health Check Endpoints
```bash
# Backend health
curl https://yourdomain.com/api/health

# Database health
curl https://yourdomain.com/api/db-health

# Overall system health
curl https://yourdomain.com/health
```

#### Alert Configuration
```yaml
# Prometheus alert rules
groups:
  - name: ai-data-agent
    rules:
      - alert: BackendDown
        expr: up{job="ai-data-agent-backend"} == 0
        for: 5m
        labels:
          severity: critical
```

## 7. Performance Optimization

### Load Testing

#### Using Apache Bench
```bash
# Test API endpoints
ab -n 1000 -c 10 https://yourdomain.com/api/health

# Test file uploads
ab -n 100 -c 5 -p test_file.xlsx -T application/octet-stream \
   https://yourdomain.com/api/upload
```

### Database Optimization

```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_files_status ON files(status);
CREATE INDEX CONCURRENTLY idx_queries_created_at ON queries(created_at);
CREATE INDEX CONCURRENTLY idx_file_data_file_id ON file_data(file_id);

-- Analyze tables for query planner
ANALYZE files;
ANALYZE queries;
ANALYZE file_data;
```

### Caching Strategy

#### Redis Configuration
```bash
# Enable Redis persistence
echo "save 900 1" >> /etc/redis/redis.conf
echo "save 300 10" >> /etc/redis/redis.conf
echo "save 60 10000" >> /etc/redis/redis.conf

# Restart Redis
sudo systemctl restart redis
```

## 8. Security Hardening

### SSL/TLS Configuration

#### Nginx SSL Configuration
```nginx
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";
}
```

### File Upload Security

```bash
# Restrict upload directory
sudo chown -R aiagent:www-data /home/aiagent/app/backend/uploads
sudo chmod -R 755 /home/aiagent/app/backend/uploads

# Add virus scanning (optional)
sudo apt install clamav
sudo freshclam
sudo clamscan /home/aiagent/app/backend/uploads/
```

### API Security

#### Rate Limiting
```python
# In FastAPI middleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/upload")
@limiter.limit("10/minute")
async def upload_file(file: UploadFile = File(...)):
    # Upload logic
```

## 9. Troubleshooting Production Issues

### Common Production Issues

#### High Memory Usage
```bash
# Monitor memory
htop

# Check for memory leaks
cd backend && source venv/bin/activate
pip install memory-profiler
python -m memory_profiler main.py
```

#### Slow Database Queries
```sql
-- Identify slow queries
EXPLAIN ANALYZE SELECT * FROM queries WHERE created_at > NOW() - INTERVAL '1 hour';

-- Check table sizes
SELECT schemaname, tablename, attname, n_distinct,
       correlation FROM pg_stats WHERE tablename = 'queries';
```

#### Application Crashes
```bash
# Check application logs
sudo journalctl -u ai-agent-backend -f

# Check system logs
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart ai-agent-backend
sudo systemctl reload nginx
```

### Emergency Procedures

#### Service Recovery
```bash
# Stop all services
docker-compose down

# Check system resources
df -h
free -h

# Restart services
docker-compose up -d
```

#### Data Recovery
```bash
# Restore from backup
psql -h localhost -U ai_prod_user ai_data_agent_prod < latest_backup.sql

# Verify data integrity
psql -h localhost -U ai_prod_user ai_data_agent_prod -c "SELECT COUNT(*) FROM files;"
```

## 10. Cost Optimization

### AWS Cost Optimization

#### Right Sizing
```bash
# Use appropriate instance types
# t3.medium for development
# c5.large for production workloads

# Use reserved instances for stable workloads
aws ec2 describe-reserved-instances
```

#### Auto Scaling
```yaml
# ECS Auto Scaling configuration
{
  "TargetValue": 70.0,
  "PredefinedMetricSpecification": {
    "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
  }
}
```

### Monitoring Costs
```bash
# Set up billing alerts
aws budgets create-budget \
    --budget-name "AI-Data-Agent-Monthly" \
    --budget-type COST \
    --budget-limit Amount=100,Unit=USD \
    --time-period Start=2024-01-01T00:00:00Z,End=2024-12-31T23:59:59Z
```

---

## 🎉 Deployment Complete!

Your AI Data Agent is now running in production! 🎊

### Post-Deployment Checklist

- [ ] Verify all services are running
- [ ] Test file upload functionality
- [ ] Test AI query processing
- [ ] Confirm SSL certificate is working
- [ ] Set up monitoring alerts
- [ ] Schedule regular backups
- [ ] Document emergency procedures

### Next Steps

1. **Load Testing**: Test with realistic user loads
2. **Performance Monitoring**: Set up detailed monitoring
3. **User Training**: Train your team on the platform
4. **Feature Expansion**: Plan future enhancements

### Getting Help

- **📖 Documentation**: Complete guides in `/docs`
- **🔧 Support**: Contact the development team
- **🐛 Issues**: Report problems on GitHub
- **💬 Community**: Join user discussions

---

**Congratulations on your successful production deployment! 🚀**
