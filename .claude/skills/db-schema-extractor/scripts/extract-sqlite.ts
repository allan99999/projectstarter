/**
 * SQLite Schema Extraction Script
 *
 * Dependencies:
 *   npm install better-sqlite3 dotenv
 *   npm install -D @types/better-sqlite3 typescript ts-node
 *
 * Environment:
 *   DATABASE_PATH=./data/database.sqlite
 *
 * Usage:
 *   npx ts-node scripts/extract-sqlite.ts
 */

import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

interface TableInfo {
  name: string;
  sql: string;
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
  seq: number;
  table: string;
  from: string;
  to: string;
  on_update: string;
  on_delete: string;
}

interface IndexInfo {
  seq: number;
  name: string;
  unique: number;
  origin: string;
  partial: number;
}

interface IndexColumn {
  seqno: number;
  cid: number;
  name: string;
}

function extractSchema(): void {
  const dbPath = process.env.DATABASE_PATH;

  if (!dbPath) {
    console.error('DATABASE_PATH environment variable is required');
    process.exit(1);
  }

  if (!fs.existsSync(dbPath)) {
    console.error(`Database file not found: ${dbPath}`);
    process.exit(1);
  }

  const db = new Database(dbPath, { readonly: true });

  try {
    console.log('Connected to database');

    // Get all tables
    const tables = db.prepare(`
      SELECT name, sql
      FROM sqlite_master
      WHERE type = 'table'
        AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all() as TableInfo[];

    // Extract schema for each table
    const tableSchemas: {
      name: string;
      sql: string;
      columns: ColumnInfo[];
      foreignKeys: ForeignKey[];
      indexes: { name: string; unique: boolean; columns: string[] }[];
    }[] = [];

    for (const table of tables) {
      const columns = db.prepare(`PRAGMA table_info('${table.name}')`).all() as ColumnInfo[];
      const foreignKeys = db.prepare(`PRAGMA foreign_key_list('${table.name}')`).all() as ForeignKey[];
      const indexList = db.prepare(`PRAGMA index_list('${table.name}')`).all() as IndexInfo[];

      const indexes = indexList
        .filter(idx => !idx.name.startsWith('sqlite_'))
        .map(idx => {
          const indexCols = db.prepare(`PRAGMA index_info('${idx.name}')`).all() as IndexColumn[];
          return {
            name: idx.name,
            unique: idx.unique === 1,
            columns: indexCols.map(c => c.name)
          };
        });

      tableSchemas.push({
        name: table.name,
        sql: table.sql,
        columns,
        foreignKeys,
        indexes
      });
    }

    // Generate documentation
    const doc = generateMarkdown(tableSchemas);

    const outputPath = 'DATABASE_SCHEMA.md';
    fs.writeFileSync(outputPath, doc);
    console.log(`Schema documentation written to ${outputPath}`);

  } catch (error) {
    console.error('Error extracting schema:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

function generateMarkdown(
  tables: {
    name: string;
    sql: string;
    columns: ColumnInfo[];
    foreignKeys: ForeignKey[];
    indexes: { name: string; unique: boolean; columns: string[] }[];
  }[]
): string {
  // Build markdown
  let doc = `# Database Schema Documentation\n\n`;
  doc += `**Generated**: ${new Date().toISOString()}\n`;
  doc += `**Database**: SQLite\n\n`;
  doc += `---\n\n`;

  // Table of contents
  doc += `## Tables\n\n`;
  for (const table of tables) {
    doc += `- [${table.name}](#${table.name.toLowerCase()})\n`;
  }
  doc += `\n---\n\n`;

  // Table details
  for (const table of tables) {
    doc += `## ${table.name}\n\n`;

    // Columns table
    doc += `| Column | Type | Nullable | Default | PK |\n`;
    doc += `|--------|------|----------|---------|----|\n`;

    for (const col of table.columns) {
      const nullableStr = col.notnull ? 'NO' : 'YES';
      const defaultStr = col.dflt_value ? `\`${col.dflt_value}\`` : '-';
      const pkStr = col.pk > 0 ? `PK${col.pk > 1 ? col.pk : ''}` : '-';

      doc += `| ${col.name} | ${col.type || 'ANY'} | ${nullableStr} | ${defaultStr} | ${pkStr} |\n`;
    }

    // Foreign keys
    if (table.foreignKeys.length > 0) {
      doc += `\n**Foreign Keys**:\n`;

      // Group by constraint id
      const fkGroups = new Map<number, ForeignKey[]>();
      for (const fk of table.foreignKeys) {
        if (!fkGroups.has(fk.id)) fkGroups.set(fk.id, []);
        fkGroups.get(fk.id)!.push(fk);
      }

      for (const [, fks] of fkGroups) {
        const fromCols = fks.map(f => f.from).join(', ');
        const toCols = fks.map(f => f.to).join(', ');
        const refTable = fks[0].table;
        doc += `- \`(${fromCols})\` → \`${refTable}(${toCols})\``;
        if (fks[0].on_delete !== 'NO ACTION') doc += ` ON DELETE ${fks[0].on_delete}`;
        if (fks[0].on_update !== 'NO ACTION') doc += ` ON UPDATE ${fks[0].on_update}`;
        doc += `\n`;
      }
    }

    // Indexes
    if (table.indexes.length > 0) {
      doc += `\n**Indexes**:\n`;
      for (const idx of table.indexes) {
        const uniqueStr = idx.unique ? ' (unique)' : '';
        doc += `- \`${idx.name}\`${uniqueStr} on (${idx.columns.join(', ')})\n`;
      }
    }

    // Original CREATE statement
    doc += `\n<details>\n<summary>CREATE Statement</summary>\n\n`;
    doc += `\`\`\`sql\n${table.sql}\n\`\`\`\n\n`;
    doc += `</details>\n`;

    doc += `\n---\n\n`;
  }

  return doc;
}

// Run extraction
extractSchema();
