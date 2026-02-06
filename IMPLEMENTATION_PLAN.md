# Linky - Implementation Plan

A self-hosted Linktree alternative with Next.js, BetterAuth, PostgreSQL, PostHog, Stripe, and OpenTelemetry observability.

## Tech Stack

All core infrastructure components are open source and self-hosted.

| Category | Technology |
|----------|------------|
| Frontend/Backend | Next.js 14+ (App Router, MIT) |
| Auth | BetterAuth (MIT) |
| Database | PostgreSQL 16 + Drizzle ORM |
| Cache | ValKey 8 (BSD-3, Redis fork) |
| Analytics | PostHog (self-hosted, MIT) |
| Payments | Stripe (Free + Pro tiers) |
| Infrastructure | Docker + Docker Compose |
| Static Generation | ISR with webhook-triggered rebuilds |
| Testing | Vitest + React Testing Library + Playwright |
| Observability | OpenTelemetry (Apache 2.0) → Jaeger (Apache 2.0) + Prometheus (Apache 2.0) + Grafana OSS (AGPL) |
| Event Storage | ClickHouse (Apache 2.0) |

---

## Ralph Loop Usage

This implementation plan is designed to be executed as a Ralph Loop for iterative, autonomous development.

### Running as Ralph Loop

```bash
/ralph-loop "Execute the next uncompleted task in IMPLEMENTATION_PLAN.md. After completing each task, create a git commit with a descriptive message following the repository's commit style. Mark the task as complete in the plan. When all tasks are complete, output <promise>LINKY IMPLEMENTATION COMPLETE</promise>" --completion-promise "LINKY IMPLEMENTATION COMPLETE" --max-iterations 100
```

### Workflow for Each Task

1. **Read the plan** - Identify the next uncompleted task in sequence
2. **Execute the task** - Complete all subtasks and validation steps
3. **Verify completion** - Run validation checks listed for that phase
4. **Commit to git** - Create a descriptive commit for the completed task:
   ```bash
   git add .
   git commit -m "<task-description>

   Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
   ```
5. **Update the plan** - Mark the task as complete by changing `[ ]` to `[x]`
6. **Continue** - Move to the next task until all phases are complete

### Git Commit Guidelines

- **Scope**: One commit per major task (e.g., "Add BetterAuth configuration" for task 3.1)
- **Message format**: Use imperative mood (e.g., "Add", "Create", "Implement", "Configure")
- **Detail**: Include what was done and why if not obvious
- **Co-authorship**: Always include the Co-Authored-By tag

### Completion Criteria

The Ralph Loop completes when:
- All checkboxes in all phases are marked `[x]`
- All validation criteria pass
- Final verification checklist is complete
- The completion promise `<promise>LINKY IMPLEMENTATION COMPLETE</promise>` is output

---

## Phase 1: Project Setup & Infrastructure

### Tasks

- [x] **1.1** Initialize Next.js 14+ project with TypeScript and App Router
- [x] **1.2** Configure ESLint, Prettier, and TypeScript strict mode
- [x] **1.3** Create project directory structure
  ```
  src/
  ├── app/
  │   ├── (auth)/login/, register/
  │   ├── (dashboard)/dashboard/, settings/, analytics/
  │   ├── (public)/[username]/
  │   └── api/auth/, webhooks/, revalidate/
  ├── components/
  ├── lib/auth.ts, db/, posthog.ts, stripe.ts, telemetry.ts
  └── types/
  ```
- [x] **1.4** Create `docker-compose.dev.yml` with services:
  - `app`: Next.js dev server with hot reload
  - `db`: PostgreSQL 16-alpine
  - `valkey`: ValKey 8 (open-source Redis fork)
  - `clickhouse`: ClickHouse for PostHog
  - `posthog`: PostHog self-hosted
- [x] **1.5** Create `Dockerfile.dev` for development
- [x] **1.6** Create `.env.example` with all required variables
- [x] **1.7** Create `.env.local` from example (gitignored)
- [x] **1.8** Install core dependencies: drizzle-orm, better-auth, stripe, posthog-js, posthog-node
- [x] **1.9** Configure path aliases in `tsconfig.json`

### Validation

