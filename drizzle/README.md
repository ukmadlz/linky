# Database Migrations

This directory contains all database migrations managed by Drizzle ORM.

## Migration Files

### 0000_skinny_ego.sql
Initial database schema creation. Creates all base tables:
- `users` - User accounts
- `links` - User links
- `subscriptions` - Stripe subscriptions
- `link_clicks` - Analytics for link clicks
- `sessions` - User sessions (Better Auth)
- `accounts` - OAuth accounts (Better Auth)
- `verifications` - Email/phone verification (Better Auth)

### 0001_fix_subscriptions_table.sql
Fixes the subscriptions table schema:
- Adds `stripe_price_id` column
- Renames `current_period_start` to `period_start`
- Renames `current_period_end` to `period_end`
- Drops unused columns: `stripe_customer_id`, `price_id`, `quantity`, `cancel_at_period_end`

### 0002_add_updated_at_columns.sql
Adds `updated_at` tracking to auth tables:
- Adds `updated_at` to `sessions` table
- Updates `verifications.identifier` to TEXT type
- Adds `updated_at` to `verifications` table

## Running Migrations

### Apply All Pending Migrations
```bash
npm run db:migrate
```

This will:
1. Connect to the database
2. Check which migrations have been applied
3. Apply any pending migrations in order
4. Update the migration tracking table

### Generate New Migrations

When you modify the schema in `lib/db/schema.ts`:

```bash
# Generate SQL migration from schema changes
npm run db:generate
```

This creates a new migration file in the `drizzle/` directory.

### Development - Push Schema Directly

For development, you can push schema changes directly without creating migrations:

```bash
npm run db:push
```

⚠️ **Warning**: This is for development only. In production, always use migrations.

## Migration Best Practices

1. **Never edit applied migrations** - Once a migration is applied to production, never modify it
2. **Always use migrations in production** - Use `db:migrate`, not `db:push`
3. **Test migrations** - Run migrations on a test database before production
4. **Make migrations reversible** - Use `IF EXISTS` and `IF NOT EXISTS` for safety
5. **Keep migrations small** - One logical change per migration file

## Migration Structure

Each migration consists of:

1. **SQL file** - The actual migration SQL (`000X_name.sql`)
2. **Snapshot** - JSON snapshot of database state (`meta/000X_snapshot.json`)
3. **Journal entry** - Tracking info (`meta/_journal.json`)

## Programmatic Usage

You can also run migrations programmatically:

```typescript
import { runMigrations } from '@/lib/db/migrate';

await runMigrations();
```

## Initializing Migrations for Existing Database

If you have an existing database with tables but no migration tracking:

```bash
npm run db:migrate:init
```

This will:
1. Create the `drizzle` schema and `__drizzle_migrations` tracking table
2. Mark existing migrations (0000, 0001, 0002) as already applied
3. Allow future migrations to run normally

⚠️ **Only run this once** when setting up migration tracking on an existing database.

## Troubleshooting

### Migration Already Applied
If a migration was already applied manually, it will be skipped automatically.

### Migration Failed
1. Check the error message
2. Verify database connectivity
3. Ensure you have necessary permissions
4. Check if the migration was partially applied

### Rollback
Drizzle doesn't support automatic rollbacks. To rollback:
1. Create a new migration that reverses the changes
2. Or manually run SQL commands to undo changes

### Tables Already Exist Error
If you get "relation already exists" errors:
1. Run `npm run db:migrate:init` to initialize migration tracking
2. This marks existing migrations as applied without re-running them

## Converting Old Scripts

The following old scripts have been converted to migrations:
- `scripts/fix-subscriptions-schema.ts` → `0001_fix_subscriptions_table.sql`
- `scripts/migrate-subscriptions.ts` → `0001_fix_subscriptions_table.sql`
- `scripts/add-updated-at.sql` → `0002_add_updated_at_columns.sql`

These scripts are now deprecated and can be archived.
