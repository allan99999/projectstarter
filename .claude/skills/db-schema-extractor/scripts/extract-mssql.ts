/**
 * MS SQL Server Schema Extraction Script
 *
 * Dependencies:
 *   npm install mssql dotenv
 *   npm install -D @types/mssql typescript ts-node
 *
 * Environment:
 *   DB_SERVER=localhost
 *   DB_NAME=mydb
 *   DB_USER=sa
 *   DB_PASSWORD=YourPassword
 *   DB_PORT=1433
 *
 * Usage:
 *   npx ts-node scripts/extract-mssql.ts
 */

import sql from 'mssql';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

interface Column {
  schema_name: string;
  table_name: string;
  column_name: string;
  data_type: string;
  max_length: number;
  precision: number;
  scale: number;
  is_nullable: boolean;
  is_identity: boolean;
  column_default: string | null;
  column_id: number;
}

interface PrimaryKey {
  schema_name: string;
  table_name: string;
  column_name: string;
  constraint_name: string;
}

interface ForeignKey {
  schema_name: string;
  table_name: string;
  column_name: string;
  foreign_schema_name: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

interface Index {
  schema_name: string;
  table_name: string;
  index_name: string;
  index_type: string;
  is_unique: boolean;
  is_primary_key: boolean;
  columns: string;
}

async function extractSchema(): Promise<void> {
  const config: sql.config = {
    server: process.env.DB_SERVER || 'localhost',
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    port: parseInt(process.env.DB_PORT || '1433'),
    options: {
      encrypt: process.env.DB_SERVER?.includes('database.windows.net') || false,
      trustServerCertificate: true
    }
  };

  if (!config.database || !config.user || !config.password) {
    console.error('DB_NAME, DB_USER, and DB_PASSWORD environment variables are required');
    process.exit(1);
  }

  try {
    const pool = await sql.connect(config);
    console.log('Connected to database');

    // Extract columns
    const columnsResult = await pool.request().query<Column>(`
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
      ORDER BY s.name, t.name, c.column_id
    `);

    // Extract primary keys
    const pkResult = await pool.request().query<PrimaryKey>(`
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
      ORDER BY s.name, t.name, ic.key_ordinal
    `);

    // Extract foreign keys
    const fkResult = await pool.request().query<ForeignKey>(`
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
      ORDER BY s.name, t.name
    `);

    // Extract indexes
    const indexResult = await pool.request().query<Index>(`
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
      ORDER BY s.name, t.name, i.name
    `);

    // Generate documentation
    const doc = generateMarkdown(
      columnsResult.recordset,
      pkResult.recordset,
      fkResult.recordset,
      indexResult.recordset
    );

    const outputPath = 'DATABASE_SCHEMA.md';
    fs.writeFileSync(outputPath, doc);
    console.log(`Schema documentation written to ${outputPath}`);

    await pool.close();

  } catch (error) {
    console.error('Error extracting schema:', error);
    process.exit(1);
  }
}

function formatMaxLength(dataType: string, maxLength: number): string {
  if (maxLength === -1) return `${dataType}(MAX)`;
  if (maxLength === 0) return dataType;

  // nvarchar/nchar store length in bytes (2 per char)
  if (dataType.startsWith('n')) {
    return `${dataType}(${maxLength / 2})`;
  }
  return `${dataType}(${maxLength})`;
}

function generateMarkdown(
  columns: Column[],
  primaryKeys: PrimaryKey[],
  foreignKeys: ForeignKey[],
  indexes: Index[]
): string {
  // Group columns by table
  const tables = new Map<string, Column[]>();
  for (const col of columns) {
    const key = `${col.schema_name}.${col.table_name}`;
    if (!tables.has(key)) tables.set(key, []);
    tables.get(key)!.push(col);
  }

  // Create PK lookup
  const pkLookup = new Set<string>();
  for (const pk of primaryKeys) {
    pkLookup.add(`${pk.schema_name}.${pk.table_name}.${pk.column_name}`);
  }

  // Group foreign keys by table
  const fkByTable = new Map<string, ForeignKey[]>();
  for (const fk of foreignKeys) {
    const key = `${fk.schema_name}.${fk.table_name}`;
    if (!fkByTable.has(key)) fkByTable.set(key, []);
    fkByTable.get(key)!.push(fk);
  }

  // Group indexes by table
  const indexByTable = new Map<string, Index[]>();
  for (const idx of indexes) {
    const key = `${idx.schema_name}.${idx.table_name}`;
    if (!indexByTable.has(key)) indexByTable.set(key, []);
    indexByTable.get(key)!.push(idx);
  }

  // Build markdown
  let doc = `# Database Schema Documentation\n\n`;
  doc += `**Generated**: ${new Date().toISOString()}\n`;
  doc += `**Database**: MS SQL Server\n\n`;
  doc += `---\n\n`;

  // Table of contents
  doc += `## Tables\n\n`;
  for (const tableName of tables.keys()) {
    doc += `- [${tableName}](#${tableName.replace(/\./g, '')})\n`;
  }
  doc += `\n---\n\n`;

  // Table details
  for (const [tableName, cols] of tables) {
    doc += `## ${tableName}\n\n`;

    // Columns table
    doc += `| Column | Type | Nullable | Default | Key | Identity |\n`;
    doc += `|--------|------|----------|---------|-----|----------|\n`;

    for (const col of cols) {
      const isPK = pkLookup.has(`${col.schema_name}.${col.table_name}.${col.column_name}`);
      const fk = foreignKeys.find(
        f => f.schema_name === col.schema_name &&
          f.table_name === col.table_name &&
          f.column_name === col.column_name
      );

      let typeStr = col.data_type;
      if (['varchar', 'nvarchar', 'char', 'nchar', 'varbinary', 'binary'].includes(col.data_type)) {
        typeStr = formatMaxLength(col.data_type, col.max_length);
      } else if (['decimal', 'numeric'].includes(col.data_type)) {
        typeStr = `${col.data_type}(${col.precision},${col.scale})`;
      }

      let keyStr = '';
      if (isPK) keyStr += 'PK';
      if (fk) keyStr += keyStr ? ', FK' : 'FK';

      const defaultStr = col.column_default ? `\`${col.column_default}\`` : '-';
      const identityStr = col.is_identity ? 'Yes' : '-';

      doc += `| ${col.column_name} | ${typeStr} | ${col.is_nullable ? 'YES' : 'NO'} | ${defaultStr} | ${keyStr} | ${identityStr} |\n`;
    }

    // Foreign keys
    const tableFks = fkByTable.get(tableName);
    if (tableFks && tableFks.length > 0) {
      doc += `\n**Foreign Keys**:\n`;
      for (const fk of tableFks) {
        doc += `- \`${fk.column_name}\` → \`${fk.foreign_schema_name}.${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
      }
    }

    // Indexes
    const tableIndexes = indexByTable.get(tableName);
    if (tableIndexes && tableIndexes.length > 0) {
      doc += `\n**Indexes**:\n`;
      for (const idx of tableIndexes) {
        const uniqueStr = idx.is_unique ? ' (unique)' : '';
        doc += `- \`${idx.index_name}\`${uniqueStr} on (${idx.columns})\n`;
      }
    }

    doc += `\n---\n\n`;
  }

  return doc;
}

// Run extraction
extractSchema();