- [x] `docker compose -f docker-compose.dev.yml up` starts all services
- [x] `http://localhost:3000` shows Next.js default page
- [x] PostgreSQL accessible at `localhost:5432`
- [x] ValKey accessible at `localhost:6379`
- [x] Environment variables load correctly

---

## Phase 2: Database Schema

### Tasks

- [x] **2.1** Install Drizzle ORM and drizzle-kit
- [x] **2.2** Create `drizzle.config.ts` configuration
- [x] **2.3** Create `src/lib/db/index.ts` - database connection
- [x] **2.4** Create `src/lib/db/schema.ts` with tables:
  - `users` (id, email, username, name, bio, avatarUrl, theme, isPro, stripeCustomerId, timestamps)
  - `links` (id, userId, title, url, icon, position, isActive, clicks, timestamps)
  - `linkClicks` (id, linkId, referrer, userAgent, country, city, timestamp)
  - `subscriptions` (id, userId, stripeSubscriptionId, stripePriceId, status, periodStart, periodEnd)
  - BetterAuth required tables (sessions, accounts, verifications)
- [x] **2.5** Create `src/lib/db/queries.ts` - typed query helpers
- [x] **2.6** Generate initial migration: `npx drizzle-kit generate`
- [x] **2.7** Apply migration: `npx drizzle-kit push`
- [x] **2.8** Add npm scripts: `db:generate`, `db:push`, `db:studio`

### Validation

- [x] `npm run db:push` applies schema to database
- [x] `npm run db:studio` opens Drizzle Studio
- [x] All tables visible in database
- [x] Foreign key constraints work correctly
- [x] Unique constraints on email and username enforced

---

## Phase 3: Authentication (BetterAuth)

### Tasks

- [x] **3.1** Create `src/lib/auth.ts` - BetterAuth configuration
  - PostgreSQL adapter
  - Email/password provider
  - Session configuration
- [x] **3.2** Create `src/app/api/auth/[...all]/route.ts` - API handler
- [x] **3.3** Create auth context provider `src/components/providers/AuthProvider.tsx`
- [x] **3.4** Create `src/app/(auth)/layout.tsx` - auth pages layout
- [x] **3.5** Create `src/app/(auth)/login/page.tsx` - login form
- [x] **3.6** Create `src/app/(auth)/register/page.tsx` - registration with username
- [x] **3.7** Create `src/middleware.ts` - route protection
  - Protect `/dashboard/*` routes
  - Redirect authenticated users from auth pages
- [x] **3.8** Create `src/lib/auth-client.ts` - client-side auth hooks
- [ ] **3.9** Add OAuth providers (Google, GitHub) - optional

### Validation

- [x] Registration creates user with unique username
- [x] Login creates session and sets cookie
- [x] Protected routes redirect to login
- [x] Authenticated users redirected from /login to /dashboard
- [x] Logout clears session
- [x] Session persists across page reloads

---

## Phase 4: Static Link Pages

### Tasks

- [x] **4.1** Create `src/app/(public)/[username]/page.tsx`
  - `generateStaticParams()` for all usernames
  - `revalidate = 3600` (1 hour default)
  - Fetch user and links from database
- [x] **4.2** Create `src/components/LinkPage.tsx` - public page UI
  - Avatar display
  - Bio section
  - Link list with icons
  - Theme styling
- [x] **4.3** Create `src/components/LinkButton.tsx` - styled link buttons
- [x] **4.4** Create `src/app/api/revalidate/route.ts` - ISR webhook
  - Validate secret token
  - Accept username parameter
  - Call `revalidatePath('/[username]')`
- [x] **4.5** Create click tracking on link buttons (client-side for now)
- [x] **4.6** Add 404 handling for non-existent usernames
- [x] **4.7** Add meta tags and OpenGraph for sharing
- [x] **4.8** Implement responsive design (mobile-first)

### Validation

- [x] `/testuser` renders static page with links
- [x] Page rebuilds after revalidate webhook
- [x] 404 shows for non-existent usernames
- [x] Mobile layout works correctly
- [x] OpenGraph preview works when sharing

---

## Phase 5: Dashboard

### Tasks

- [x] **5.1** Create `src/app/(dashboard)/layout.tsx` - protected layout
  - Sidebar navigation
  - User avatar/menu
  - Mobile responsive
