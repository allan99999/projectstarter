# Supabase Schema Extraction

Supabase uses PostgreSQL under the hood. This reference covers Supabase-specific considerations.

## Connection Setup

### Dependencies

```bash
npm install pg dotenv
npm install -D @types/pg typescript ts-node
```

### Getting Connection String

1. Go to Supabase Dashboard → Project Settings → Database
2. Find "Connection string" under "Connection info"
3. Copy the URI and replace `[YOUR-PASSWORD]` with your database password

### Connection String Format

```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### Environment Variables

```env
# Supabase connection (use pooler for serverless)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres

# Or direct connection (for migrations/schema changes)
DIRECT_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### Connection Code (with SSL)

```typescript
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

await client.connect();
```

## Supabase-Specific Schemas

### Default Schemas

| Schema | Purpose |
|--------|---------|
| `public` | Your application tables |
| `auth` | Authentication (users, sessions, etc.) |
| `storage` | File storage metadata |
| `realtime` | Realtime subscriptions |
| `extensions` | PostgreSQL extensions |

### Important Auth Tables

```sql
-- Key auth tables to document
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'auth';
```

Common auth tables:
- `auth.users` - User accounts
- `auth.sessions` - Active sessions
- `auth.refresh_tokens` - JWT refresh tokens
- `auth.identities` - OAuth identities

### Getting Auth Schema (if needed)

```sql
SELECT
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
FROM information_schema.columns c
WHERE c.table_schema = 'auth'
  AND c.table_name = 'users'
ORDER BY c.ordinal_position;
```

## Row Level Security (RLS)

### Check RLS Status

```sql
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

### Get RLS Policies

```sql
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public';
```

## Extraction Query (Supabase-Optimized)

Use the same queries as PostgreSQL but include/exclude schemas as needed:

```sql
-- Include only public schema (typical)
WHERE t.table_schema = 'public'

-- Include public and auth schemas
WHERE t.table_schema IN ('public', 'auth')

-- Exclude all system schemas
WHERE t.table_schema NOT IN (
  'pg_catalog',
  'information_schema',
  'extensions',
  'realtime',
  'storage',
  'graphql',
  'graphql_public',
  'pgsodium',
  'pgsodium_masks',
  'vault'
)
```

## Supabase-Specific Types

### Common Generated Columns

Supabase often uses these patterns:
- `id` - Usually `uuid` with `gen_random_uuid()` default
- `created_at` - `timestamptz` with `now()` default
- `updated_at` - `timestamptz` (may need trigger)

### Foreign Key to Auth Users

```sql
-- Common pattern for user references
user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE
```

When documenting, note these as "References auth.users".

## Connection Pooling Notes

- **Transaction mode** (port 6543): Use for serverless/edge functions
- **Session mode** (port 5432): Use for long-running connections
- **Direct connection**: Use for migrations and schema changes

For schema extraction, direct connection is recommended:

```env
# Use direct connection for extraction
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

## Type Generation Alternative

Supabase has built-in type generation:

```bash
npx supabase gen types typescript --project-id [project-ref] > src/types/supabase.ts
```

This can complement the schema extraction for TypeScript projects.
