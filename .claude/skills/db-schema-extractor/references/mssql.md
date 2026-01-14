# MS SQL Server Schema Extraction

## Connection Setup

### Dependencies

```bash
npm install mssql dotenv
npm install -D @types/mssql typescript ts-node
```

### Connection String Format

```
Server=[server];Database=[database];User Id=[user];Password=[password];Encrypt=true;TrustServerCertificate=true;
```

### Environment Variables

```env
# Connection string format
DATABASE_URL=Server=localhost;Database=mydb;User Id=sa;Password=YourPassword123;Encrypt=false;TrustServerCertificate=true;

# Or individual values
DB_SERVER=localhost
DB_NAME=mydb
DB_USER=sa
DB_PASSWORD=YourPassword123
DB_PORT=1433
```

### Connection Code

```typescript
import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT || '1433'),
  options: {
    encrypt: true, // Required for Azure
    trustServerCertificate: true // For local dev
  }
};

const pool = await sql.connect(config);
```

### Azure SQL Connection

```typescript
const config: sql.config = {
  server: 'your-server.database.windows.net',
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: false
  }
};
```

## Schema Extraction Queries

### Get All Tables and Columns

```sql
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  c.name AS column_name,
  ty.name AS data_type,
  c.max_length,
  c.precision,
  c.scale,
  c.is_nullable,
  c.is_identity,
  OBJECT_DEFINITION(c.default_object_id) AS column_default,
  c.column_id
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.columns c ON t.object_id = c.object_id
INNER JOIN sys.types ty ON c.user_type_id = ty.user_type_id
WHERE t.is_ms_shipped = 0
ORDER BY s.name, t.name, c.column_id;
```

### Get Primary Keys

```sql
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  c.name AS column_name,
  i.name AS constraint_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE i.is_primary_key = 1
ORDER BY s.name, t.name, ic.key_ordinal;
```

### Get Foreign Keys

```sql
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  c.name AS column_name,
  rs.name AS foreign_schema_name,
  rt.name AS foreign_table_name,
  rc.name AS foreign_column_name,
  fk.name AS constraint_name
FROM sys.foreign_key_columns fkc
INNER JOIN sys.foreign_keys fk ON fkc.constraint_object_id = fk.object_id
INNER JOIN sys.tables t ON fkc.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.columns c ON fkc.parent_object_id = c.object_id AND fkc.parent_column_id = c.column_id
INNER JOIN sys.tables rt ON fkc.referenced_object_id = rt.object_id
INNER JOIN sys.schemas rs ON rt.schema_id = rs.schema_id
INNER JOIN sys.columns rc ON fkc.referenced_object_id = rc.object_id AND fkc.referenced_column_id = rc.column_id
ORDER BY s.name, t.name;
```

### Get Unique Constraints

```sql
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  c.name AS column_name,
  i.name AS constraint_name
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE i.is_unique_constraint = 1
ORDER BY s.name, t.name;
```

### Get Indexes

```sql
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  i.name AS index_name,
  i.type_desc AS index_type,
  i.is_unique,
  i.is_primary_key,
  STRING_AGG(c.name, ', ') WITHIN GROUP (ORDER BY ic.key_ordinal) AS columns
FROM sys.indexes i
INNER JOIN sys.index_columns ic ON i.object_id = ic.object_id AND i.index_id = ic.index_id
INNER JOIN sys.columns c ON ic.object_id = c.object_id AND ic.column_id = c.column_id
INNER JOIN sys.tables t ON i.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
WHERE i.name IS NOT NULL
  AND t.is_ms_shipped = 0
GROUP BY s.name, t.name, i.name, i.type_desc, i.is_unique, i.is_primary_key
ORDER BY s.name, t.name, i.name;
```

### Get Check Constraints

```sql
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  cc.name AS constraint_name,
  cc.definition
FROM sys.check_constraints cc
INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
ORDER BY s.name, t.name;
```

### Get Table/Column Descriptions

```sql
-- Table descriptions
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  ep.value AS description
FROM sys.tables t
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.extended_properties ep ON t.object_id = ep.major_id
WHERE ep.minor_id = 0
  AND ep.name = 'MS_Description';

-- Column descriptions
SELECT
  s.name AS schema_name,
  t.name AS table_name,
  c.name AS column_name,
  ep.value AS description
FROM sys.columns c
INNER JOIN sys.tables t ON c.object_id = t.object_id
INNER JOIN sys.schemas s ON t.schema_id = s.schema_id
INNER JOIN sys.extended_properties ep ON c.object_id = ep.major_id AND c.column_id = ep.minor_id
WHERE ep.name = 'MS_Description';
```

## Type Mappings

| SQL Server Type | TypeScript Type |
|-----------------|-----------------|
| int | number |
| bigint | string (for precision) |
| smallint, tinyint | number |
| bit | boolean |
| decimal, numeric, money | string (for precision) |
| float, real | number |
| varchar, nvarchar, char, nchar, text, ntext | string |
| date | Date |
| datetime, datetime2, smalldatetime | Date |
| time | string |
| datetimeoffset | Date |
| uniqueidentifier | string |
| varbinary, binary, image | Buffer |
| xml | string |

## Common Schemas

- `dbo` - Default schema for user objects
- `sys` - System catalog views
- `INFORMATION_SCHEMA` - Standard information schema

Typically extract from `dbo` or custom schemas, excluding system schemas.

## Max Length Notes

For `nvarchar` and `nchar`, the `max_length` value is in bytes, not characters. Divide by 2 for character length:

```typescript
const charLength = column.max_length === -1
  ? 'MAX'
  : column.data_type.startsWith('n')
    ? column.max_length / 2
    : column.max_length;
```

`-1` indicates `MAX` (unlimited length).
