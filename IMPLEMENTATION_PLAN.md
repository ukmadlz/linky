# Linky — Implementation Plan

> An integration-first link-in-bio platform where users compose pages from content blocks that embed third-party services (YouTube, Spotify, Stripe, Mailchimp, etc.) via oEmbed auto-detection and direct iframe embeds.

**Tech stack**: Next.js 15 (App Router), PostgreSQL + Drizzle ORM, Tailwind CSS + shadcn/ui, WorkOS auth, iron-session

---

## Build Verification Policy

> **After every task**, run `npm run build` before marking the task complete. A successful TypeScript compilation and Next.js build with zero errors is a hard requirement. If the build fails, fix the errors before checking off the task or moving on to the next one.

---

## Design Direction

**Inspiration**: [The Real Roots](https://www.therealroots.com/) (typography & warmth), [Status AI](https://www.statusai.com/) (dark gradients & motion), [Gather](https://www.gather.town/) (color system & interactive polish)

### Typography
- **Display/headings**: Serif font (Playfair Display or Suez One) — adds warmth and premium feel, inspired by Real Roots and Status AI
- **Body/UI**: DM Sans (400, 500, 700) — clean geometric sans-serif, shared by both Real Roots and Gather
- **Monospace** (code blocks/custom code editor): Fragment Mono or JetBrains Mono
- Load via `next/font/google` for zero layout shift

### Color System (token-based)
- **Light mode (default)**:
  - Background: warm off-white (`#f7f5f4`) — from Gather's approachable neutral palette
  - Surface/cards: white (`#ffffff`)
  - Text primary: dark navy (`#292d4c`) — from Gather, softer than pure black
  - Text secondary: medium gray (`#67697f`)
  - Accent primary: purple (`#5f4dc5`) — from Gather, distinctive and modern
  - Accent secondary: bright blue (`#4d65ff`) — from Real Roots focus states
  - Success: green (`#00c245`), destructive: red
- **Dark mode (midnight theme & dashboard)**:
  - Background: deep gradient from black → dark blue (`blue-950`) → purple-tinted black — inspired by Status AI's layered dark aesthetic
  - Surface: `slate-900` with subtle border
  - Text: `slate-100` / `slate-400`
  - Accent: brighter purple/blue to maintain contrast
- All colors defined as CSS custom properties for theme switching

### Motion & Interactions
- **Hover states**: Scale transforms (`hover:scale-105`) on cards and buttons with smooth transitions (`0.6s cubic-bezier`) — from Gather and Status AI
- **Link buttons**: Animated underline trail on hover (transform-origin shift) — from Real Roots
- **Page transitions**: Fade-in on section load for public pages
- **Floating elements**: Subtle `animate-float` on decorative elements (landing page only) — from Status AI's playful orbs
- **Block editor**: Smooth drag-and-drop with spring physics via `@dnd-kit`
- Keep animations tasteful — no motion on public pages unless the theme opts in

### Spacing & Layout
- 8px grid system (spacing: 8, 16, 24, 32, 48, 64, 96)
- Generous section padding (`py-24 px-6`) — from Status AI's breathing room
- Content max-widths: `max-w-sm` (480px) for public link pages, `max-w-6xl` for dashboard, `max-w-7xl` for landing page
- Border radius: `8px` default (rounded-lg), `full` for avatars and pills

### Button Styles
- **Filled** (default): Solid accent color, white text, rounded-lg, `hover:scale-[1.02]` + slight brightness shift
- **Outline**: Border with transparent bg, accent border color, hover fills with `accent/10` bg
- **Soft**: Light accent tint bg (`accent/15`), accent text, no border
- **Shadow**: White bg, subtle shadow, hover lifts with increased shadow
- All buttons: smooth `transition-all duration-200`, consistent `h-10 px-4` sizing

### Public Page Aesthetic
- Clean, centered single-column layout (like a polished card on the warm off-white bg)
- Avatar with soft shadow, serif display name, sans-serif bio
- Link buttons with generous padding and smooth hover animations
- Embeds rendered with subtle card containers and rounded corners
- Minimal chrome — the content is the focus

### Dashboard Aesthetic
- Left sidebar (dark navy or slate-900) with icon + label navigation, active state uses purple accent bg
- Main content area on off-white background
- Cards/panels with white bg, subtle borders, rounded-lg
- Editor uses inline editing with clear visual states (editing, saved, error)
- Theme editor live preview in a phone-frame mockup with drop shadow

### Landing Page
- Full-width hero with large serif headline, gradient text accent, and a CTA button
- Layered background effect: warm gradient with subtle radial glows — inspired by Status AI but lighter/warmer
- Feature sections alternating text-left/image-right layout
- Smooth scroll-triggered fade-in animations
- Social proof section (if applicable)

---

## Phase 1 — Project Foundation

### Task 1.1: Initialize Next.js project
- [x] Run `create-next-app` with TypeScript, Tailwind, App Router, `src/` disabled
- [x] Install core dependencies: `drizzle-orm`, `postgres`, `drizzle-kit`, `zod`, `nanoid`, `iron-session`, `posthog-js`, `posthog-node`, `resend`, `react-email`, `@react-email/components`
- [x] Install dev dependencies: `drizzle-kit`, `@types/node`, `prettier`
- [x] Configure `tsconfig.json` path aliases (`@/` → project root)
- [x] Create `.env.local` template with `DATABASE_URL`, `WORKOS_CLIENT_ID`, `WORKOS_API_KEY`, `SESSION_SECRET`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `RESEND_API_KEY`, `RESEND_FROM_EMAIL`

### Task 1.2: Set up shadcn/ui
- [x] Initialize shadcn/ui with `npx shadcn@latest init`
- [x] Install foundational components: `button`, `input`, `label`, `card`, `dialog`, `dropdown-menu`, `tabs`, `toast`, `separator`, `avatar`, `badge`, `switch`, `select`, `popover`, `command`
- [x] Set up `components/ui/` directory

### Task 1.3: Set up self-hosted PostHog (product analytics)

PostHog is used for **product usage analytics** (how users interact with the dashboard — feature adoption, editor usage, conversion funnels). This is separate from the link click/page view tracking stored in our DB (which powers the end-user analytics dashboard).

- [x] Create `lib/posthog/client.ts` — browser-side PostHog client:
  - [x] Initialize `posthog-js` with `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` (self-hosted instance URL)
  - [x] Disable autocapture, session recording, and heatmaps (opt-in only) — keep it lean
  - [x] Enable `capture_pageview: false` (we'll send manual pageviews for dashboard routes only)
- [x] Create `lib/posthog/server.ts` — server-side PostHog client:
  - [x] Initialize `posthog-node` with the same host/key
  - [x] Lazy-init singleton pattern (same as DB client)
  - [x] Used for server-side event capture (e.g., user signup, page created, block created)
- [x] Create `components/providers/PostHogProvider.tsx` — client component:
  - [x] Wraps `posthog-js` initialization in a React context provider
  - [x] Identifies the user on login (`posthog.identify(userId, { email, username })`)
  - [x] Resets on logout (`posthog.reset()`)
  - [x] Only loaded in the dashboard layout (not on public pages — no tracking visitors)
- [x] Add `PostHogProvider` to `app/(dashboard)/layout.tsx`

**Key product events to track**:

| Event | Trigger | Properties |
|-------|---------|------------|
| `user_signed_up` | New user created (server) | `{ provider, email_domain }` |
| `user_logged_in` | OAuth callback (server) | `{ provider }` |
| `page_created` | Page created (server) | `{ slug }` |
| `block_added` | Block created (server) | `{ block_type, page_id }` |
| `block_deleted` | Block deleted (server) | `{ block_type, page_id }` |
| `block_reordered` | Blocks reordered (server) | `{ page_id, block_count }` |
| `theme_changed` | Theme preset selected (client) | `{ theme_id, has_overrides }` |
| `theme_customized` | Custom override saved (client) | `{ changed_fields[] }` |
| `embed_resolved` | Embed URL resolved (server) | `{ provider_name, embed_type }` |
| `page_published` | Page set to published (server) | `{ slug }` |
| `page_unpublished` | Page set to unpublished (server) | `{ slug }` |
| `settings_updated` | Profile settings saved (server) | `{ changed_fields[] }` |

> **Privacy**: PostHog is self-hosted — no data leaves your infrastructure. Only dashboard users (page owners) are tracked, never public page visitors. No tracking scripts are loaded on public pages.

### Task 1.4: Set up Resend (transactional email)

Resend handles all transactional emails to page owners (not their visitors). Emails are built with React Email for type-safe, component-based templates.

- [x] Create `lib/resend.ts` — Resend client singleton:
  - [x] Initialize with `RESEND_API_KEY`
  - [x] Export `sendEmail({ to, subject, react })` helper that wraps `resend.emails.send()` with default `from` address from `RESEND_FROM_EMAIL`
  - [x] Non-blocking: all email sends are fire-and-forget (no `await` in request path — use `waitUntil` or catch-and-log)
- [x] Create `emails/` directory for React Email templates:
  - [x] `emails/WelcomeEmail.tsx` — sent on first signup; branded header, "Welcome to Linky" heading, quick-start tips (add your first link, customize your theme, share your page), CTA button to dashboard
  - [x] `emails/WeeklyStatsEmail.tsx` — weekly digest; page views, total clicks, top 3 clicked links, comparison to previous week (up/down arrows), CTA to full analytics
  - [x] `emails/MilestoneEmail.tsx` — triggered on milestones; e.g., "Your page just hit 100 views!" or "You reached 50 link clicks this week!", celebratory tone, CTA to dashboard
  - [x] `emails/PagePublishedEmail.tsx` — sent when user first publishes their page; confirmation with public URL, share tips (copy link, add to Instagram bio), QR code preview (Phase 2)
- [x] All templates use `@react-email/components` (Html, Head, Body, Container, Section, Text, Button, Img, Hr) with inline styles matching the Linky brand (warm off-white bg, purple accent, DM Sans font stack)
- [x] Create `lib/email/send-welcome.ts`, `lib/email/send-weekly-stats.ts`, `lib/email/send-milestone.ts`, `lib/email/send-page-published.ts` — thin wrappers that render the template and call `sendEmail()`

**Notification triggers**:

| Email | Trigger | When |
|-------|---------|------|
| Welcome | User signs up | Auth callback (Task 2.2) |
| Page Published | Page `isPublished` set to `true` for the first time | Page PATCH API (Task 8.1) |
| Weekly Stats | Cron job (every Monday) | API route / Vercel Cron (Task 1.4a below) |
| Milestone | View/click count crosses threshold | Checked during click redirect / page view tracking (Tasks 6.4, 6.5) |

- [x] Create `app/api/cron/weekly-stats/route.ts`:
  - [x] Protected by a `CRON_SECRET` env var (verify `Authorization` header)
  - [x] Query all users with published pages
  - [x] For each user: aggregate last 7 days of views + clicks, compare to prior 7 days
  - [x] Send `WeeklyStatsEmail` via Resend (batch with `resend.batch.send()` for efficiency)
  - [x] Add `CRON_SECRET` to `.env.local` template
- [x] Create `lib/email/check-milestones.ts`:
  - [x] `checkAndSendMilestones(pageId, metric, newCount)` — checks if count crosses a milestone threshold (100, 500, 1000, 5000, 10000 views/clicks)
  - [x] Tracks sent milestones to avoid duplicates (add `milestonesSent` jsonb column to `pages` table or use a simple check against last milestone)

### Task 1.5: Set up PostgreSQL + Drizzle
- [x] Create `drizzle.config.ts` pointing to `DATABASE_URL`
- [x] Create `lib/db/index.ts` — Drizzle client with `postgres` driver (lazy-init singleton)
- [x] Create `lib/db/schema.ts` with MVP tables:

**`users`**
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | nanoid |
| email | varchar(255) | unique, not null |
| username | varchar(50) | unique |
| name | varchar(100) | |
| bio | text | |
| avatarUrl | text | |
| workosUserId | varchar(255) | unique |
| isPro | boolean | default false |
| createdAt | timestamp | default now |
| updatedAt | timestamp | default now |

**`pages`**
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | nanoid |
| userId | text (FK → users) | cascade delete |
| slug | varchar(100) | unique, not null |
| title | varchar(200) | |
| description | text | |
| isPublished | boolean | default true |
| themeId | varchar(50) | default "default" |
| themeOverrides | jsonb | default {} |
| seoTitle | varchar(200) | Phase 2 |
| seoDescription | text | Phase 2 |
| ogImageUrl | text | Phase 2 |
| createdAt | timestamp | default now |
| updatedAt | timestamp | default now |

**`blocks`**
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | nanoid |
| pageId | text (FK → pages) | cascade delete |
| parentId | text | self-ref for groups (Phase 2) |
| type | enum | link, text, embed, social_icons, divider, custom_code (+ future types) |
| position | integer | default 0 |
| isVisible | boolean | default true |
| data | jsonb | type-specific, validated by Zod |
| scheduledStart | timestamp | Phase 2 |
| scheduledEnd | timestamp | Phase 2 |
| createdAt | timestamp | default now |
| updatedAt | timestamp | default now |

**`click_events`**
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | nanoid |
| blockId | text (FK → blocks) | cascade delete |
| pageId | text (FK → pages) | cascade delete |
| destinationUrl | text | the URL the user was redirected to |
| referrer | text | HTTP Referer header |
| userAgent | text | raw UA string |
| browser | varchar(50) | parsed from UA (e.g., "Chrome 122") |
| os | varchar(50) | parsed from UA (e.g., "macOS 15") |
| device | varchar(20) | "desktop" / "mobile" / "tablet" |
| country | varchar(2) | from IP geolocation |
| region | varchar(100) | state/province from IP geo |
| city | varchar(100) | from IP geo |
| language | varchar(20) | Accept-Language header (primary) |
| isBot | boolean | default false, detected from UA |
| timestamp | timestamp | default now |

> **GDPR compliance**: No IP addresses are stored. Geolocation is resolved at request time via IP and only the country/region/city are persisted — the IP itself is discarded. No cookies or fingerprinting are used for tracking. User-agent is stored for analytics (browser/OS/device breakdown) which is a legitimate interest under GDPR. No personal identifiers are collected or linked across sessions.

**`page_views`**
| Column | Type | Notes |
|--------|------|-------|
| id | text (PK) | nanoid |
| pageId | text (FK → pages) | cascade delete |
| referrer | text | HTTP Referer header |
| userAgent | text | raw UA string |
| browser | varchar(50) | parsed from UA |
| os | varchar(50) | parsed from UA |
| device | varchar(20) | "desktop" / "mobile" / "tablet" |
| country | varchar(2) | from IP geolocation |
| region | varchar(100) | state/province from IP geo |
| city | varchar(100) | from IP geo |
| language | varchar(20) | Accept-Language header (primary) |
| isBot | boolean | default false |
| timestamp | timestamp | default now |

- [x] Create indexes on: users(email, username), pages(userId, slug), blocks(pageId, position, parentId), click_events(blockId, pageId, timestamp), page_views(pageId, timestamp)
- [x] Run `drizzle-kit generate` to create migration files, then `drizzle-kit migrate` to apply them

### Task 1.6: Database query helpers
- [x] Create `lib/db/queries.ts` with typed query functions:
  - [x] `getUserByWorkosId(workosUserId)`
  - [x] `getUserById(id)`
  - [x] `createUser({ email, workosUserId, name?, avatarUrl? })`
  - [x] `updateUser(id, data)`
  - [x] `getPageBySlug(slug)`
  - [x] `getPagesByUserId(userId)`
  - [x] `createPage({ userId, slug, title? })`
  - [x] `updatePage(id, data)`
  - [x] `deletePage(id)`
  - [x] `getBlocksByPageId(pageId)` — ordered by position, visible only
  - [x] `getAllBlocksByPageId(pageId)` — ordered by position, include hidden (for editor)
  - [x] `createBlock({ pageId, type, position, data })`
  - [x] `updateBlock(id, data)`
  - [x] `deleteBlock(id)`
  - [x] `reorderBlocks(pageId, orderedIds[])`
  - [x] `recordClick({ blockId, pageId, referrer?, userAgent?, country? })`
  - [x] `recordPageView({ pageId, referrer?, userAgent?, country? })`

---

## Phase 2 — Authentication

### Task 2.1: WorkOS setup (Auth + Vault)
- [ ] Create `lib/workos.ts` — lazy-init WorkOS client singleton (used for both OAuth and Vault — single client)
- [ ] Create `lib/session.ts` — iron-session helpers (getSession, saveSession, destroySession)
- [ ] Session shape: `{ userId: string }`
- [ ] Create `lib/vault.ts` — typed Vault helpers built on `workos.vault.*`:

```ts
// Naming convention: objects are named "{secretType}" and isolated per-user
// via context: { organizationId: workosUserId }

// Store a secret on behalf of a user — returns the Vault object ID to persist in DB
storeSecret(workosUserId: string, name: string, value: string): Promise<string>
  → workos.vault.createObject({ name, value, context: { organizationId: workosUserId } })
  → returns object.id

// Retrieve a secret by its Vault object ID
readSecret(vaultObjectId: string): Promise<string>
  → workos.vault.readObject({ id: vaultObjectId })
  → returns object.value

// Update a secret's value in-place (same Vault object ID, key context unchanged)
updateSecret(vaultObjectId: string, value: string): Promise<void>
  → workos.vault.updateObject({ id: vaultObjectId, value })

// Delete a secret (marks for deletion; becomes unavailable to API immediately)
deleteSecret(vaultObjectId: string): Promise<void>
  → workos.vault.deleteObject({ id: vaultObjectId })
```

**What goes in Vault** — any sensitive credential stored on behalf of a user; the DB stores only the Vault object ID:

| Secret | DB column | Vault object name |
|--------|-----------|-------------------|
| Webhook endpoint signing secret | `webhook_endpoints.secretVaultId` | `webhook_secret` |
| Future: user's custom Stripe secret key | `user_integrations.vaultId` | `stripe_secret_key` |
| Future: user's Mailchimp API key | `user_integrations.vaultId` | `mailchimp_api_key` |
| Future: user's custom analytics pixel ID | `user_integrations.vaultId` | `analytics_pixel_id` |

> **Security model**: Each user's secrets are cryptographically isolated in Vault via their WorkOS user ID as context. Raw secret values are never written to the Linky database — only opaque Vault object IDs. If the DB is compromised, secrets remain encrypted and inaccessible.

### Task 2.2: Auth API routes
- [ ] `app/api/auth/oauth/route.ts` — GET: redirect to WorkOS OAuth (Google provider)
- [ ] `app/api/auth/callback/route.ts` — GET: exchange code for user profile, find-or-create user in DB, set session, capture `user_signed_up` (if new) or `user_logged_in` via PostHog server client, send welcome email via Resend (if new user), redirect to `/dashboard`
- [ ] `app/api/auth/logout/route.ts` — POST: destroy session, redirect to `/`
- [ ] `app/api/auth/session/route.ts` — GET: return current session user or 401

### Task 2.3: Auth middleware + helpers
- [ ] Create `lib/auth.ts` — `requireAuth()` helper that reads session and returns user or throws/redirects
- [ ] Create `middleware.ts` — protect `/dashboard/*`, `/api/pages/*`, `/api/user/*` routes (redirect unauthenticated to `/login`)

### Task 2.4: Login page
- [ ] `app/(auth)/login/page.tsx` — centered card on warm off-white bg, serif "Welcome to Linky" heading, sans-serif subtext, "Sign in with Google" button (filled style with Google icon), subtle brand illustration or gradient glow behind card
- [ ] `app/(auth)/layout.tsx` — full-height centered layout with warm background

### Task 2.5: Username onboarding flow

New users arrive from OAuth without a username. This task gates dashboard access behind a one-time username-selection step and moves first-signup side effects (default page creation, welcome email, PostHog `user_signed_up`) to onboarding completion where the username is known.

**Session shape change** — add `username` to the session so middleware can gate without a DB round-trip on every request:
- [ ] Update `SessionData` in `lib/session.ts`: add `username?: string | null`
- [ ] Update `saveSession` callers throughout to pass `username` where known

**Auth callback changes** (`app/api/auth/callback/route.ts`):
- [ ] After find-or-create user:
  - New user (no username): save session `{ userId, username: null }`, redirect to `/onboarding`
  - Returning user with username: save session `{ userId, username }`, redirect to `/dashboard`
  - Returning user without username (edge case): save session `{ userId, username: null }`, redirect to `/onboarding`
- [ ] Remove from callback: auto-create default page, send welcome email, capture `user_signed_up` — all moved to onboarding completion (Task 2.5 submit API below)
- [ ] Keep `user_logged_in` PostHog event only for returning users who already have a username

**Middleware** (`proxy.ts` — Next.js proxy/middleware file):
- [ ] Update `proxy.ts` to cover the full protected route set: `/dashboard`, `/appearance`, `/settings`, `/analytics`, `/webhooks`, `/onboarding`, `/api/pages`, `/api/user`, `/api/webhooks`, `/api/analytics`
- [ ] Gate logic:
  - Unauthenticated (no `session.userId`): redirect to `/login`
  - Authenticated but `session.username` is null/missing: redirect to `/onboarding` — except when the request is already targeting `/onboarding` or `/api/auth/*` (to avoid redirect loops)
  - Authenticated with username: allow through

**`requireAuth()` update** (`lib/auth.ts`):
- [ ] After fetching user from DB, if `user.username` is null, redirect to `/onboarding` — second layer of defense for server components that call `requireAuth()` directly

**Onboarding page** (`app/(auth)/onboarding/page.tsx`):
- [ ] Server component; if the user already has a username (session check), redirect immediately to `/dashboard`
- [ ] Client component `OnboardingForm` handles the interactive form:
  - Linky wordmark at top, "Choose your username" serif heading
  - Subtext: "This becomes your page URL — choose wisely, you can change it later in settings"
  - Username input with inline `linky.app/` prefix label
  - Character rules displayed below input: 3–30 chars, lowercase letters, numbers, hyphens, no leading/trailing hyphens
  - Real-time availability indicator (300ms debounce): spinner → green checkmark (available) or red × (taken / invalid / reserved), using `GET /api/user/username/check?username=…`
  - Input pre-populated with a suggestion derived from the user's Google display name (lowercased, spaces → hyphens, non-alphanumeric stripped); user can freely edit
  - Optional "Display name" field pre-filled from Google profile name
  - Live URL preview line: `"Your Linky page: linky.app/[username]"` — updates as user types
  - "Claim @[username]" CTA button (filled purple, `h-11`, disabled until availability is confirmed)
  - No skip option — username is required to proceed

**Username availability API** (`app/api/user/username/check/route.ts`):
- [ ] `GET ?username=xyz` — validates format then checks DB uniqueness:
  - Format rules: 3–30 chars, `/^[a-z0-9][a-z0-9-]*[a-z0-9]$/` (single char allowed: `/^[a-z0-9]$/`); not a reserved word (`api`, `r`, `verify`, `login`, `dashboard`, `appearance`, `analytics`, `settings`, `webhooks`)
  - Returns `{ available: true }` or `{ available: false, reason: "taken" | "invalid" | "reserved" }`
  - No auth required (called during onboarding before session has a username)

**Onboarding submit API** (`app/api/auth/onboarding/route.ts`):
- [ ] `POST { username: string, name?: string }`:
  - Requires `session.userId`; returns 401 if absent
  - Returns 409 if user already has a username (idempotency guard against double-submit)
  - Validates username format (same rules as check endpoint); returns 422 on format failure
  - Checks uniqueness; returns 409 with `{ error: "taken" }` on conflict
  - Updates user record: set `username`, `name` (if provided)
  - Creates default page (`isDefault: true`, `slug: null`)
  - Updates session: saves `{ userId, username }` so middleware no longer gates subsequent requests
  - Sends welcome email via Resend (fire-and-forget)
  - Captures `user_signed_up` PostHog server event `{ provider: "google", username, email_domain }`
  - Returns `{ ok: true }` — client redirects to `/dashboard`

---

## Phase 3 — Block System Core

### Task 3.1: Block type schemas (Zod)
- [ ] Create `lib/blocks/schemas.ts`:

```
linkBlockSchema:        { url: string (URL), title: string, thumbnailUrl?: string (URL), icon?: string, verificationEnabled?: boolean, verificationMode?: "age" | "acknowledge" }
textBlockSchema:        { content: string, variant: "heading" | "paragraph", align: "left" | "center" | "right" }
embedBlockSchema:       { originalUrl: string (URL), providerName: string, embedType: "oembed" | "iframe" | "custom", oembedData?: object, embedHtml?: string, iframeUrl?: string (URL), aspectRatio?: string }
socialIconsBlockSchema: { icons: [{ platform: string, url: string (URL) }], size: "sm" | "md" | "lg", style: "filled" | "outline" | "monochrome" }
dividerBlockSchema:     { style: "line" | "space" | "dots" }
customCodeBlockSchema:  { html: string, css?: string, sanitized: boolean }
```

- [ ] Export `blockDataSchemas: Record<BlockType, ZodSchema>` for validation dispatch

> **Note on `custom_code` blocks**: User-provided HTML is sanitized server-side on save. Allowed tags: `<div>`, `<span>`, `<p>`, `<a>`, `<img>`, `<ul>`, `<ol>`, `<li>`, `<h1>`–`<h6>`, `<strong>`, `<em>`, `<br>`, `<iframe>` (src allowlisted). All `<script>` tags and event handlers (`onclick`, etc.) are stripped. Custom CSS is scoped to the block container to prevent style leaking.

### Task 3.2: Block type registry
- [ ] Create `lib/blocks/registry.ts`:
  - [ ] `BlockTypeDefinition`: `{ type, label, icon (Lucide name), dataSchema, defaultData }`
  - [ ] Export `blockRegistry: Record<BlockType, BlockTypeDefinition>`
  - [ ] Export `getBlockDef(type)` helper

### Task 3.3: Block renderer components (public page)
- [ ] `components/blocks/BlockRenderer.tsx` — switch on `block.type`, dispatch to typed component
- [ ] `components/blocks/LinkBlock.tsx` — server component; renders `<a>` linking to `/r/[blockId]` (redirect route) instead of the destination URL directly; this ensures every click is tracked server-side with full request headers before redirecting
- [ ] `components/blocks/TextBlock.tsx` — server component; renders heading (`<h2>`) or paragraph (`<p>`) with alignment
- [ ] `components/blocks/EmbedBlock.tsx` — server component; renders sanitized oEmbed HTML or sandboxed iframe with lazy loading; falls back to styled link
- [ ] `components/blocks/SocialIconsBlock.tsx` — server component; renders row of platform icons (use `lucide-react` or custom SVGs for Twitter, Instagram, TikTok, YouTube, GitHub, LinkedIn, etc.)
- [ ] `components/blocks/DividerBlock.tsx` — server component; renders `<hr>`, spacer `<div>`, or dotted separator
- [ ] `components/blocks/CustomCodeBlock.tsx` — server component; renders sanitized user HTML inside a scoped container with user CSS applied via `<style scoped>` or a CSS-in-JS wrapper; no raw `<script>` execution

---

## Phase 4 — Integration/Embed System

### Task 4.1: oEmbed resolver
- [ ] Create `lib/embeds/oembed.ts`:
  - [ ] `KNOWN_PROVIDERS` map: domain → oEmbed endpoint URL (YouTube, Spotify, Vimeo, SoundCloud, Twitter/X)
  - [ ] `resolveOEmbed(url: string): Promise<OEmbedResult>`:
    1. Check known providers map → fetch oEmbed JSON
    2. Fetch URL HTML → parse `<link rel="alternate" type="application/json+oembed">` → fetch endpoint
    3. Return `{ providerName, embedType, oembedData, embedHtml }`

### Task 4.2: Iframe provider patterns
- [ ] Create `lib/embeds/providers.ts`:
  - [ ] `IFRAME_PATTERNS`: array of `{ match: RegExp, transform: (url, match) → iframeSrc, aspectRatio, providerName }`
  - [ ] MVP patterns: YouTube (`/watch?v=` → `/embed/`), Spotify (`/track|album|playlist/` → `/embed/`), Vimeo (`/\d+` → `/player.vimeo.com/video/`), SoundCloud, Google Maps
  - [ ] `resolveIframe(url: string): IframeResult | null`

### Task 4.3: Embed sanitization
- [ ] Create `lib/embeds/sanitize.ts`:
  - [ ] `ALLOWED_IFRAME_DOMAINS` allowlist: youtube.com, youtube-nocookie.com, player.vimeo.com, open.spotify.com, w.soundcloud.com, platform.twitter.com, google.com/maps, calendly.com
  - [ ] `sanitizeEmbedHtml(html: string): string` — strip all tags except `<iframe>` with `src` on allowlist; use a lightweight HTML parser (or regex for iframes specifically)
  - [ ] `sanitizeCustomHtml(html: string): string` — for `custom_code` blocks; allow safe HTML tags (`div`, `span`, `p`, `a`, `img`, `ul`, `ol`, `li`, `h1`–`h6`, `strong`, `em`, `br`, `iframe` with allowlisted `src`); strip `<script>`, event handlers (`on*` attributes), `javascript:` URLs
  - [ ] `scopeCustomCss(css: string, containerId: string): string` — prefix all CSS selectors with the block's container ID to prevent style leaking to the rest of the page

### Task 4.4: Unified embed resolution endpoint
- [ ] Create `lib/embeds/resolve.ts`:
  - [ ] `resolveEmbed(url: string): Promise<EmbedBlockData>`:
    1. Try `resolveIframe(url)` for known patterns (fastest, best quality)
    2. Try `resolveOEmbed(url)` for oEmbed-capable URLs
    3. Fallback: return `{ originalUrl, providerName: "Unknown", embedType: "custom" }` (renders as styled link)
- [ ] Create `app/api/embeds/resolve/route.ts` — POST: accepts `{ url }`, returns resolved embed data; capture `embed_resolved` to PostHog

---

## Phase 5 — Theming System

### Task 5.1: Theme types and presets
- [ ] Create `lib/themes/types.ts`:
  - [ ] `ThemeConfig` interface: backgroundColor, textColor, headingColor, buttonStyle ("filled" | "outline" | "soft" | "shadow"), buttonColor, buttonTextColor, buttonRadius ("none" | "sm" | "md" | "lg" | "full"), fontFamily, socialIconColor, maxWidth ("sm" | "md" | "lg"), blockSpacing ("tight" | "normal" | "relaxed")
- [ ] Create `lib/themes/presets.ts`:
  - [ ] 5 presets aligned with the design direction:
    - `default` — warm off-white bg (`#f7f5f4`), dark navy text (`#292d4c`), purple accent (`#5f4dc5`), DM Sans, filled buttons, rounded-lg
    - `midnight` — deep gradient dark bg (black → `blue-950`), slate-100 text, bright purple/blue accent, DM Sans, outline buttons with glow, rounded-lg — inspired by Status AI
    - `forest` — soft sage green bg, dark green text, earth-tone accent, DM Sans, soft buttons, rounded-md
    - `sunset` — warm peach/cream bg, dark warm gray text, coral/orange accent, Playfair Display headings, filled buttons, rounded-full (pill)
    - `minimal` — pure white bg, pure black text, no accent color (black buttons), Inter font, shadow button style, rounded-none (sharp corners)
  - [ ] Export `themePresets: Record<string, ThemeConfig>`

### Task 5.2: Theme resolution and CSS variables
- [ ] Create `lib/themes/resolve.ts`:
  - [ ] `resolveTheme(themeId: string, overrides: Partial<ThemeConfig>): ThemeConfig`
  - [ ] Merges preset with sparse user overrides
- [ ] Create `lib/themes/to-css-vars.ts`:
  - [ ] `themeToCssVars(theme: ThemeConfig): Record<string, string>`
  - [ ] Maps properties to CSS custom properties: `--bg-color`, `--text-color`, `--heading-color`, `--btn-color`, `--btn-text-color`, `--btn-radius`, `--btn-style`, `--social-icon-color`, `--max-width`, `--block-spacing`

### Task 5.3: Theme-aware CSS
- [ ] Add theme CSS custom property usage to `globals.css`:
  - [ ] `.linky-page` container: background, text color, max-width, centering
  - [ ] `.block-link` buttons: color, text, radius, style variants (filled/outline/soft/shadow)
  - [ ] `.block-text` headings/paragraphs: heading color, text color
  - [ ] `.block-social-icons`: icon color
  - [ ] Spacing between blocks via `--block-spacing`

---

## Phase 6 — Public Page

### Task 6.1: Public page route
- [ ] Create `app/(public)/[slug]/page.tsx`:
  - [ ] Server component with `export const revalidate = 60` (ISR)
  - [ ] `generateMetadata()`: fetch page by slug → return title, description, OG image
  - [ ] Default export: fetch page + user + blocks → resolve theme → render with CSS vars
  - [ ] Render: `PageHeader` (avatar, name, bio) → `BlockRenderer` for each block → optional `LinkyBranding` footer
  - [ ] Link blocks render with `href="/r/[blockId]"` — clicks go through the redirect route for server-side tracking
  - [ ] Include a lightweight `PageViewTracker` client component that fires `navigator.sendBeacon("/api/track/view")` on mount for page view recording
- [ ] Create `app/(public)/[slug]/not-found.tsx` — styled 404 page

### Task 6.2: Page header component
- [ ] Create `components/public/PageHeader.tsx`:
  - [ ] Avatar image (with fallback initials)
  - [ ] Display name
  - [ ] Bio text
  - [ ] Uses theme CSS variables

### Task 6.3: Linky branding footer
- [ ] Create `components/public/LinkyBranding.tsx`:
  - [ ] Small "Made with Linky" badge at bottom of free pages
  - [ ] Links to marketing site

### Task 6.4: Click redirect route
- [ ] `app/r/[blockId]/route.ts` — GET: the core click-tracking mechanism
  1. [x] Look up block by ID → get destination URL, pageId, and `verificationEnabled`/`verificationMode`
  2. [x] If `verificationEnabled` is true, check for a valid `linky_verified_{blockId}` session cookie — if absent, **redirect to `/verify/[blockId]`** instead of proceeding
  3. [x] Extract from request headers (no cookies, no IP storage):
     - [ ] `Referer` → referrer
     - [ ] `User-Agent` → raw UA + parse into browser, OS, device (use `ua-parser-js`)
     - [ ] `Accept-Language` → primary language code
     - [ ] IP → resolve to country/region/city via geo lookup (e.g., Vercel's `req.geo` or a lightweight IP-to-geo service), then **discard the IP**
     - [ ] Detect bots from UA string
  4. [x] Write `click_events` row (async, non-blocking — use `waitUntil` if on Vercel)
  5. [x] Check and send milestone email if click count crosses a threshold (async, non-blocking)
  6. [x] Return **302 redirect** to the destination URL
  - [ ] If block not found or not visible → redirect to page or return 404

### Task 6.7: Age/content verification interstitial
- [ ] `app/verify/[blockId]/page.tsx` — Server component that renders the verification gate:
  - [ ] Fetch block by ID → get `verificationMode`; 404 if block not found or verification not enabled
  - [ ] **`age` mode**: Full-page interstitial with:
    - Linky logo + block title
    - "This link contains age-restricted content" heading
    - Date of birth picker (day / month / year selects)
    - "Continue" button — submits to the POST handler
    - Small print: "We do not store your date of birth. Age is verified on your device."
  - [ ] **`acknowledge` mode**: Simpler full-page interstitial with:
    - Warning icon + "Mature content" heading
    - "The following link may contain content not suitable for all audiences."
    - "Continue" primary button + "Go back" secondary link
  - [ ] Styled to match the page owner's theme (fetch page theme from block's pageId)
  - [ ] No tracking scripts, no PostHog, no analytics on this interstitial
- [ ] `app/verify/[blockId]/route.ts` — POST: processes the verification form:
  - [ ] **`age` mode**: Parse submitted DOB, compute age; if < 18, return the interstitial page with an error state ("You must be 18 or older to access this link") — **DOB is never stored**
  - [ ] **`acknowledge` mode**: Accept immediately (any POST = acknowledged)
  - [ ] On success: set a `linky_verified_{blockId}` cookie (httpOnly, sameSite: lax, maxAge: 3600 — expires in 1 hour; not persistent across browser sessions)
  - [ ] Redirect to `/r/[blockId]` — the redirect route will now find the cookie and proceed normally

> **GDPR / Privacy**: The date of birth entered is used only to compute age in memory and is never written to any database or log. The verification cookie contains only a boolean flag (`verified=1`) and the blockId — no personal data. The 1-hour expiry means re-verification is required if the user returns later.

### Task 6.5: Page view tracking
- [ ] `app/api/track/view/route.ts` — POST: accepts `{ pageId }`, extracts same headers as click route, writes to `page_views`, checks and sends milestone email if view count crosses a threshold (async), returns 204
- [ ] Called from a lightweight client component on the public page (`navigator.sendBeacon` on mount)

### Task 6.6: Request parsing helpers
- [ ] Create `lib/tracking/parse-request.ts`:
  - [ ] `parseRequest(request: Request): TrackingData` — extracts referrer, UA, browser, OS, device, language, country/region/city, isBot from request headers
  - [ ] Centralizes header parsing logic shared between click redirect and page view routes
  - [ ] Install `ua-parser-js` for reliable UA parsing
  - [ ] **No IP address in the returned data** — geo is resolved and IP discarded within this function

---

## Phase 7 — Dashboard Layout & Settings

### Task 7.1: Dashboard layout
- [ ] Create `app/(dashboard)/layout.tsx`:
  - [ ] Left sidebar: dark navy (`#292d4c`) or `slate-900` bg, icon + label navigation items, active state uses purple accent bg (`#5f4dc5/15`) with purple text
  - [ ] Nav items: Dashboard (page editor), Appearance (theme), Settings (profile)
  - [ ] Top bar: off-white bg, user avatar (rounded-full) + name + logout dropdown
  - [ ] Main content area: warm off-white (`#f7f5f4`) background, white card panels with subtle borders
  - [ ] Responsive: sidebar collapses to bottom nav on mobile (icon-only, no labels)
  - [ ] Smooth transitions on nav hover states (`0.6s cubic-bezier` — Gather-inspired)
  - [ ] Protect with `requireAuth()`

### Task 7.2: Settings page
- [ ] Create `app/(dashboard)/settings/page.tsx`:
  - [ ] Profile form: name, bio, username (with availability check), avatar URL
  - [ ] Account section: email (read-only from WorkOS), sign out button
  - [ ] Danger zone: delete account (Phase 2)
- [ ] Create `app/api/user/profile/route.ts`:
  - [ ] GET: return current user profile
  - [ ] PATCH: update name, bio, username, avatarUrl (validate username uniqueness); capture `settings_updated` to PostHog

---

## Phase 8 — Page Editor

### Task 8.1: Page CRUD API routes
- [ ] `app/api/pages/route.ts`:
  - [ ] GET: list user's pages
  - [ ] POST: create page (auto-generate slug from username, auto-create page for new users); capture `page_created` to PostHog
- [ ] `app/api/pages/[pageId]/route.ts`:
  - [ ] GET: return page with all blocks
  - [ ] PATCH: update page fields (title, description, isPublished, themeId, themeOverrides); capture `page_published`/`page_unpublished` and `theme_changed` to PostHog when relevant; send PagePublished email via Resend on first publish
  - [ ] DELETE: delete page

### Task 8.2: Block CRUD API routes
- [ ] `app/api/pages/[pageId]/blocks/route.ts`:
  - [ ] GET: list all blocks for page (include hidden, for editor)
  - [ ] POST: create block (validate type + data against Zod schema, auto-assign position); capture `block_added` to PostHog
- [ ] `app/api/pages/[pageId]/blocks/[blockId]/route.ts`:
  - [ ] PATCH: update block (data, isVisible, type-specific fields)
  - [ ] DELETE: delete block; capture `block_deleted` to PostHog
- [ ] `app/api/pages/[pageId]/blocks/reorder/route.ts`:
  - [ ] POST: accepts `{ orderedIds: string[] }`, bulk-updates positions; capture `block_reordered` to PostHog

### Task 8.3: Page editor UI
- [ ] Create `app/(dashboard)/dashboard/page.tsx`:
  - [ ] Fetch user's page (or create one if none exists)
  - [ ] Render `PageEditor` component
- [ ] Create `components/dashboard/PageEditor.tsx`:
  - [ ] Block list with drag-and-drop reorder (use `@dnd-kit/core` + `@dnd-kit/sortable`)
  - [ ] Each block shows: type icon, title/preview, visibility toggle, edit button, delete button
  - [ ] Inline editing: clicking a block opens an edit form (drawer or inline expand)
  - [ ] Auto-saves on change (debounced PATCH calls)
  - [ ] Install: `@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`

### Task 8.4: Block palette (add block)
- [ ] Create `components/dashboard/BlockPalette.tsx`:
  - [ ] Triggered by "Add block" button
  - [ ] Shows grid of available block types with icons and labels
  - [ ] Clicking a type creates a new block with default data and appends it to the page

### Task 8.5: Block editor forms
- [ ] Create `components/dashboard/block-editors/LinkEditor.tsx`:
  - [ ] Fields: URL (input), title (input), thumbnail URL (input, optional)
  - [ ] Auto-fetch page title + favicon when URL is entered
  - [ ] **Verification section** (collapsible, off by default):
    - [ ] Toggle switch: "Require verification before this link opens"
    - [ ] When enabled, show mode selector:
      - `age` — "Age gate (18+): visitor must enter their date of birth"
      - `acknowledge` — "Content warning: visitor must click to confirm before continuing"
    - [ ] Preview text shown below: e.g. "Visitors will see an age verification screen before being redirected"
- [ ] Create `components/dashboard/block-editors/TextEditor.tsx`:
  - [ ] Fields: content (textarea), variant (select: heading/paragraph), alignment (button group)
- [ ] Create `components/dashboard/block-editors/EmbedEditor.tsx`:
  - [ ] Fields: URL (input) — on paste/blur, call `/api/embeds/resolve` and show preview
  - [ ] Display: provider name, embed preview (iframe or thumbnail)
- [ ] Create `components/dashboard/block-editors/SocialIconsEditor.tsx`:
  - [ ] Repeatable row: platform (select from list), URL (input)
  - [ ] Add/remove icons
  - [ ] Size and style selectors
- [ ] Create `components/dashboard/block-editors/DividerEditor.tsx`:
  - [ ] Style selector: line / space / dots
- [ ] Create `components/dashboard/block-editors/CustomCodeEditor.tsx`:
  - [ ] HTML editor: `<textarea>` or code editor (e.g., `@uiw/react-textarea-code-editor`) with syntax highlighting
  - [ ] CSS editor: separate `<textarea>` for custom styles
  - [ ] Live preview panel showing sanitized output
  - [ ] Warning banner explaining which tags/attributes are allowed
  - [ ] On save: HTML is sanitized server-side before storage, `sanitized: true` flag set

---

## Phase 9 — Theme Editor

### Task 9.1: Appearance page
- [ ] Create `app/(dashboard)/appearance/page.tsx`:
  - [ ] Two-column layout: theme controls on left, live preview on right
  - [ ] Render `ThemeEditor` + `LivePreview`

### Task 9.2: Theme editor component
- [ ] Create `components/dashboard/ThemeEditor.tsx`:
  - [ ] **Preset picker**: grid of 5 theme cards showing color swatches, click to select
  - [ ] **Custom overrides** (accordion sections):
    - [ ] Colors: background, text, heading, button, button text, social icons (color pickers)
    - [ ] Button style: filled / outline / soft / shadow (visual gallery)
    - [ ] Button radius: none / sm / md / lg / full (visual gallery)
    - [ ] Font: dropdown of 10-15 popular Google Fonts
    - [ ] Layout: max width (sm/md/lg), block spacing (tight/normal/relaxed)
  - [ ] Saves to `pages.themeId` + `pages.themeOverrides` via PATCH

### Task 9.3: Live preview component
- [ ] Create `components/dashboard/LivePreview.tsx`:
  - [ ] Renders a scaled-down mobile preview of the public page
  - [ ] Uses the same `BlockRenderer` components as the public page
  - [ ] Applies CSS variables from the current theme state in real-time
  - [ ] Framed in a phone-shaped container

---

## Phase 10 — Polish & Launch Readiness

### Task 10.1: Landing page
- [ ] Create `app/page.tsx`:
  - [ ] Hero section: large serif headline with gradient text accent, sans-serif subline, prominent CTA button — layered background with warm radial glows (Status AI-inspired, lighter)
  - [ ] Phone mockup showing an example Linky page (screenshot or live render)
  - [ ] Feature sections: 3 columns with icons, alternating text/image rows for key features (blocks, integrations, themes)
  - [ ] Scroll-triggered fade-in animations on sections
  - [ ] Footer with links, minimal branding

### Task 10.2: Loading states and error handling
- [ ] Add loading skeletons to dashboard pages (`loading.tsx` files)
- [ ] Add `error.tsx` boundary to dashboard and public page routes
- [ ] Add toast notifications for save success/failure in editor
- [ ] Add optimistic updates to block reorder

### Task 10.3: Responsive design pass
- [ ] Dashboard: sidebar → bottom nav on mobile
- [ ] Page editor: stack preview below editor on mobile
- [ ] Public page: already mobile-first (single column, max-width constrained)
- [ ] Theme editor: stack controls above preview on mobile

### Task 10.4: SEO and metadata
- [ ] `app/layout.tsx`: default metadata (title, description, OG image for the marketing site)
- [ ] Public pages: dynamic metadata from page fields via `generateMetadata`
- [ ] Add `robots.txt` and `sitemap.xml` (Phase 2)

---

## Phase 11 — Analytics Dashboard (Phase 2)

### Task 11.1: Analytics API routes
- [ ] `app/api/analytics/[pageId]/summary/route.ts`:
  - [ ] Returns: total views, total clicks, unique visitors (approximate), top 5 referrers, top 5 clicked blocks
  - [ ] Time range parameter: 7d, 30d, 90d
  - [ ] Aggregates from `click_events` and `page_views` tables

### Task 11.2: Analytics dashboard page
- [ ] Create `app/(dashboard)/analytics/page.tsx`:
  - [ ] Summary cards: views, clicks, CTR
  - [ ] Click timeseries chart (per day)
  - [ ] Top links table (by clicks)
  - [ ] Top referrers table
  - [ ] Time range selector (7d / 30d / 90d)
  - [ ] Use a lightweight chart library (e.g., `recharts`)

---

## Phase 12 — Subscriptions & Billing (Phase 2)

### Task 12.1: Subscriptions schema
- [ ] Add `subscriptions` table to schema: id, userId, stripeSubscriptionId, stripePriceId, status, periodStart, periodEnd, createdAt, updatedAt

### Task 12.2: Stripe integration
- [ ] `app/api/stripe/checkout/route.ts` — create checkout session
- [ ] `app/api/stripe/portal/route.ts` — create billing portal session
- [ ] `app/api/webhooks/stripe/route.ts` — handle subscription lifecycle events (created, updated, deleted)
- [ ] Update `users.isPro` based on active subscription

### Task 12.3: Pro feature gating
- [ ] Create `lib/pro.ts` — `requirePro()` helper
- [ ] Gate features: remove branding, custom fonts (expanded list), SEO controls, analytics dashboard
- [ ] Add upgrade prompts in dashboard for gated features

---

## Phase 13 — Extended Features (Phase 2)

### Task 13.1: Additional block types
- [ ] `image` block: `{ url, alt, linkUrl? }` — standalone image with optional click-through
- [ ] `email_collect` block: `{ provider: "mailchimp" | "kit" | ..., embedCode }` — embedded signup form
- [ ] `group` block: `{ title, isCollapsed }` — collapsible section containing child blocks (uses `parentId`)

### Task 13.2: Block scheduling
- [ ] Add scheduling UI to block editor: start date/time, end date/time
- [ ] Filter blocks by schedule in public page query (`WHERE scheduledStart IS NULL OR scheduledStart <= NOW()`)

### Task 13.3: Additional embed providers
- [ ] Add iframe patterns for: Calendly, Typeform, Gumroad, Stripe Payment Links, Apple Music, TikTok, Twitch
- [ ] Add oEmbed endpoints for any that support it

### Task 13.4: Multiple pages per user
- [ ] Update dashboard to show page list
- [ ] Add page creation flow with custom slug
- [ ] Update navigation

### Task 13.5: QR code generation
- [ ] Add QR code button to dashboard that generates a QR code for the public page URL
- [ ] Use `qrcode` package, render as downloadable SVG/PNG

### Task 13.6: SEO controls
- [ ] Add SEO section to page settings: custom title, description, OG image upload
- [ ] Wire into `generateMetadata` on public page

---

## Phase 14 — Webhooks & Automation (Future)

### Task 14.1: Webhook schema
- [ ] Add `webhook_endpoints` table: id, userId, url, **secretVaultId** (Vault object ID — never store raw secret), events (jsonb), isActive, createdAt
  - [ ] On create: generate HMAC secret, store in Vault via `storeSecret(workosUserId, "webhook_secret", generatedSecret)`, persist returned Vault ID in `secretVaultId`
  - [ ] On delete: call `deleteSecret(secretVaultId)` to remove from Vault, then delete DB row
  - [ ] On sign: call `readSecret(secretVaultId)` to retrieve secret at delivery time, sign payload, discard value immediately
- [ ] Add `webhook_deliveries` table: id, endpointId, event, payload, statusCode, response, attempts, deliveredAt, createdAt

### Task 14.2: Webhook event system
- [ ] Define events: `page.viewed`, `link.clicked`, `page.updated`, `block.created`, `block.deleted`
- [ ] Create `lib/webhooks/emit.ts` — queues webhook deliveries when events occur
- [ ] Create `lib/webhooks/deliver.ts` — reads secret from Vault via `readSecret(endpoint.secretVaultId)`, signs payload with HMAC-SHA256, delivers to endpoint URL, retries (3x exponential backoff); secret value held only in memory for duration of the request

### Task 14.3: Webhook management UI
- [ ] Dashboard page to manage endpoints: add/edit/delete URLs, select events
- [ ] Delivery log with status, payload preview, retry button

### Task 14.4: Zapier integration
- [ ] REST hooks pattern or polling endpoint for Zapier triggers
- [ ] Provides access to all webhook events

---

## Phase 15 — Custom Domains (Future)

### Task 15.1: Domain schema and verification
- [ ] `custom_domains` table: id, pageId, domain, isVerified, sslStatus, verifiedAt, createdAt
- [ ] DNS verification flow: user adds CNAME/A record, platform checks via DNS lookup

### Task 15.2: Domain middleware
- [ ] `middleware.ts` extension: check incoming hostname against `custom_domains` table
- [ ] Route custom domain requests to the correct page

### Task 15.3: SSL provisioning
- [ ] Integration with hosting provider's SSL (e.g., Vercel automatic SSL)
- [ ] Status tracking in `custom_domains.sslStatus`

---

## Verification Checklist

After each phase, verify:

- [ ] **Phase 1**: `drizzle-kit generate` creates migration files, `drizzle-kit migrate` applies them, tables exist in DB; PostHog client initializes in dashboard without errors, events appear in self-hosted PostHog instance; Resend client sends a test email successfully; React Email templates render correctly in dev preview (`npx react-email dev`)
- [ ] **Phase 2**: `/login` → OAuth flow → session set → redirect to `/dashboard`
- [ ] **Phase 2.5**: New user OAuth flow: login → callback → `/onboarding` → username input with live availability check → submit → session updated with username → redirect to `/dashboard`; returning user with username bypasses onboarding and goes directly to `/dashboard`; returning user without username is sent to `/onboarding`; `/dashboard` is inaccessible (redirects to `/onboarding`) until username is set; username check returns `available: false` for taken usernames and reserved words; duplicate submit to `/api/auth/onboarding` returns 409 on second call
- [ ] **Phase 3**: Block Zod schemas validate correct/incorrect data — verified by `tests/unit/blocks/schemas.test.ts` (27 tests)
- [ ] **Phase 4**: `/api/embeds/resolve` returns embed data for YouTube, Spotify URLs — verified by `tests/unit/api/embeds.test.ts` and `tests/unit/embeds/providers.test.ts`
- [ ] **Phase 5**: `resolveTheme("midnight", { buttonColor: "#ff0000" })` returns merged config — verified by `tests/unit/themes/resolve.test.ts`
- [ ] **Phase 6**: `/{username}` renders page with blocks, themed correctly; clicking a link redirects via `/r/[blockId]` → 302 to destination with `click_events` row (browser, OS, device, country, language populated, no IP stored); page view tracked on load; verified link shows `/verify/[blockId]` interstitial (age mode rejects DOB under 18, acknowledge mode passes on Continue), sets 1hr cookie, then redirects normally
- [ ] **Phase 7**: Dashboard layout renders with navigation, settings form saves — block editors verified by `tests/unit/components/dashboard/` (4 component test files)
- [ ] **Phase 8**: Can add/edit/reorder/delete all block types in editor — API verified by `tests/unit/api/blocks.test.ts`; block schemas verified by `tests/unit/blocks/schemas.test.ts`
- [ ] **Phase 9**: Theme presets switch live, custom overrides persist — verified by `tests/unit/themes/resolve.test.ts` and `tests/unit/themes/to-css-vars.test.ts`
- [ ] **Phase 10**: Landing page renders, loading states work, mobile layout correct — public components verified by `tests/unit/components/public/`
- [ ] **Phase 16**: All unit tests pass (`npm run test`); build passes (`npm run build`)
- [ ] **Phase 17**: No remaining "linky"/"linky.page"/"linky.app" references in source (confirmed by grep); all UI shows `biohasl.ink` branding; session cookie renamed to `bio_session`; verification cookies use `bio_verified_*` prefix; `SiteBranding` component replaces `LinkyBranding`; all tests pass; build passes

---

## Phase 16 — Unit Tests

### Task 16.1: Testing infrastructure setup
- [ ] Install Vitest, `@vitejs/plugin-react`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `msw` (Mock Service Worker for API mocking)
- [ ] Create `vitest.config.ts` with jsdom environment, path alias matching `tsconfig.json`, and `setupFiles` pointing to a test setup file
- [ ] Create `tests/setup.ts` — imports `@testing-library/jest-dom/matchers`, extends Vitest `expect`, sets up MSW server lifecycle (`beforeAll` / `afterEach` / `afterAll`)
- [ ] Add `"test": "vitest run"` and `"test:watch": "vitest"` scripts to `package.json`
- [ ] Create `tests/mocks/db.ts` — vi.mock for `lib/db/queries` so unit tests never hit a real database
- [ ] Create `tests/mocks/handlers.ts` — MSW request handlers for the internal API routes used by client components

### Task 16.2: Block schema unit tests
- [ ] Create `tests/unit/blocks/schemas.test.ts`:
  - [ ] `linkBlockSchema`: valid URL + title passes; missing URL fails; invalid URL fails; optional fields (`thumbnailUrl`, `icon`) are truly optional
  - [ ] `textBlockSchema`: valid content + variant + align passes; invalid variant enum fails; invalid align enum fails
  - [ ] `embedBlockSchema`: valid `oembed` and `iframe` embedTypes pass; missing `originalUrl` fails; unknown `embedType` fails
  - [ ] `socialIconsBlockSchema`: valid icons array passes; empty icons array fails; invalid platform URL fails; invalid size/style enum fails
  - [ ] `dividerBlockSchema`: all three style values pass; unknown style fails
  - [ ] `customCodeBlockSchema`: valid html + optional css passes; missing html fails

### Task 16.3: Theme resolution unit tests
- [ ] Create `tests/unit/themes/resolve.test.ts`:
  - [ ] `resolveTheme("default", {})` returns the default preset unchanged
  - [ ] `resolveTheme("midnight", { buttonColor: "#ff0000" })` returns midnight preset with `buttonColor` overridden to `#ff0000` and all other midnight values intact
  - [ ] `resolveTheme("unknown-id", {})` falls back to the default preset
  - [ ] Sparse overrides do not wipe non-overridden preset fields
- [ ] Create `tests/unit/themes/to-css-vars.test.ts`:
  - [ ] `themeToCssVars(defaultTheme)` returns an object with all expected CSS variable keys (`--bg-color`, `--text-color`, `--heading-color`, `--btn-color`, `--btn-text-color`, `--btn-radius`, `--btn-style`, `--social-icon-color`, `--max-width`, `--block-spacing`)
  - [ ] Values match the theme config properties

### Task 16.4: Embed resolver unit tests
- [ ] Create `tests/unit/embeds/providers.test.ts`:
  - [ ] `resolveIframe("https://www.youtube.com/watch?v=dQw4w9WgXcQ")` returns a result with `iframeUrl` containing `youtube.com/embed/dQw4w9WgXcQ`
  - [ ] `resolveIframe("https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT")` returns a Spotify embed src
  - [ ] `resolveIframe("https://vimeo.com/148751763")` returns a Vimeo player embed src
  - [ ] `resolveIframe("https://example.com")` returns `null` (not a known pattern)
- [ ] Create `tests/unit/embeds/sanitize.test.ts`:
  - [ ] `sanitizeEmbedHtml` strips non-iframe tags, keeps `<iframe>` with allowlisted `src`
  - [ ] `sanitizeEmbedHtml` strips `<iframe>` whose `src` is not on the allowlist
  - [ ] `sanitizeCustomHtml` keeps allowed tags (`p`, `a`, `strong`, etc.) and strips `<script>`, `onclick`, `javascript:` hrefs
  - [ ] `scopeCustomCss` prefixes all selectors with the container ID

### Task 16.5: API route unit tests — user profile
- [ ] Create `tests/unit/api/user/profile.test.ts` using MSW to intercept `lib/db` calls:
  - [ ] GET `/api/user/profile` returns 401 when no session
  - [ ] GET `/api/user/profile` returns 200 with user JSON when session is valid
  - [ ] PATCH `/api/user/profile` with valid body updates user and returns 200
  - [ ] PATCH `/api/user/profile` with taken username returns 409

### Task 16.6: API route unit tests — pages
- [ ] Create `tests/unit/api/pages.test.ts`:
  - [ ] GET `/api/pages` returns 401 without session; returns user's pages array with valid session
  - [ ] POST `/api/pages` creates a page and returns 201 with the new page; returns 400 if slug is taken
  - [ ] PATCH `/api/pages/[pageId]` updates `isPublished` and returns 200; returns 403 for a page owned by another user
  - [ ] DELETE `/api/pages/[pageId]` deletes page and returns 204; returns 403 for wrong user

### Task 16.7: API route unit tests — blocks
- [ ] Create `tests/unit/api/blocks.test.ts`:
  - [ ] POST `/api/pages/[pageId]/blocks` with a valid `link` block body creates block and returns 201
  - [ ] POST with an invalid block type returns 400
  - [ ] POST with a body that fails the Zod schema returns 422
  - [ ] PATCH `/api/pages/[pageId]/blocks/[blockId]` updates block data and returns 200
  - [ ] DELETE `/api/pages/[pageId]/blocks/[blockId]` removes block and returns 204
  - [ ] POST `/api/pages/[pageId]/blocks/reorder` with `orderedIds` returns 200

### Task 16.8: API route unit tests — embeds
- [ ] Create `tests/unit/api/embeds.test.ts`:
  - [ ] POST `/api/embeds/resolve` with a YouTube URL returns `{ embedType: "iframe", providerName: "YouTube", iframeUrl: ... }`
  - [ ] POST `/api/embeds/resolve` with an unrecognized URL returns a `custom` embedType fallback
  - [ ] POST `/api/embeds/resolve` with a missing `url` body field returns 400

### Task 16.9: Component tests — block renderers
- [ ] Create `tests/unit/components/blocks/LinkBlock.test.tsx`:
  - [ ] Renders an anchor tag with `href` pointing to `/r/[blockId]`
  - [ ] Displays the link title
  - [ ] Does not render when `isVisible` is false
- [ ] Create `tests/unit/components/blocks/TextBlock.test.tsx`:
  - [ ] Renders `<h2>` for `variant: "heading"` and `<p>` for `variant: "paragraph"`
  - [ ] Applies correct text-alignment class for each `align` value
- [ ] Create `tests/unit/components/blocks/DividerBlock.test.tsx`:
  - [ ] Renders `<hr>` for `style: "line"`, a spacer `<div>` for `"space"`, dots for `"dots"`
- [ ] Create `tests/unit/components/blocks/SocialIconsBlock.test.tsx`:
  - [ ] Renders one anchor per icon in the data array
  - [ ] Each anchor has the correct `href`

### Task 16.10: Component tests — dashboard editors
- [ ] Create `tests/unit/components/dashboard/LinkEditor.test.tsx`:
  - [ ] Renders URL and title fields
  - [ ] Verification toggle is hidden by default; shows mode selector after enabling
  - [ ] Selecting `age` mode shows the "Age gate" description; `acknowledge` shows its description
- [ ] Create `tests/unit/components/dashboard/TextEditor.test.tsx`:
  - [ ] Renders content textarea, variant select, and alignment buttons
  - [ ] Changing variant select fires the `onChange` callback with the updated value
- [ ] Create `tests/unit/components/dashboard/DividerEditor.test.tsx`:
  - [ ] All three style options are present and selectable
- [ ] Create `tests/unit/components/dashboard/SocialIconsEditor.test.tsx`:
  - [ ] "Add icon" button appends a new row
  - [ ] Removing a row fires `onChange` with the icon removed from the array

### Task 16.11: Component tests — public page components
- [ ] Create `tests/unit/components/public/PageHeader.test.tsx`:
  - [ ] Renders avatar, display name, and bio
  - [ ] Falls back to initials when `avatarUrl` is absent
- [ ] Create `tests/unit/components/public/LinkyBranding.test.tsx`:
  - [ ] Renders "Made with Linky" text
  - [ ] Contains a link to the marketing site

### Task 16.12: Run full test suite and confirm coverage
- [ ] Run `npm run test` — all tests pass with zero failures (110 tests, 19 files)
- [ ] Run `npm run build` — zero TypeScript and build errors
- [ ] Confirm test count is at least 60 individual test cases across all test files

---

## Phase 17 — Rebrand: Linky → biohasl.ink

> Rename every user-facing and internal reference from "Linky" / "linky.page" / "linky.app" to "biohasl.ink". The new brand treats the full domain as the product name — display it as **`biohasl.ink`** with the `.ink` suffix styled in the accent colour (purple `#5f4dc5`) wherever typography allows, reinforcing the domain-as-identity aesthetic.
>
> **Breaking change**: Renaming the session cookie (`linky_session` → `bio_session`) and the verification cookie prefix (`linky_verified_*` → `bio_verified_*`) will invalidate all existing sessions on first deploy. All logged-in users will be signed out once. This is expected and acceptable for a rebrand launch.

### Task 17.1: Package and domain fallbacks
- [ ] `package.json`: set `"name": "biohaslink"` (dots are not valid in npm package names)
- [ ] Replace all hardcoded fallback domains in source code (`linky.page` → `biohasl.ink`):
  - `proxy.ts` — `process.env.NEXT_PUBLIC_APP_URL ?? "https://linky.page"`
  - `app/sitemap.ts` — `NEXT_PUBLIC_APP_URL || "https://linky.page"`
  - `app/robots.ts` — `NEXT_PUBLIC_APP_URL || "https://linky.page"`
  - `lib/domains/verify.ts` — `NEXT_PUBLIC_APP_URL ?? "https://linky.page"`
- [ ] `lib/resend.ts`: update default from address — `"Linky <noreply@linky.app>"` → `"biohasl.ink <noreply@biohasl.ink>"`

### Task 17.2: UI branding — wordmark and copy

All occurrences of the "Linky" wordmark and the `linky.page` / `linky.app` URL prefix shown to users:

- [ ] `app/layout.tsx`: root metadata
  - `title.default`: `"Linky — Your Link in Bio"` → `"biohasl.ink — Your Link in Bio"`
  - `title.template`: `"%s | Linky"` → `"%s | biohasl.ink"`
- [ ] `app/page.tsx` (landing page): every "Linky" in nav, hero copy, feature section body, and footer copyright
- [ ] `app/(auth)/login/page.tsx`: brand wordmark `Linky` → `biohasl.ink`
- [ ] `app/(auth)/onboarding/page.tsx`:
  - Metadata title: `"Choose your username — Linky"` → `"Choose your username — biohasl.ink"`
  - Wordmark span: `Linky` → `biohasl.ink`
- [ ] `app/(auth)/onboarding/OnboardingForm.tsx`:
  - Inline prefix label: `linky.app/` → `biohasl.ink/`
  - URL preview text: `"Your Linky page: linky.app/[username]"` → `"Your page: biohasl.ink/[username]"`
- [ ] `components/dashboard/Sidebar.tsx`: brand wordmark → `biohasl.ink`
- [ ] `app/(dashboard)/dashboard/page.tsx`: URL preview `linky.page/{slug}` → `biohasl.ink/{slug}`
- [ ] `app/(dashboard)/dashboard/[pageId]/page.tsx`: same URL preview
- [ ] `app/(dashboard)/settings/page.tsx`: URL prefix `linky.page/` → `biohasl.ink/`
- [ ] `components/dashboard/CreatePageModal.tsx`: URL prefix `linky.page/` → `biohasl.ink/`
- [ ] `components/dashboard/SEOPanel.tsx`:
  - Default description placeholder: `"Check out my Linky page."` → `"Check out my biohasl.ink page."`
  - SEO preview URL: `linky.page/{slug}` → `biohasl.ink/{slug}`
- [ ] `app/(public)/[slug]/page.tsx`:
  - Default page title fallback: `"${displayName} | Linky"` → `"${displayName} | biohasl.ink"`
  - Default description: `"Check out ${displayName}'s Linky page."` → `"Check out ${displayName}'s page on biohasl.ink."`
- [ ] `app/(public)/[slug]/not-found.tsx`:
  - Body text: `"This Linky page doesn't exist..."` → `"This biohasl.ink page doesn't exist..."`
  - Link text: `"Go to Linky"` → `"Go to biohasl.ink"`
- [ ] `components/public/LinkyBranding.tsx` (file rename handled in Task 17.6):
  - Badge text: `"Made with Linky"` → `"Made with biohasl.ink"`
  - Link target: update to `https://biohasl.ink`

### Task 17.3: Email templates

All four templates in `emails/` share the same branding structure:

- [ ] `emails/WelcomeEmail.tsx`:
  - Logo text: `Linky` → `biohasl.ink`
  - Subject (in `lib/email/send-welcome.ts`): `"Welcome to Linky! 🎉"` → `"Welcome to biohasl.ink!"`
  - Heading: `"Welcome to Linky, {name}!"` → `"Welcome to biohasl.ink, {name}!"`
  - Body copy: `"unique Linky URL"` → `"unique biohasl.ink URL"`
  - Hardcoded URL: `https://linky.app/dashboard` → `https://biohasl.ink/dashboard`
  - Footer: `"signed up for Linky"` → `"signed up for biohasl.ink"`
  - Tagline: `"Linky · Making links beautiful."` → `"biohasl.ink · Your bio, inked."`
- [ ] `emails/PagePublishedEmail.tsx`:
  - Logo text, body copy (`"Your Linky page is now published"`), footer, hardcoded URLs → biohasl.ink equivalents
- [ ] `emails/WeeklyStatsEmail.tsx`:
  - Logo text, footer (`"you have a Linky page"`), hardcoded dashboard URL → biohasl.ink equivalents
- [ ] `emails/MilestoneEmail.tsx`:
  - Logo text, body copy (`"Your Linky page is gaining momentum"`), footer, hardcoded dashboard URL → biohasl.ink equivalents

### Task 17.4: CSS class names

- [ ] `app/globals.css`: rename `.linky-page` → `.bio-page` and `.linky-page .block-wrapper` → `.bio-page .block-wrapper`
- [ ] `app/(public)/[slug]/page.tsx`: update `className="linky-page"` → `className="bio-page"`
- [ ] `app/(public)/[slug]/loading.tsx`: same className rename

### Task 17.5: Cookie and session names

- [ ] `lib/session.ts`: `cookieName: "linky_session"` → `cookieName: "bio_session"`
- [ ] `proxy.ts`: `SESSION_COOKIE_NAME = "linky_session"` → `SESSION_COOKIE_NAME = "bio_session"`
- [ ] `app/r/[blockId]/route.ts`: verification cookie read — `` `linky_verified_${blockId}` `` → `` `bio_verified_${blockId}` ``
- [ ] `app/api/verify/[blockId]/route.ts`: verification cookie write — same rename

### Task 17.6: Component and test file rename

- [ ] Rename `components/public/LinkyBranding.tsx` → `components/public/SiteBranding.tsx`
- [ ] Update the import in `app/(public)/[slug]/page.tsx`: `LinkyBranding` → `SiteBranding`
- [ ] Rename `tests/unit/components/public/LinkyBranding.test.tsx` → `tests/unit/components/public/SiteBranding.test.tsx`
- [ ] Update the test file: import path, `describe` block name, and any assertions that check for "Made with Linky" text

### Task 17.7: Embed provider domain references

These params identify the host domain to third-party embed providers:

- [ ] `lib/embeds/providers.ts`:
  - Calendly: `embed_domain=linky.page` → `embed_domain=biohasl.ink`
  - Twitch clips: `parent=linky.page` → `parent=biohasl.ink`
  - Twitch channel: `parent=linky.page` → `parent=biohasl.ink`

### Task 17.8: Build and test verification

- [ ] Run `npm run build` — zero TypeScript and build errors
- [ ] Run `npm run test` — all tests pass (update `SiteBranding.test.tsx` assertions for new text if needed)
- [ ] `grep -ri "linky" --include="*.ts" --include="*.tsx" --include="*.css" . | grep -v node_modules | grep -v .next | grep -v IMPLEMENTATION_PLAN` returns no remaining matches (confirms complete rename)
