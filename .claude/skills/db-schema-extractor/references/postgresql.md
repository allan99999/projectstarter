# PostgreSQL Schema Extraction

## Connection Setup

### Dependencies

```bash
npm install pg dotenv
npm install -D @types/pg typescript ts-node
```

### Connection String Format

```
postgresql://[user]:[password]@[host]:[port]/[database]
```

### Environment Variables

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mydb
# Or individual values:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb
DB_USER=postgres
DB_PASSWORD=password
```

### Connection Code

```typescript
import { Client } from 'pg';

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

await client.connect();
```

## Schema Extraction Queries

### Get All Tables and Columns

```sql
SELECT
  t.table_schema,
  t.table_name,
  c.column_name,
  c.data_type,
  c.udt_name,
  c.column_default,
  c.is_nullable,
  c.character_maximum_length,
  c.numeric_precision,
  c.numeric_scale
FROM information_schema.tables t
JOIN information_schema.columns c
  ON t.table_name = c.table_name
  AND t.table_schema = c.table_schema
WHERE t.table_schema NOT IN ('pg_catalog', 'information_schema')
  AND t.table_type = 'BASE TABLE'
ORDER BY t.table_schema, t.table_name, c.ordinal_position;
```

### Get Primary Keys

```sql
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY';
```

### Get Foreign Keys

```sql
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### Get Unique Constraints

```sql
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE';
```

### Get Indexes

```sql
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY schemaname, tablename;
```

### Get Enums

```sql
SELECT
  n.nspname AS schema_name,
  t.typname AS enum_name,
  e.enumlabel AS enum_value,
  e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
ORDER BY n.nspname, t.typname, e.enumsortorder;
```

### Get Table Comments

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  d.description
FROM pg_description d
JOIN pg_class c ON d.objoid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE d.objsubid = 0
  AND c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');
```

### Get Column Comments

```sql
SELECT
  n.nspname AS schema_name,
  c.relname AS table_name,
  a.attname AS column_name,
  d.description
FROM pg_description d
JOIN pg_class c ON d.objoid = c.oid
JOIN pg_attribute a ON d.objoid = a.attrelid AND d.objsubid = a.attnum
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE c.relkind = 'r'
  AND n.nspname NOT IN ('pg_catalog', 'information_schema');
```

## Type Mappings

| PostgreSQL Type | TypeScript Type |
|-----------------|-----------------|
| integer, int4 | number |
| bigint, int8 | string (for precision) |
| smallint, int2 | number |
| serial, bigserial | number |
| real, float4 | number |
| double precision, float8 | number |
| numeric, decimal | string (for precision) |
| varchar, text, char | string |
| boolean | boolean |
| date | Date |
| timestamp, timestamptz | Date |
| time, timetz | string |
| uuid | string |
| json, jsonb | unknown (or specific type) |
| bytea | Buffer |
| array types | T[] |
| enum types | union type |

## Common Schemas to Exclude

When extracting, typically exclude these system schemas:
- `pg_catalog`
- `information_schema`
- `pg_toast`

For Supabase, you may want to include or handle separately:
- `auth` (authentication tables)
- `storage` (file storage tables)
- `realtime` (realtime subscriptions)
