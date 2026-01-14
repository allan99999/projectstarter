# MySQL Schema Extraction

## Connection Setup

### Dependencies

```bash
npm install mysql2 dotenv
npm install -D @types/node typescript ts-node
```

### Connection String Format

```
mysql://[user]:[password]@[host]:[port]/[database]
```

### Environment Variables

```env
DATABASE_URL=mysql://root:password@localhost:3306/mydb

# Or individual values
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mydb
DB_USER=root
DB_PASSWORD=password
```

### Connection Code

```typescript
import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Or with connection string
const connection = await mysql.createConnection(process.env.DATABASE_URL!);
```

### PlanetScale Connection (with SSL)

```typescript
const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true
  }
});
```

## Schema Extraction Queries

### Get All Tables and Columns

```sql
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  COLUMN_NAME,
  ORDINAL_POSITION,
  COLUMN_DEFAULT,
  IS_NULLABLE,
  DATA_TYPE,
  CHARACTER_MAXIMUM_LENGTH,
  NUMERIC_PRECISION,
  NUMERIC_SCALE,
  COLUMN_TYPE,
  COLUMN_KEY,
  EXTRA,
  COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

### Get Primary Keys

```sql
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND CONSTRAINT_NAME = 'PRIMARY'
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

### Get Foreign Keys

```sql
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  COLUMN_NAME,
  CONSTRAINT_NAME,
  REFERENCED_TABLE_SCHEMA,
  REFERENCED_TABLE_NAME,
  REFERENCED_COLUMN_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
  AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, ORDINAL_POSITION;
```

### Get Unique Constraints

```sql
SELECT
  tc.TABLE_SCHEMA,
  tc.TABLE_NAME,
  tc.CONSTRAINT_NAME,
  kcu.COLUMN_NAME
FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
  ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
  AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
  AND tc.TABLE_NAME = kcu.TABLE_NAME
WHERE tc.TABLE_SCHEMA = DATABASE()
  AND tc.CONSTRAINT_TYPE = 'UNIQUE'
ORDER BY tc.TABLE_NAME, kcu.ORDINAL_POSITION;
```

### Get Indexes

```sql
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  INDEX_NAME,
  NON_UNIQUE,
  SEQ_IN_INDEX,
  COLUMN_NAME,
  INDEX_TYPE
FROM INFORMATION_SCHEMA.STATISTICS
WHERE TABLE_SCHEMA = DATABASE()
ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX;
```

### Get Table Comments

```sql
SELECT
  TABLE_SCHEMA,
  TABLE_NAME,
  TABLE_COMMENT
FROM INFORMATION_SCHEMA.TABLES
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_TYPE = 'BASE TABLE';
```

### Get Enum Values

MySQL stores enum values in the `COLUMN_TYPE` field:

```sql
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  COLUMN_TYPE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND DATA_TYPE = 'enum';
```

Parse enum values from `COLUMN_TYPE`:

```typescript
// COLUMN_TYPE: "enum('draft','published','archived')"
function parseEnumValues(columnType: string): string[] {
  const match = columnType.match(/^enum\((.+)\)$/);
  if (!match) return [];
  return match[1]
    .split(',')
    .map(v => v.trim().replace(/^'|'$/g, ''));
}
```

## Type Mappings

| MySQL Type | TypeScript Type |
|------------|-----------------|
| int, integer | number |
| bigint | string (for precision) |
| smallint, tinyint, mediumint | number |
| float, double, real | number |
| decimal, numeric | string (for precision) |
| varchar, char, text, tinytext, mediumtext, longtext | string |
| boolean, bool | boolean |
| tinyint(1) | boolean |
| date | Date |
| datetime, timestamp | Date |
| time | string |
| year | number |
| json | unknown |
| blob, tinyblob, mediumblob, longblob | Buffer |
| binary, varbinary | Buffer |
| enum | union type |
| set | string[] |

## MySQL-Specific Notes

### Auto Increment

Check the `EXTRA` column for `auto_increment`:

```typescript
const isAutoIncrement = column.EXTRA === 'auto_increment';
```

### Unsigned Types

Check `COLUMN_TYPE` for `unsigned`:

```typescript
const isUnsigned = column.COLUMN_TYPE.includes('unsigned');
```

### Default Expressions

MySQL 8.0+ supports expression defaults:

```sql
-- Check for expression defaults
SELECT
  COLUMN_NAME,
  COLUMN_DEFAULT,
  EXTRA
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND EXTRA LIKE '%DEFAULT_GENERATED%';
```

### Character Sets

```sql
SELECT
  TABLE_NAME,
  COLUMN_NAME,
  CHARACTER_SET_NAME,
  COLLATION_NAME
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND CHARACTER_SET_NAME IS NOT NULL;
```

## PlanetScale Considerations

PlanetScale uses Vitess and has some differences:

- No foreign key constraints (enforced at application level)
- Use `SHOW CREATE TABLE` for complete table definitions
- Branch-based schema management

```sql
-- Get table DDL
SHOW CREATE TABLE table_name;
```
