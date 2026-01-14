# SQLite Schema Extraction

## Connection Setup

### Dependencies

```bash
# Option 1: better-sqlite3 (synchronous, fast)
npm install better-sqlite3
npm install -D @types/better-sqlite3 typescript ts-node

# Option 2: sql.js (runs in browser/WASM)
npm install sql.js

# Option 3: sqlite3 (async, callback-based)
npm install sqlite3
```

### Environment Variables

```env
DATABASE_PATH=./data/database.sqlite
# or
DATABASE_PATH=/absolute/path/to/database.sqlite
```

### Connection Code (better-sqlite3)

```typescript
import Database from 'better-sqlite3';

const db = new Database(process.env.DATABASE_PATH!);
db.pragma('journal_mode = WAL'); // Optional: improve performance

// Query example
const rows = db.prepare('SELECT * FROM sqlite_master').all();
```

### Connection Code (sql.js)

```typescript
import initSqlJs from 'sql.js';
import * as fs from 'fs';

const SQL = await initSqlJs();
const fileBuffer = fs.readFileSync(process.env.DATABASE_PATH!);
const db = new SQL.Database(fileBuffer);

// Query example
const result = db.exec('SELECT * FROM sqlite_master');
```

## Schema Extraction Queries

### Get All Tables

```sql
SELECT
  name AS table_name,
  sql AS create_statement
FROM sqlite_master
WHERE type = 'table'
  AND name NOT LIKE 'sqlite_%'
ORDER BY name;
```

### Get Table Info (Columns)

For each table, use PRAGMA:

```sql
PRAGMA table_info('table_name');
```

Returns:
| Column | Description |
|--------|-------------|
| cid | Column ID (0-indexed) |
| name | Column name |
| type | Declared type |
| notnull | 1 if NOT NULL |
| dflt_value | Default value |
| pk | Primary key position (0 if not PK) |

### Get All Columns (All Tables)

```typescript
// Get all tables first
const tables = db.prepare(`
  SELECT name FROM sqlite_master
  WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
`).all();

// Then get columns for each
for (const table of tables) {
  const columns = db.prepare(`PRAGMA table_info('${table.name}')`).all();
}
```

### Get Foreign Keys

```sql
PRAGMA foreign_key_list('table_name');
```

Returns:
| Column | Description |
|--------|-------------|
| id | FK constraint ID |
| seq | Column sequence in FK |
| table | Referenced table |
| from | Local column |
| to | Referenced column |
| on_update | ON UPDATE action |
| on_delete | ON DELETE action |
| match | MATCH clause |

### Get Indexes

```sql
-- List all indexes for a table
PRAGMA index_list('table_name');

-- Get columns in an index
PRAGMA index_info('index_name');
```

Or query sqlite_master:

```sql
SELECT
  name AS index_name,
  tbl_name AS table_name,
  sql AS create_statement
FROM sqlite_master
WHERE type = 'index'
  AND name NOT LIKE 'sqlite_%'
ORDER BY tbl_name, name;
```

### Get Unique Constraints

Check index_list for unique indexes:

```sql
PRAGMA index_list('table_name');
-- Check 'unique' column (1 = unique)
```

### Parse CREATE TABLE Statement

For complex analysis, parse the original CREATE statement:

```sql
SELECT sql FROM sqlite_master
WHERE type = 'table' AND name = 'table_name';
```

## Type Mappings

SQLite uses dynamic typing with type affinity. Map declared types to TypeScript:

| SQLite Affinity | Declared Types | TypeScript Type |
|-----------------|----------------|-----------------|
| INTEGER | INT, INTEGER, TINYINT, SMALLINT, MEDIUMINT, BIGINT, INT2, INT8 | number |
| REAL | REAL, DOUBLE, FLOAT | number |
| TEXT | TEXT, CHARACTER, VARCHAR, CLOB | string |
| BLOB | BLOB | Buffer |
| NUMERIC | NUMERIC, DECIMAL, BOOLEAN, DATE, DATETIME | varies |

### Type Detection Logic

```typescript
function sqliteTypeToTS(declaredType: string): string {
  const upper = (declaredType || '').toUpperCase();

  // Integer types
  if (upper.includes('INT')) return 'number';

  // Real types
  if (upper.includes('REAL') || upper.includes('DOUBLE') || upper.includes('FLOAT')) {
    return 'number';
  }

  // Text types
  if (upper.includes('CHAR') || upper.includes('TEXT') || upper.includes('CLOB')) {
    return 'string';
  }

  // Blob
  if (upper.includes('BLOB')) return 'Buffer';

  // Boolean (stored as integer)
  if (upper.includes('BOOL')) return 'boolean';

  // Date/time (stored as text or integer)
  if (upper.includes('DATE') || upper.includes('TIME')) return 'string | number';

  // Default to unknown for NUMERIC affinity
  return 'unknown';
}
```

## SQLite-Specific Notes

### Auto Increment

SQLite uses `INTEGER PRIMARY KEY` for auto-increment (implicitly uses ROWID):

```sql
-- Check if column is auto-increment
SELECT * FROM sqlite_master
WHERE type = 'table'
  AND sql LIKE '%AUTOINCREMENT%';
```

### No Explicit Boolean

SQLite stores booleans as integers (0/1). Convention is to use `BOOLEAN` or `BOOL` in type declaration.

### Date/Time Storage

SQLite has no native date type. Common patterns:
- ISO8601 text: `'2024-01-15T12:30:00Z'`
- Unix timestamp: `1705322600`
- Julian day number: `2460325.5`

### Foreign Key Enforcement

Foreign keys are off by default:

```sql
PRAGMA foreign_keys = ON;
```

Check if enabled:

```sql
PRAGMA foreign_keys;
```

### Check Constraints

Parse from CREATE TABLE statement - not available via PRAGMA.

### Table Without ROWID

Some tables use `WITHOUT ROWID`:

```sql
SELECT sql FROM sqlite_master
WHERE type = 'table'
  AND sql LIKE '%WITHOUT ROWID%';
```

## Complete Extraction Example

```typescript
import Database from 'better-sqlite3';

interface TableInfo {
  name: string;
  columns: ColumnInfo[];
  foreignKeys: ForeignKey[];
  indexes: IndexInfo[];
}

interface ColumnInfo {
  cid: number;
  name: string;
  type: string;
  notnull: number;
  dflt_value: string | null;
  pk: number;
}

interface ForeignKey {
  id: number;
  table: string;
  from: string;
  to: string;
}

interface IndexInfo {
  name: string;
  unique: boolean;
  columns: string[];
}

function extractSchema(dbPath: string): TableInfo[] {
  const db = new Database(dbPath);

  // Get all tables
  const tables = db.prepare(`
    SELECT name FROM sqlite_master
    WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
  `).all() as { name: string }[];

  return tables.map(table => {
    const columns = db.prepare(`PRAGMA table_info('${table.name}')`).all() as ColumnInfo[];
    const foreignKeys = db.prepare(`PRAGMA foreign_key_list('${table.name}')`).all() as ForeignKey[];
    const indexList = db.prepare(`PRAGMA index_list('${table.name}')`).all() as any[];

    const indexes = indexList.map(idx => ({
      name: idx.name,
      unique: idx.unique === 1,
      columns: (db.prepare(`PRAGMA index_info('${idx.name}')`).all() as any[])
        .map(col => col.name)
    }));

    return {
      name: table.name,
      columns,
      foreignKeys,
      indexes
    };
  });
}
```