- [x] **5.2** Create `src/app/(dashboard)/dashboard/page.tsx` - overview
  - Total links count
  - Total clicks (if Pro)
  - Quick actions
- [x] **5.3** Create `src/app/(dashboard)/links/page.tsx` - link management
- [x] **5.4** Create `src/components/dashboard/LinkEditor.tsx`
  - Add/edit link form
  - URL validation
  - Icon selector
- [x] **5.5** Create `src/components/dashboard/LinkList.tsx`
  - Drag-and-drop reordering (dnd-kit)
  - Toggle visibility
  - Delete with confirmation
- [x] **5.6** Create `src/app/(dashboard)/appearance/page.tsx`
  - Background color picker
  - Button style options
  - Font selection
  - Live preview iframe
- [x] **5.7** Create `src/app/(dashboard)/settings/page.tsx`
  - Profile editing (name, bio, avatar)
  - Username change
  - Danger zone (delete account)
- [x] **5.8** Implement server actions for CRUD operations
- [x] **5.9** Add optimistic updates with React Query or SWR
- [x] **5.10** Trigger revalidation webhook on link/profile changes

### Validation

- [x] Create, edit, delete links works
- [x] Drag-and-drop reordering persists
- [x] Theme changes preview in real-time
- [x] Public page reflects changes after save
- [x] Free users limited to 5 links

---

## Phase 6: PostHog Integration (Self-Hosted)

### Tasks

#### PostHog Infrastructure
- [x] **6.1** Add PostHog services to docker-compose:
  ```yaml
  posthog:
    image: posthog/posthog:latest
    depends_on:
      - posthog-db
      - posthog-valkey
      - clickhouse
    environment:
      DATABASE_URL: postgres://posthog:posthog@posthog-db:5432/posthog
      REDIS_URL: redis://posthog-valkey:6379
      CLICKHOUSE_HOST: clickhouse
      SECRET_KEY: <generate-secret>
      SITE_URL: http://localhost:8000
    ports:
      - "8000:8000"

  posthog-db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: posthog
      POSTGRES_USER: posthog
      POSTGRES_PASSWORD: posthog
    volumes:
      - posthog_db_data:/var/lib/postgresql/data

  posthog-valkey:
    image: valkey/valkey:8-alpine
    volumes:
      - posthog_valkey_data:/data

  clickhouse:
    image: clickhouse/clickhouse-server:latest
    volumes:
      - clickhouse_data:/var/lib/clickhouse
    ulimits:
      nofile:
        soft: 262144
        hard: 262144
  ```
- [x] **6.2** Create PostHog volume mounts for persistence
- [x] **6.3** Configure PostHog initial setup (project, API key)
- [x] **6.4** Set up PostHog behind nginx reverse proxy (production)

