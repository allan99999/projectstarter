# Deployment Reference

Complete guide to deploying Express.js backends with Docker, PM2, and CI/CD pipelines.

## Docker Configuration

### Dockerfile

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Copy source code
COPY src ./src

# Build TypeScript
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built app from builder
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start application
CMD ["node", "dist/server.js"]
```

### Development Dockerfile

Create `Dockerfile.dev`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source
COPY . .

# Expose port and debugger
EXPOSE 3000 9229

# Start with nodemon
CMD ["npm", "run", "dev"]
```

### .dockerignore

Create `.dockerignore`:

```
node_modules
npm-debug.log
dist
.env
.git
.gitignore
README.md
.vscode
.idea
coverage
.nyc_output
logs
*.log
.DS_Store
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: backend-app
    restart: unless-stopped
    ports:
      - '3000:3000'
    environment:
      - NODE_ENV=production
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    networks:
      - app-network
    volumes:
      - ./logs:/app/logs

  postgres:
    image: postgres:15-alpine
    container_name: backend-postgres
    restart: unless-stopped
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    container_name: backend-redis
    restart: unless-stopped
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
    networks:
      - app-network

  nginx:
    image: nginx:alpine
    container_name: backend-nginx
    restart: unless-stopped
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - app
    networks:
      - app-network

volumes:
  postgres_data:
  redis_data:

networks:
  app-network:
    driver: bridge
```

### Development Docker Compose

Create `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile.dev
    container_name: backend-app-dev
    ports:
      - '3000:3000'
      - '9229:9229' # Debugger
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://postgres:password@postgres:5432/mydb
      - REDIS_URL=redis://redis:6379
    volumes:
      - .:/app
      - /app/node_modules
    depends_on:
      - postgres
      - redis
    networks:
      - app-network

  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mydb
    ports:
      - '5432:5432'
    volumes:
      - postgres_dev_data:/var/lib/postgresql/data
    networks:
      - app-network

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    networks:
      - app-network

volumes:
  postgres_dev_data:

networks:
  app-network:
    driver: bridge
```

### Docker Commands

```bash
# Build image
docker build -t backend-app .

# Build development image
docker build -f Dockerfile.dev -t backend-app:dev .

# Run container
docker run -p 3000:3000 --env-file .env backend-app

# Docker Compose
docker-compose up -d
docker-compose down
docker-compose logs -f app

# Development
docker-compose -f docker-compose.dev.yml up
```

## PM2 Configuration

### PM2 Ecosystem File

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'backend-app',
      script: './dist/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      kill_timeout: 5000,
    },
  ],
};
```

### PM2 Commands

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Start in development
pm2 start ecosystem.config.js --env development

# Restart
pm2 restart backend-app

# Stop
pm2 stop backend-app

# Delete
pm2 delete backend-app

# Monitor
pm2 monit

# Logs
pm2 logs backend-app

# List processes
pm2 list

# Save process list
pm2 save

# Setup startup script
pm2 startup
pm2 save

# Update PM2
pm2 update
```

## Nginx Configuration

Create `nginx.conf`:

```nginx
events {
  worker_connections 1024;
}

http {
  upstream backend {
    least_conn;
    server app:3000;
  }

  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
  limit_req_status 429;

  server {
    listen 80;
    server_name api.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name api.example.com;

    # SSL configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;

    # Client body size
    client_max_body_size 10M;

    # Timeouts
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
    proxy_read_timeout 60s;

    location / {
      # Rate limiting
      limit_req zone=api burst=20 nodelay;

      proxy_pass http://backend;
      proxy_http_version 1.1;

      # Headers
      proxy_set_header Upgrade $http_upgrade;
      proxy_set_header Connection 'upgrade';
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
      access_log off;
      proxy_pass http://backend/health;
    }

    # API documentation
    location /api-docs {
      proxy_pass http://backend/api-docs;
    }
  }
}
```

## GitHub Actions CI/CD

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run type-check

      - name: Run tests
        run: npm test
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test
          REDIS_URL: redis://localhost:6379

      - name: Build
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Login to Docker Hub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/backend-app:latest
            ${{ secrets.DOCKER_USERNAME }}/backend-app:${{ github.sha }}

      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /app
            docker-compose pull
            docker-compose up -d
            docker system prune -af
```

## Environment Variables

Create `.env.production.example`:

```env
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@host:5432/database
POSTGRES_HOST=
POSTGRES_PORT=5432
POSTGRES_DB=
POSTGRES_USER=
POSTGRES_PASSWORD=

# Redis
REDIS_URL=redis://host:6379
REDIS_HOST=
REDIS_PORT=6379
REDIS_PASSWORD=

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com

# Logging
LOG_LEVEL=info

# Email (if using)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=

# External APIs
API_KEY=
```

## Health Check Endpoint

Create `src/routes/health.routes.ts`:

```typescript
import { Router } from 'express';
import prisma from '../config/database';
import redisClient from '../config/redis';

const router = Router();

router.get('/health', async (req, res) => {
  try {
    // Check database
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis
    await redisClient.ping();

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
```

## Deployment Checklist

### Before Deployment
- [ ] Update environment variables
- [ ] Run tests and ensure all pass
- [ ] Build and test Docker image locally
- [ ] Review security configurations
- [ ] Check database migrations
- [ ] Update API documentation
- [ ] Test health check endpoint

### Security
- [ ] Change all default passwords
- [ ] Use strong JWT secret
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Enable rate limiting
- [ ] Set up firewall rules
- [ ] Use environment variables for secrets

### Performance
- [ ] Enable Gzip compression
- [ ] Configure caching
- [ ] Set up CDN (if needed)
- [ ] Optimize database queries
- [ ] Configure connection pooling
- [ ] Set appropriate timeouts

### Monitoring
- [ ] Set up logging
- [ ] Configure error tracking (Sentry)
- [ ] Enable performance monitoring
- [ ] Set up uptime monitoring
- [ ] Configure alerts

### Backup
- [ ] Set up database backups
- [ ] Configure backup retention
- [ ] Test restore procedure
- [ ] Document recovery process

## Useful Commands

```bash
# Docker
docker-compose up -d --build
docker-compose logs -f
docker-compose exec app npm run migrate
docker system prune -af

# PM2
pm2 start ecosystem.config.js --env production
pm2 reload all
pm2 logs --lines 100

# Database
npm run migrate:deploy
npm run db:seed

# Health check
curl http://localhost:3000/health

# View logs
tail -f logs/combined.log
tail -f logs/error.log
```

## Best Practices

### Docker
- Use multi-stage builds
- Run as non-root user
- Implement health checks
- Optimize layer caching
- Keep images small

### Security
- Never commit secrets
- Use secrets management
- Implement rate limiting
- Keep dependencies updated
- Enable security headers

### Reliability
- Implement graceful shutdown
- Use process managers (PM2)
- Set up health checks
- Configure auto-restart
- Monitor resource usage

### Performance
- Use clustering
- Enable caching
- Optimize database
- Configure load balancing
- Monitor and profile
