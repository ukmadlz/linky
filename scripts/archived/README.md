# Archived Database Scripts

These scripts have been converted to proper Drizzle migrations and are kept here for reference only.

## DO NOT USE THESE SCRIPTS

All database changes should now be made through Drizzle migrations in the `/drizzle` folder.

## Migration Mapping

| Old Script | New Migration | Description |
|------------|---------------|-------------|
| `fix-subscriptions-schema.ts` | `drizzle/0001_fix_subscriptions_table.sql` | Added stripe_price_id column |
| `migrate-subscriptions.ts` | `drizzle/0001_fix_subscriptions_table.sql` | Renamed period columns, dropped unused columns |
| `add-updated-at.sql` | `drizzle/0002_add_updated_at_columns.sql` | Added updated_at to sessions and verifications |
| `run-accounts-migration.ts` | N/A - Removed | Referenced non-existent SQL file |
| `run-updated-at-migration.ts` | `drizzle/0002_add_updated_at_columns.sql` | Runner for add-updated-at.sql |
| `check-schema.ts` | N/A - Utility | Schema checking utility (not a migration) |

## How to Use Migrations Now

Instead of running these scripts, use:

```bash
# Initialize migration tracking (run once for existing databases)
npm run db:migrate:init

# Run all pending migrations
npm run db:migrate

# Generate new migration from schema changes
npm run db:generate

# Push schema directly (development only)
npm run db:push
```

See `/drizzle/README.md` for complete migration documentation.

**Note:** If you're setting up migrations on an existing database that was created with these old scripts, you need to run `npm run db:migrate:init` first to initialize migration tracking.

## Why These Were Deprecated

1. **No Version Control** - Scripts didn't track which changes were applied
2. **No Rollback Support** - Couldn't undo changes safely
3. **Race Conditions** - Running scripts multiple times could cause errors
4. **No Ordering** - Scripts could be run in wrong order
5. **Hard to Replicate** - Difficult to apply same changes across environments

## Safe to Delete?

These files are safe to delete once you've confirmed:
- ✅ All migrations have been applied to production
- ✅ The migration history is properly tracked in `drizzle_migrations` table
- ✅ All team members are using the new migration system

Keep them for now if you need to reference the original implementation.
