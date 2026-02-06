# Linky - Self-Hosted Link in Bio

A fully-featured, self-hosted Linktree alternative built with modern open-source technologies.

## Features

- 🔗 **Link Management**: Create, edit, reorder, and toggle links
- 🎨 **Theme Customization**: Colors, fonts, and button styles
- 📊 **Analytics**: Self-hosted PostHog for click tracking (Pro)
- 💳 **Subscriptions**: Stripe integration for Pro features
- 🔒 **Authentication**: Secure email/password auth with BetterAuth
- ⚡ **Performance**: ISR for fast static pages
- 🐳 **Self-Hosted**: Complete Docker setup included
- 📈 **Observability**: OpenTelemetry support (optional)

## Tech Stack

All infrastructure is **open source** and **self-hostable**:

| Component | Technology | License |
|-----------|------------|---------|
| Framework | Next.js 14+ (App Router) | MIT |
| Database | PostgreSQL 16 | PostgreSQL |
| Cache | ValKey 8 (Redis fork) | BSD-3 |
| Auth | BetterAuth | MIT |
| Analytics | PostHog (self-hosted) | MIT |
| Payments | Stripe | - |
| ORM | Drizzle | Apache 2.0 |
| Observability | OpenTelemetry, Jaeger, Prometheus, Grafana | Apache 2.0 / AGPL |

## Quick Start

### Development

```bash
# Clone repository
git clone <your-repo>
cd linky

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your values

# Start development services
docker compose -f docker-compose.dev.yml up -d

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

Visit `http://localhost:3000` to see the app.

### Production

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete production deployment instructions.

## Project Structure

```
linky/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── (public)/          # Public link pages
│   └── api/               # API routes
├── components/            # React components
├── lib/                   # Utilities and clients
│   ├── db/               # Database schema and queries
│   ├── auth.ts           # BetterAuth config
│   ├── stripe.ts         # Stripe client
│   ├── posthog.ts        # PostHog client
│   └── telemetry.ts      # OpenTelemetry
├── docker/                # Docker configurations
│   ├── Dockerfile        # Production build
│   ├── nginx/            # Nginx config
│   ├── otel/             # OpenTelemetry config
│   ├── prometheus/       # Prometheus config
│   └── grafana/          # Grafana config
├── docker-compose.yml     # Production orchestration
└── docker-compose.dev.yml # Development environment
```

## Features

### Free Tier
- Up to 5 links
- Basic themes
- Public link page
- Basic analytics

### Pro Tier ($9/month)
- Unlimited links
- Advanced themes
- Detailed analytics with PostHog
- Remove branding
- Priority support

## Development

```bash
# Run tests (when implemented)
npm run test

# Lint code
npm run lint

# Format code
npm run format

# Database operations
npm run db:generate  # Generate migrations
npm run db:push      # Apply schema to database
npm run db:studio    # Open Drizzle Studio
```

## API Documentation

### Authentication
- `POST /api/register` - Create new account
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out

### Links
- `GET /api/links` - List user's links
- `POST /api/links` - Create link
- `PATCH /api/links/[id]` - Update link
- `DELETE /api/links/[id]` - Delete link
- `POST /api/links/reorder` - Reorder links

### Payments
- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Create billing portal session
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Utilities
- `POST /api/clicks` - Track link click
- `POST /api/revalidate` - Trigger ISR revalidation
- `GET /api/health` - Health check

## Environment Variables

See `.env.example` for all required environment variables.

Key variables:
- `DATABASE_URL` - PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth encryption key
- `STRIPE_SECRET_KEY` - Stripe API key
- `NEXT_PUBLIC_POSTHOG_KEY` - PostHog project key

## Contributing

Contributions welcome! Please read our contributing guidelines first.

## License

MIT License - see LICENSE file for details

## Support

- Issues: GitHub Issues
- Documentation: See `/docs` folder
- Deployment Help: See [DEPLOYMENT.md](./DEPLOYMENT.md)

## Roadmap

- [x] Core link management
- [x] Theme customization
- [x] Authentication
- [x] Stripe payments
- [x] PostHog analytics
- [x] Docker deployment
- [ ] OAuth providers (Google, GitHub)
- [ ] Custom domains
- [ ] Link scheduling
- [ ] QR code generation
- [ ] Comprehensive test suite

## Acknowledgments

Built with these amazing open-source projects:
- [Next.js](https://nextjs.org)
- [BetterAuth](https://better-auth.com)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostHog](https://posthog.com)
- [Stripe](https://stripe.com)
- [ValKey](https://valkey.io)
