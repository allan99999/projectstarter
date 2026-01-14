/**
 * MySQL Schema Extraction Script
 *
 * Dependencies:
 *   npm install mysql2 dotenv
 *   npm install -D typescript ts-node
 *
 * Environment:
 *   DATABASE_URL=mysql://user:pass@host:3306/dbname
 *   # Or individual values:
 *   DB_HOST=localhost
 *   DB_PORT=3306
 *   DB_NAME=mydb
 *   DB_USER=root
 *   DB_PASSWORD=password
 *
 * Usage:
 *   npx ts-node scripts/extract-mysql.ts
 */

import mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

interface Column {
  TABLE_SCHEMA: string;
  TABLE_NAME: string;
  COLUMN_NAME: string;
  ORDINAL_POSITION: number;
  COLUMN_DEFAULT: string | null;
  IS_NULLABLE: string;
  DATA_TYPE: string;
  CHARACTER_MAXIMUM_LENGTH: number | null;
  NUMERIC_PRECISION: number | null;
  NUMERIC_SCALE: number | null;
  COLUMN_TYPE: string;
  COLUMN_KEY: string;
  EXTRA: string;
  COLUMN_COMMENT: string;
}

interface ForeignKey {
  TABLE_NAME: string;
  COLUMN_NAME: string;
  CONSTRAINT_NAME: string;
  REFERENCED_TABLE_NAME: string;
  REFERENCED_COLUMN_NAME: string;
}

interface Index {
  TABLE_NAME: string;
  INDEX_NAME: string;
  NON_UNIQUE: number;
  COLUMN_NAME: string;
  SEQ_IN_INDEX: number;
}

interface TableComment {
  TABLE_NAME: string;
  TABLE_COMMENT: string;
}

