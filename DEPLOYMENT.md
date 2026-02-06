# Linky Deployment Guide

This guide covers deploying Linky to production using Docker Compose.

## Prerequisites

- Docker 20.10+ and Docker Compose V2
- A server with at least 4GB RAM and 20GB disk space
- A domain name pointed to your server
- SSL certificates (Let's Encrypt recommended)

## Quick Start

### 1. Clone and Configure

```bash
# Clone the repository
git clone <your-repo-url>
cd linky

# Copy production environment template
cp .env.production .env

# Edit .env with your actual values
nano .env
```

### 2. Set Up SSL Certificates

```bash
# Create certs directory
mkdir -p docker/nginx/certs

# Option A: Use Let's Encrypt (recommended)
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem docker/nginx/certs/cert.pem
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem docker/nginx/certs/key.pem

# Option B: Use self-signed (development only)
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout docker/nginx/certs/key.pem \
  -out docker/nginx/certs/cert.pem
```

### 3. Build and Deploy

```bash
# Build the application
docker compose build

# Start all services
docker compose up -d

# Check service health
docker compose ps

# View logs
docker compose logs -f app
```

### 4. Initialize Database

```bash
# Run database migrations
docker compose exec app npm run db:push

# Verify database connection
docker compose exec db psql -U linky -c "SELECT version();"
```

### 5. Configure Stripe Webhooks

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy webhook signing secret to `.env` as `STRIPE_WEBHOOK_SECRET`
5. Restart app: `docker compose restart app`

### 6. Configure PostHog

1. Access PostHog: `http://yourdomain.com/posthog/`
2. Complete initial setup wizard
3. Copy Project API Key to `.env` as `POSTHOG_KEY`
4. Copy Personal API Key to `.env` as `POSTHOG_PERSONAL_API_KEY`
5. Restart app: `docker compose restart app`

## Production Checklist

- [ ] Strong passwords set for all databases
- [ ] SSL certificates configured and auto-renewing
- [ ] Firewall configured (allow 80, 443 only)
- [ ] Backups configured for volumes
- [ ] Environment variables secured
- [ ] Stripe webhook endpoint verified
- [ ] PostHog analytics working
- [ ] DNS records configured
- [ ] Monitoring/alerting set up

## Maintenance

### Backups

```bash
# Backup database
docker compose exec db pg_dump -U linky linky > backup.sql

# Backup volumes
docker run --rm \
  -v linky_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/postgres_backup.tar.gz /data
```

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
docker compose build app
docker compose up -d app

# Run migrations if needed
docker compose exec app npm run db:push
```

### Scaling

For high traffic, consider:
- Moving database to managed service (RDS, DigitalOcean, etc.)
- Using external Redis (ElastiCache, Redis Cloud)
- Multiple app replicas behind load balancer
- CDN for static assets (CloudFlare, AWS CloudFront)

## Monitoring

### Health Checks

```bash
# Application health
curl https://yourdomain.com/api/health

# Service status
docker compose ps

# Resource usage
docker stats
```

### Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f app

# Last 100 lines
docker compose logs --tail=100 app
```

## Troubleshooting

### Application won't start

```bash
# Check logs
docker compose logs app

# Verify environment variables
docker compose exec app printenv | grep DATABASE_URL

# Test database connection
docker compose exec db psql -U linky -c "SELECT 1"
```

### Database connection issues

```bash
# Check database health
docker compose ps db

# Restart database
docker compose restart db

# Check network connectivity
docker compose exec app ping db
```

### SSL certificate issues

```bash
# Verify certificates exist
ls -la docker/nginx/certs/

# Check certificate validity
openssl x509 -in docker/nginx/certs/cert.pem -noout -dates

# Restart nginx
docker compose restart nginx
```

## Security Best Practices

1. **Environment Variables**: Never commit `.env` to git
2. **Database**: Use strong passwords, change defaults
3. **Updates**: Regularly update Docker images
4. **Backups**: Automated daily backups to off-site location
5. **Monitoring**: Set up alerts for downtime and errors
6. **Firewall**: Only expose ports 80 and 443
7. **SSL**: Use valid certificates, enable HSTS
8. **Rate Limiting**: Nginx configured with rate limits

## Support

For issues and questions:
- GitHub Issues: <your-repo-url>/issues
- Documentation: <your-docs-url>
