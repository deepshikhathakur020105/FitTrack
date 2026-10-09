# FitTrack Deployment Guide

Complete guide to deploy FitTrack to production.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Docker Deployment](#docker-deployment)
5. [Cloud Platform Deployments](#cloud-platform-deployments)
6. [Security Configuration](#security-configuration)
7. [Monitoring & Logging](#monitoring--logging)
8. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] Database migrations run successfully
- [ ] Secrets stored securely (not in git)
- [ ] Frontend build tested (`npm run build`)
- [ ] Backend tests passing (`npm test`)
- [ ] HTTPS/SSL certificates obtained
- [ ] Admin account created
- [ ] Email service configured
- [ ] Rate limiting configured
- [ ] Database backups configured
- [ ] Monitoring and logging set up
- [ ] Error tracking (Sentry/similar) configured
- [ ] Health check endpoint verified

---

## Environment Setup

### Backend Environment Variables

Create `.env` file in `backend/` directory:

```bash
# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com

# Database Configuration
DB_HOST=your-db-host
DB_USER=fittrack_user
DB_PASSWORD=<GENERATE_SECURE_PASSWORD>
DB_NAME=fittrack
DB_PORT=3306

# JWT Configuration (Generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET=<GENERATE_SECURE_SECRET>
JWT_REFRESH_SECRET=<GENERATE_SECURE_SECRET>
JWT_EXPIRY=1h
REFRESH_TOKEN_EXPIRY=7d

# Redis Configuration
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=<GENERATE_SECURE_PASSWORD>

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-service-email@gmail.com
EMAIL_PASSWORD=<APP_PASSWORD_FROM_GMAIL>
EMAIL_FROM=noreply@fittrack.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Frontend Environment Variables

Create `.env` file in `frontend/` directory:

```bash
VITE_API_URL=https://api.your-domain.com/api
```

### Generate Secure Secrets

```bash
# Generate JWT secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Generate database password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Generate Redis password
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

---

## Database Setup

### Initial Database Creation

```bash
# 1. Create database
mysql -h your-db-host -u root -p

CREATE DATABASE fittrack;
CREATE USER 'fittrack_user'@'%' IDENTIFIED BY 'your-secure-password';
GRANT ALL PRIVILEGES ON fittrack.* TO 'fittrack_user'@'%';
FLUSH PRIVILEGES;

# 2. Run migrations
cd backend
npm run migrate
```

### Database Backup Strategy

**Automated daily backups:**

```bash
# Create backup script: backup.sh
#!/bin/bash
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/fittrack"
mkdir -p $BACKUP_DIR

mysqldump -h $DB_HOST -u $DB_USER -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/fittrack_$TIMESTAMP.sql

# Keep only last 30 days
find $BACKUP_DIR -type f -mtime +30 -delete

# Schedule with cron: 0 2 * * * /path/to/backup.sh
```

---

## Docker Deployment

### Using Docker Compose (Development/Staging)

```bash
# Navigate to backend directory
cd backend

# Build and start services
docker-compose up -d

# Run migrations
docker-compose exec api npm run migrate

# View logs
docker-compose logs -f
```

### Using Docker (Production)

**Backend Dockerfile (Already configured):**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

**Build and push to registry:**

```bash
# Build image
docker build -t fittrack-backend:latest .

# Tag for registry
docker tag fittrack-backend:latest your-registry/fittrack-backend:latest

# Push to registry
docker push your-registry/fittrack-backend:latest
```

---

## Cloud Platform Deployments

### Heroku Deployment

**Backend:**

```bash
# 1. Create Heroku app
heroku create fittrack-api

# 2. Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your-cleardb-host
heroku config:set JWT_SECRET=your-secret
# ... set other variables

# 3. Add MySQL (ClearDB)
heroku addons:create cleardb:ignite

# 4. Add Redis (Redis Cloud)
heroku addons:create heroku-redis:premium-0

# 5. Deploy
git push heroku main

# 6. Run migrations
heroku run npm run migrate
```

**Frontend (Netlify):**

```bash
# 1. Connect GitHub repo to Netlify

# 2. Set build settings:
# Build command: npm run build
# Publish directory: dist
# Environment variables: VITE_API_URL=https://fittrack-api.herokuapp.com/api

# 3. Deploy automatically on push
```

### AWS Deployment

**Using Elastic Beanstalk + RDS + ElastiCache:**

```bash
# 1. Install EB CLI
npm install -g @aws-amplify/cli

# 2. Initialize EB app
eb init -p "Node.js 18" fittrack

# 3. Create environment
eb create fittrack-prod

# 4. Set environment variables
eb setenv \
  NODE_ENV=production \
  DB_HOST=your-rds-endpoint \
  DB_USER=fittrack_user \
  DB_PASSWORD=your-password

# 5. Deploy
eb deploy

# 6. Configure RDS and ElastiCache in AWS Console
# 7. Update security groups for connectivity
```

### DigitalOcean App Platform

```yaml
name: fittrack
services:
- name: api
  github:
    repo: deepshikhathakur020105/FitTrack
    branch: main
  build_command: npm ci && npm run build
  run_command: npm start
  http_port: 5000
  envs:
  - key: NODE_ENV
    value: production
  - key: DB_HOST
    scope: RUN_TIME
    value: ${db.MYSQL_HOST}
  - key: DB_USER
    scope: RUN_TIME
    value: ${db.MYSQL_USER}
  - key: DB_PASSWORD
    scope: RUN_TIME
    value: ${db.MYSQL_PASSWORD}

- name: web
  github:
    repo: deepshikhathakur020105/FitTrack
    branch: main
    source_dir: frontend
  build_command: npm ci && npm run build
  http_port: 3000
  envs:
  - key: VITE_API_URL
    value: https://fittrack-api.ondigitalocean.app/api

databases:
- name: db
  engine: MYSQL
  version: "8"

redis:
- name: cache
  version: 7
```

---

## Security Configuration

### HTTPS/SSL

**Using Let's Encrypt with Certbot:**

```bash
sudo certbot certonly --standalone \
  -d your-domain.com \
  -d www.your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

### CORS Configuration

Update `backend/server.js`:

```javascript
app.use(cors({
  origin: [
    'https://your-domain.com',
    'https://www.your-domain.com'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

Already configured in backend. Adjust if needed in `.env`:

```bash
RATE_LIMIT_WINDOW_MS=900000    # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100    # requests per window
```

### Database Security

```sql
-- Restrict user permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON fittrack.* TO 'fittrack_user'@'%';
REVOKE ALL ON *.* FROM 'fittrack_user'@'%';

-- Enable SSL for MySQL connections
REQUIRE SSL;

-- Create backup user (read-only)
CREATE USER 'fittrack_backup'@'localhost' IDENTIFIED BY 'backup-password';
GRANT SELECT ON fittrack.* TO 'fittrack_backup'@'localhost';
```

---

## Monitoring & Logging

### Application Logging

Backend already uses Winston logger. For production:

```bash
# View logs
pm2 logs fittrack-api

# Or use: docker logs fittrack-api
```

### Error Tracking (Sentry)

**Install Sentry in backend:**

```bash
npm install @sentry/node @sentry/tracing
```

**Update `backend/server.js`:**

```javascript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### Performance Monitoring

**Health Check Endpoint:**

Already available at `/api/health`. Monitor regularly:

```bash
curl https://api.your-domain.com/api/health

# Response:
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00Z",
  "environment": "production",
  "uptime": 86400
}
```

### Database Monitoring

```bash
# Check connection pool
SHOW PROCESSLIST;

# Monitor disk usage
SELECT table_schema, 
       ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
FROM information_schema.tables
WHERE table_schema = 'fittrack'
GROUP BY table_schema;
```

---

## Post-Deployment

### Create Admin Account

```bash
# SSH into production server
ssh user@your-server

# Navigate to backend
cd /path/to/fittrack/backend

# Run setup script
node scripts/setupAdmin.js
# Follow prompts to create admin account
```

### Run Database Migrations

```bash
cd backend
npm run migrate
```

### Seed Initial Data (Optional)

```bash
npm run seed
```

### Verify Deployment

```bash
# Test API health
curl https://api.your-domain.com/api/health

# Test frontend
Open https://your-domain.com in browser

# Check login functionality
- Navigate to login page
- Use demo credentials from README
```

---

## Troubleshooting

### Database Connection Issues

```bash
# Test connection
mysql -h $DB_HOST -u $DB_USER -p$DB_PASSWORD -e "SELECT 1;"

# Check MySQL running
systemctl status mysql

# View MySQL error log
tail -f /var/log/mysql/error.log
```

### Frontend Not Loading

```bash
# Check if frontend build exists
ls -la frontend/dist/

# Check VITE_API_URL environment variable
echo $VITE_API_URL

# Clear browser cache and reload
```

### API Not Responding

```bash
# Check if service is running
systemctl status fittrack-api
# or
pm2 list

# Check port is listening
netstat -tlnp | grep 5000

# View recent logs
pm2 logs fittrack-api --lines 100
```

### CORS Errors

```bash
# Verify CORS configuration in .env
echo $FRONTEND_URL

# Check browser console for exact error
# Update CORS origin if needed in backend/server.js
```

### Email Not Sending

```bash
# Verify email credentials
# For Gmail: Use App Password, not regular password
# Check EMAIL_USER and EMAIL_PASSWORD in .env

# Test email service
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
});
transporter.verify((err, success) => console.log(err || success));
"
```

---

## Production Checklist

- [ ] All environment variables set securely
- [ ] HTTPS/SSL enabled and certificate auto-renewal configured
- [ ] Database backups automated and tested
- [ ] Redis cache configured and running
- [ ] Rate limiting configured appropriately
- [ ] Admin account created and secured
- [ ] Error tracking (Sentry) configured
- [ ] Logging system configured and monitored
- [ ] Health check endpoint monitored
- [ ] Database migrations completed
- [ ] Frontend build optimized and deployed
- [ ] DNS records configured correctly
- [ ] Firewall rules configured
- [ ] Database user permissions restricted
- [ ] Admin credentials stored securely
- [ ] Payment processing configured (if applicable)
- [ ] Analytics configured
- [ ] CDN configured for static assets (optional)
- [ ] Load balancer configured (for scaling)
- [ ] Auto-scaling policies configured (if cloud)
- [ ] Documentation updated for ops team

---

## Support & Rollback

### Quick Rollback

```bash
# Using Docker
docker pull your-registry/fittrack-backend:previous-version
docker tag your-registry/fittrack-backend:previous-version fittrack-backend:latest
docker restart fittrack-api

# Using Git
git revert HEAD
git push production main
```

### Getting Help

- Check application logs: `pm2 logs` or `docker logs`
- Review error tracking: Sentry dashboard
- Check database: MySQL command line
- Review deployment logs: Heroku/AWS/DigitalOcean dashboard