async function extractSchema(): Promise<void> {
  let connection: mysql.Connection;

  if (process.env.DATABASE_URL) {
    connection = await mysql.createConnection(process.env.DATABASE_URL);
  } else {
    if (!process.env.DB_NAME || !process.env.DB_USER) {
      console.error('DATABASE_URL or DB_NAME/DB_USER environment variables are required');
      process.exit(1);
    }

    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME
    });
  }

  try {
    console.log('Connected to database');

    // Extract columns
    const [columns] = await connection.query<mysql.RowDataPacket[]>(`
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
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    // Extract foreign keys
    const [foreignKeys] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT
        TABLE_NAME,
        COLUMN_NAME,
        CONSTRAINT_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND REFERENCED_TABLE_NAME IS NOT NULL
      ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);

    // Extract indexes
    const [indexes] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT
        TABLE_NAME,
        INDEX_NAME,
        NON_UNIQUE,
        COLUMN_NAME,
        SEQ_IN_INDEX
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
      ORDER BY TABLE_NAME, INDEX_NAME, SEQ_IN_INDEX
    `);

    // Extract table comments
    const [tableComments] = await connection.query<mysql.RowDataPacket[]>(`
      SELECT
        TABLE_NAME,
        TABLE_COMMENT
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
    `);

    // Generate documentation
    const doc = generateMarkdown(
      columns as Column[],
      foreignKeys as ForeignKey[],
      indexes as Index[],
      tableComments as TableComment[]
    );

    const outputPath = 'DATABASE_SCHEMA.md';
    fs.writeFileSync(outputPath, doc);
    console.log(`Schema documentation written to ${outputPath}`);

  } catch (error) {
    console.error('Error extracting schema:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

function parseEnumValues(columnType: string): string[] | null {
  const match = columnType.match(/^enum\((.+)\)$/i);
  if (!match) return null;
  return match[1]
    .split(',')
    .map(v => v.trim().replace(/^'|'$/g, ''));
}

function generateMarkdown(
  columns: Column[],
  foreignKeys: ForeignKey[],
  indexes: Index[],
  tableComments: TableComment[]
): string {
  // Group columns by table
  const tables = new Map<string, Column[]>();
  for (const col of columns) {
    if (!tables.has(col.TABLE_NAME)) tables.set(col.TABLE_NAME, []);
    tables.get(col.TABLE_NAME)!.push(col);
  }

  // Group foreign keys by table
  const fkByTable = new Map<string, ForeignKey[]>();
  for (const fk of foreignKeys) {
    if (!fkByTable.has(fk.TABLE_NAME)) fkByTable.set(fk.TABLE_NAME, []);
    fkByTable.get(fk.TABLE_NAME)!.push(fk);
  }

  // Group indexes by table
  const indexByTable = new Map<string, Map<string, Index[]>>();
  for (const idx of indexes) {
    if (!indexByTable.has(idx.TABLE_NAME)) indexByTable.set(idx.TABLE_NAME, new Map());
    const tableIndexes = indexByTable.get(idx.TABLE_NAME)!;
    if (!tableIndexes.has(idx.INDEX_NAME)) tableIndexes.set(idx.INDEX_NAME, []);
    tableIndexes.get(idx.INDEX_NAME)!.push(idx);
  }

  // Table comments lookup
  const commentLookup = new Map<string, string>();
  for (const tc of tableComments) {
    if (tc.TABLE_COMMENT) commentLookup.set(tc.TABLE_NAME, tc.TABLE_COMMENT);
  }

  // Collect enums
  const enums = new Map<string, string[]>();
  for (const col of columns) {
    if (col.DATA_TYPE === 'enum') {
      const values = parseEnumValues(col.COLUMN_TYPE);
      if (values) {
        enums.set(`${col.TABLE_NAME}.${col.COLUMN_NAME}`, values);
      }
    }
  }

  // Build markdown
  let doc = `# Database Schema Documentation\n\n`;
  doc += `**Generated**: ${new Date().toISOString()}\n`;
  doc += `**Database**: MySQL\n\n`;
  doc += `---\n\n`;

  // Table of contents
  doc += `## Tables\n\n`;
  for (const tableName of tables.keys()) {
    doc += `- [${tableName}](#${tableName.toLowerCase()})\n`;
  }
  doc += `\n---\n\n`;

  // Table details
  for (const [tableName, cols] of tables) {
    doc += `## ${tableName}\n\n`;

    // Table comment
    const comment = commentLookup.get(tableName);
    if (comment) {
      doc += `${comment}\n\n`;
    }

    // Columns table
    doc += `| Column | Type | Nullable | Default | Key | Extra |\n`;
    doc += `|--------|------|----------|---------|-----|-------|\n`;

    for (const col of cols) {
      let typeStr = col.COLUMN_TYPE;

      let keyStr = '';
      if (col.COLUMN_KEY === 'PRI') keyStr = 'PK';
      else if (col.COLUMN_KEY === 'UNI') keyStr = 'UK';
      else if (col.COLUMN_KEY === 'MUL') keyStr = 'FK/IDX';

      const defaultStr = col.COLUMN_DEFAULT ? `\`${col.COLUMN_DEFAULT}\`` : '-';
      const extraStr = col.EXTRA || '-';

      doc += `| ${col.COLUMN_NAME} | ${typeStr} | ${col.IS_NULLABLE} | ${defaultStr} | ${keyStr} | ${extraStr} |\n`;
    }

    // Column comments
    const columnsWithComments = cols.filter(c => c.COLUMN_COMMENT);
    if (columnsWithComments.length > 0) {
      doc += `\n**Column Comments**:\n`;
      for (const col of columnsWithComments) {
        doc += `- \`${col.COLUMN_NAME}\`: ${col.COLUMN_COMMENT}\n`;
      }
    }

    // Foreign keys
    const tableFks = fkByTable.get(tableName);
    if (tableFks && tableFks.length > 0) {
      doc += `\n**Foreign Keys**:\n`;
      for (const fk of tableFks) {
        doc += `- \`${fk.COLUMN_NAME}\` → \`${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}\`\n`;
      }
    }

    // Indexes
    const tableIdxMap = indexByTable.get(tableName);
    if (tableIdxMap && tableIdxMap.size > 0) {
      doc += `\n**Indexes**:\n`;
      for (const [idxName, idxCols] of tableIdxMap) {
        const isUnique = idxCols[0].NON_UNIQUE === 0;
        const columns = idxCols.map(i => i.COLUMN_NAME).join(', ');
        const uniqueStr = isUnique ? ' (unique)' : '';
        doc += `- \`${idxName}\`${uniqueStr} on (${columns})\n`;
      }
    }

    doc += `\n---\n\n`;
  }

  // Enums section
  if (enums.size > 0) {
    doc += `## Enums\n\n`;
    for (const [name, values] of enums) {
      doc += `### ${name}\n\n`;
      doc += `\`\`\`\n${values.join('\n')}\n\`\`\`\n\n`;
    }
  }

  return doc;
}

// Run extraction
extractSchema();