#### Application Integration
- [x] **6.5** Create `src/lib/posthog.ts` - PostHog client setup
  - Point to self-hosted instance (http://localhost:8000 dev, https://posthog.yourdomain.com prod)
- [x] **6.6** Create `src/components/providers/PostHogProvider.tsx`
- [x] **6.7** Add PostHog provider to root layout
- [x] **6.8** Implement client-side tracking:
  - `page_viewed` on public pages
  - `link_clicked` with linkId, title, username
  - `dashboard_action` for key actions
- [x] **6.9** Create `src/lib/posthog-server.ts` - server-side client
- [x] **6.10** Implement server-side click tracking with full metadata
- [x] **6.11** Store clicks in `linkClicks` table for Pro users
- [x] **6.12** Create `src/app/(dashboard)/analytics/page.tsx` (Pro only)
  - Clicks over time chart
  - Top performing links
  - Traffic sources
  - Geographic distribution
- [x] **6.13** Configure feature flags in PostHog for Pro features

### Environment Variables
```env
# PostHog (Self-Hosted)
NEXT_PUBLIC_POSTHOG_KEY=phc_your_project_api_key
NEXT_PUBLIC_POSTHOG_HOST=http://localhost:8000  # dev
# NEXT_PUBLIC_POSTHOG_HOST=https://posthog.yourdomain.com  # prod
POSTHOG_PERSONAL_API_KEY=phx_your_personal_api_key  # for server-side
```

### Validation

- [x] PostHog UI accessible at `http://localhost:8000`
- [x] Initial setup completed (project created)
- [x] Events appear in PostHog dashboard
- [x] Link clicks tracked with correct properties
- [x] Analytics page shows data for Pro users
- [x] Free users see upgrade prompt on analytics page
- [x] Feature flags work correctly
- [x] ClickHouse ingesting events properly

---

## Phase 7: Stripe Integration

### Tasks

- [ ] **7.1** Create `src/lib/stripe.ts` - Stripe client and helpers
- [ ] **7.2** Create Stripe products and prices in dashboard
  - Pro plan: $9/month
- [ ] **7.3** Create `src/app/api/stripe/checkout/route.ts`
  - Create checkout session
  - Include userId in metadata
  - Configure success/cancel URLs
- [ ] **7.4** Create `src/app/api/stripe/portal/route.ts`
  - Create billing portal session
- [ ] **7.5** Create `src/app/api/webhooks/stripe/route.ts`
  - Verify webhook signature
  - Handle `checkout.session.completed`
  - Handle `customer.subscription.updated`
  - Handle `customer.subscription.deleted`
  - Handle `invoice.payment_failed`
- [ ] **7.6** Add billing section to settings page
  - Show current plan
  - Upgrade button (Free users)
  - Manage subscription button (Pro users)
- [ ] **7.7** Implement Pro feature gating
  - Unlimited links
  - Advanced themes
  - Analytics access
  - Remove branding
- [ ] **7.8** Add Stripe CLI for local webhook testing
- [ ] **7.9** Handle subscription status in middleware

### Validation

- [ ] Checkout redirects to Stripe
- [ ] Webhook updates user to Pro after payment
- [ ] Pro features unlock immediately
- [ ] Billing portal accessible
- [ ] Subscription cancellation downgrades user
- [ ] Link limit enforced for free users

---

## Phase 8: Production Docker Setup

### Tasks

- [ ] **8.1** Create `docker/Dockerfile` - multi-stage production build
  ```dockerfile
  FROM node:20-alpine AS builder
  # Build stage
  FROM node:20-alpine AS runner
  # Production stage with standalone output
  ```
- [ ] **8.2** Create `docker-compose.yml` - production orchestration
  - app, db, valkey, nginx services
  - PostHog stack (posthog, posthog-db, posthog-valkey, clickhouse)
  - Named volumes for data persistence
  - Health checks
- [ ] **8.3** Create `docker/nginx/nginx.conf`
  - Reverse proxy to app
  - SSL termination
  - Gzip compression
  - Security headers
- [ ] **8.4** Configure Next.js `output: 'standalone'` in next.config.js
- [ ] **8.5** Create production environment file template
- [ ] **8.6** Add Docker healthcheck endpoints
- [ ] **8.7** Configure container resource limits
- [ ] **8.8** Create `docker-compose.override.yml` for local overrides
- [ ] **8.9** Document deployment process

### Validation

- [ ] `docker compose build` succeeds
- [ ] `docker compose up -d` starts all services
- [ ] App accessible via nginx on port 80
- [ ] SSL works with valid certificate
- [ ] Database data persists across restarts
- [ ] Logs accessible via `docker compose logs`

---

## Phase 9: OpenTelemetry Observability

### Tasks

- [ ] **9.1** Add observability services to docker-compose.yml:
  - otel-collector
  - jaeger
  - prometheus
  - grafana
- [ ] **9.2** Create `docker/otel/otel-collector-config.yaml`
  - OTLP receivers (gRPC + HTTP)
  - Batch processor
  - Jaeger and Prometheus exporters
- [ ] **9.3** Create `docker/prometheus/prometheus.yml`
  - Scrape config for otel-collector
  - App metrics endpoint
- [ ] **9.4** Create `docker/grafana/provisioning/`
  - Datasources (Prometheus, Jaeger)
  - Pre-built dashboards
- [ ] **9.5** Install OpenTelemetry packages
  - @opentelemetry/sdk-node
  - @opentelemetry/auto-instrumentations-node
  - @opentelemetry/exporter-trace-otlp-http
  - @opentelemetry/exporter-metrics-otlp-http
- [ ] **9.6** Create `src/lib/telemetry.ts` - SDK initialization
- [ ] **9.7** Create `src/instrumentation.ts` - Next.js instrumentation hook
- [ ] **9.8** Add custom spans for:
  - Database queries (`tracedDbQuery`)
  - Stripe operations (`tracedStripeCall`)
  - Auth operations
- [ ] **9.9** Add environment variables for OTel configuration
- [ ] **9.10** Create Grafana dashboards:
  - Application Overview (request rate, latency, errors)
  - Database Performance
  - Stripe Operations
  - User Activity

### Validation

- [ ] Jaeger UI shows traces at `http://localhost:16686`
- [ ] Prometheus shows metrics at `http://localhost:9090`
- [ ] Grafana dashboards populated at `http://localhost:3001`
- [ ] Database queries appear as spans
- [ ] Stripe calls appear as spans
- [ ] Custom metrics visible in Prometheus

---

## Phase 10: Comprehensive Testing

### Tasks

#### Test Infrastructure Setup
- [ ] **10.1** Install test dependencies
  - vitest, @vitejs/plugin-react, vite-tsconfig-paths
  - @testing-library/react, @testing-library/jest-dom
  - @playwright/test
  - msw (Mock Service Worker)
  - @testcontainers/postgresql
- [ ] **10.2** Create `vitest.config.ts`
- [ ] **10.3** Create `playwright.config.ts`
- [ ] **10.4** Create `__tests__/setup.ts` - test setup file
- [ ] **10.5** Create `docker-compose.test.yml` with stripe-mock

#### Mock Infrastructure
- [ ] **10.6** Create `__tests__/mocks/handlers/stripe.ts`
  - Checkout session endpoints
  - Customer endpoints
  - Subscription endpoints
  - Billing portal endpoints
- [ ] **10.7** Create `__tests__/mocks/factories/stripe-events.ts`
  - `createStripeEvent()` factory
  - `signStripeWebhook()` signature generator
  - Pre-built fixtures (checkoutCompleted, subscriptionCanceled, etc.)
- [ ] **10.8** Create `__tests__/mocks/handlers/posthog.ts`
  - Mock self-hosted PostHog endpoints
  - Capture endpoint with event storage
  - Decide endpoint for feature flags
  - `getCapturedEvents()` for assertions
- [ ] **10.9** Create `__tests__/mocks/handlers/betterauth.ts`
  - Register/login endpoints
  - Session management
  - `createMockUser()` and `createMockSession()` helpers
- [ ] **10.10** Create `__tests__/mocks/server.ts` - MSW server setup
- [ ] **10.11** Create `__tests__/mocks/vitest-mocks.ts` - SDK mocks

#### Unit Tests
- [ ] **10.12** Create `__tests__/unit/lib/db/queries.test.ts`
  - User CRUD operations
  - Link CRUD operations
  - Unique constraint tests
  - Link limit enforcement
- [ ] **10.13** Create `__tests__/unit/lib/auth.test.ts`
  - Password hashing
  - Session validation
  - Token expiration
- [ ] **10.14** Create `__tests__/unit/lib/stripe.test.ts`
  - Checkout session creation
  - Subscription helpers
- [ ] **10.15** Create `__tests__/unit/api/webhooks/stripe.test.ts`
  - checkout.session.completed handling
  - subscription.deleted handling
  - Invalid signature rejection
- [ ] **10.16** Create `__tests__/unit/components/LinkEditor.test.tsx`
  - Render with existing data
  - URL validation
  - onSave callback
- [ ] **10.17** Create `__tests__/unit/components/LinkList.test.tsx`
  - Render link list
  - Delete confirmation
  - Toggle visibility

#### Integration Tests
- [ ] **10.18** Create `__tests__/integration/auth-flow.test.ts`
  - Full registration → login → dashboard flow
  - Session persistence
- [ ] **10.19** Create `__tests__/integration/link-management.test.ts`
  - CRUD operations with database
  - Reordering
  - Link limits
- [ ] **10.20** Create `__tests__/integration/subscription.test.ts`
  - Checkout flow with stripe-mock
  - Webhook processing
  - Feature unlocking
- [ ] **10.21** Create `__tests__/helpers/test-db.ts` - test database utilities

#### End-to-End Tests
- [ ] **10.22** Create `__tests__/e2e/auth.spec.ts`
  - Registration flow
  - Login flow
  - Logout flow
- [ ] **10.23** Create `__tests__/e2e/dashboard.spec.ts`
  - Link creation
  - Link editing
  - Drag-and-drop reordering
  - Theme customization
- [ ] **10.24** Create `__tests__/e2e/public-page.spec.ts`
  - Page display
  - Link clicks
  - Theme rendering
- [ ] **10.25** Create `__tests__/e2e/stripe-checkout.spec.ts`
  - Upgrade flow
  - Pro features unlock
- [ ] **10.26** Create `__tests__/e2e/fixtures/test-user.ts` - test data helpers

#### CI/CD Pipeline
- [ ] **10.27** Create `.github/workflows/test.yml`
  - Unit tests job
  - Integration tests job (with Postgres service)
  - E2E tests job (with Playwright)
  - Coverage reporting
- [ ] **10.28** Add npm scripts to package.json
  - `test`, `test:unit`, `test:integration`, `test:e2e`, `test:all`

### Validation

- [ ] `npm run test:unit` passes with 80%+ coverage
- [ ] `npm run test:integration` passes with Testcontainers
- [ ] `npm run test:e2e` passes across Chrome, Firefox, Safari
- [ ] CI pipeline runs on push and PR
- [ ] Coverage reports uploaded to Codecov
- [ ] All third-party API calls properly mocked

---

## Final Verification Checklist

### Functional Tests
- [ ] User can register with unique username
- [ ] User can log in and access dashboard
- [ ] User can create, edit, delete, and reorder links
- [ ] User can customize theme (colors, fonts, button styles)
- [ ] Public page displays user's links correctly
- [ ] Link clicks are tracked
- [ ] User can upgrade to Pro via Stripe
- [ ] Pro features unlock after payment
- [ ] User can manage subscription in billing portal
- [ ] Analytics dashboard shows click data (Pro only)

### Infrastructure Tests
- [ ] All Docker services start correctly
- [ ] Database migrations apply successfully
- [ ] ValKey caching works
- [ ] Nginx proxies requests correctly
- [ ] SSL/TLS configured properly
- [ ] PostHog self-hosted accessible and receiving events
- [ ] ClickHouse ingesting data properly

### Observability Tests
- [ ] Traces visible in Jaeger
- [ ] Metrics visible in Prometheus
- [ ] Grafana dashboards populated
- [ ] Database queries traced
- [ ] External API calls traced

### Test Suite
- [ ] Unit tests: 80%+ coverage
- [ ] Integration tests: all passing
- [ ] E2E tests: all passing across browsers
- [ ] CI pipeline: green

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Production orchestration |
| `docker-compose.dev.yml` | Development environment |
| `docker-compose.test.yml` | Test environment |
| `docker/Dockerfile` | Production build |
| `src/lib/db/schema.ts` | Database schema |
| `src/lib/auth.ts` | BetterAuth config |
| `src/lib/stripe.ts` | Stripe client |
| `src/lib/posthog.ts` | PostHog client (self-hosted) |
| `docker/posthog/` | PostHog configuration |
| `src/lib/telemetry.ts` | OpenTelemetry setup |
| `src/app/[username]/page.tsx` | Static link page |
| `src/app/api/webhooks/stripe/route.ts` | Stripe webhooks |
| `src/app/api/revalidate/route.ts` | ISR trigger |
| `docker/otel/otel-collector-config.yaml` | OTel collector |
| `docker/prometheus/prometheus.yml` | Prometheus config |
| `vitest.config.ts` | Vitest configuration |
| `playwright.config.ts` | Playwright configuration |
| `__tests__/mocks/server.ts` | MSW server setup |
| `__tests__/mocks/handlers/stripe.ts` | Stripe mocks |
| `__tests__/mocks/handlers/posthog.ts` | PostHog mocks |
| `__tests__/mocks/factories/stripe-events.ts` | Webhook event factory |
| `.github/workflows/test.yml` | CI pipeline |
