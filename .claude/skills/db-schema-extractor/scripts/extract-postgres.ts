/**
 * PostgreSQL/Supabase Schema Extraction Script
 *
 * Dependencies:
 *   npm install pg dotenv
 *   npm install -D @types/pg typescript ts-node
 *
 * Environment:
 *   DATABASE_URL=postgresql://user:pass@host:5432/dbname
 *
 * Usage:
 *   npx ts-node scripts/extract-postgres.ts
 */

import { Client } from 'pg';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

dotenv.config();

interface Column {
  table_schema: string;
  table_name: string;
  column_name: string;
  data_type: string;
  udt_name: string;
  column_default: string | null;
  is_nullable: string;
  character_maximum_length: number | null;
  numeric_precision: number | null;
  numeric_scale: number | null;
}

interface PrimaryKey {
  table_schema: string;
  table_name: string;
  column_name: string;
}

interface ForeignKey {
  table_schema: string;
  table_name: string;
  column_name: string;
  foreign_table_schema: string;
  foreign_table_name: string;
  foreign_column_name: string;
  constraint_name: string;
}

interface Index {
  schemaname: string;
  tablename: string;
  indexname: string;
  indexdef: string;
}

interface EnumValue {
  schema_name: string;
  enum_name: string;
  enum_value: string;
}

async function extractSchema(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: connectionString.includes('supabase') || connectionString.includes('neon')
      ? { rejectUnauthorized: false }
      : undefined
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Extract columns
    const columnsResult = await client.query<Column>(`
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
      ORDER BY t.table_schema, t.table_name, c.ordinal_position
    `);

    // Extract primary keys
    const pkResult = await client.query<PrimaryKey>(`
      SELECT
        tc.table_schema,
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      WHERE tc.constraint_type = 'PRIMARY KEY'
    `);

    // Extract foreign keys
    const fkResult = await client.query<ForeignKey>(`
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
      WHERE tc.constraint_type = 'FOREIGN KEY'
    `);

    // Extract indexes
    const indexResult = await client.query<Index>(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
      ORDER BY schemaname, tablename
    `);

    // Extract enums
    const enumResult = await client.query<EnumValue>(`
      SELECT
        n.nspname AS schema_name,
        t.typname AS enum_name,
        e.enumlabel AS enum_value
      FROM pg_type t
      JOIN pg_enum e ON t.oid = e.enumtypid
      JOIN pg_namespace n ON t.typnamespace = n.oid
      ORDER BY n.nspname, t.typname, e.enumsortorder
    `);

    // Generate documentation
    const doc = generateMarkdown(
      columnsResult.rows,
      pkResult.rows,
      fkResult.rows,
      indexResult.rows,
      enumResult.rows
    );

    const outputPath = 'DATABASE_SCHEMA.md';
    fs.writeFileSync(outputPath, doc);
    console.log(`Schema documentation written to ${outputPath}`);

  } catch (error) {
    console.error('Error extracting schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

function generateMarkdown(
  columns: Column[],
  primaryKeys: PrimaryKey[],
  foreignKeys: ForeignKey[],
  indexes: Index[],
  enums: EnumValue[]
): string {
  // Group columns by table
  const tables = new Map<string, Column[]>();
  for (const col of columns) {
    const key = `${col.table_schema}.${col.table_name}`;
    if (!tables.has(key)) tables.set(key, []);
    tables.get(key)!.push(col);
  }

  // Create PK lookup
  const pkLookup = new Set<string>();
  for (const pk of primaryKeys) {
    pkLookup.add(`${pk.table_schema}.${pk.table_name}.${pk.column_name}`);
  }

  // Group foreign keys by table
  const fkByTable = new Map<string, ForeignKey[]>();
  for (const fk of foreignKeys) {
    const key = `${fk.table_schema}.${fk.table_name}`;
    if (!fkByTable.has(key)) fkByTable.set(key, []);
    fkByTable.get(key)!.push(fk);
  }

  // Group indexes by table
  const indexByTable = new Map<string, Index[]>();
  for (const idx of indexes) {
    const key = `${idx.schemaname}.${idx.tablename}`;
    if (!indexByTable.has(key)) indexByTable.set(key, []);
    indexByTable.get(key)!.push(idx);
  }

  // Group enums
  const enumMap = new Map<string, string[]>();
  for (const e of enums) {
    const key = `${e.schema_name}.${e.enum_name}`;
    if (!enumMap.has(key)) enumMap.set(key, []);
    enumMap.get(key)!.push(e.enum_value);
  }

  // Build markdown
  let doc = `# Database Schema Documentation\n\n`;
  doc += `**Generated**: ${new Date().toISOString()}\n`;
  doc += `**Database**: PostgreSQL\n\n`;
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
    doc += `| Column | Type | Nullable | Default | Key |\n`;
    doc += `|--------|------|----------|---------|-----|\n`;

    for (const col of cols) {
      const isPK = pkLookup.has(`${col.table_schema}.${col.table_name}.${col.column_name}`);
      const fk = foreignKeys.find(
        f => f.table_schema === col.table_schema &&
          f.table_name === col.table_name &&
          f.column_name === col.column_name
      );

      let typeStr = col.data_type;
      if (col.character_maximum_length) {
        typeStr += `(${col.character_maximum_length})`;
      }

      let keyStr = '';
      if (isPK) keyStr += 'PK';
      if (fk) keyStr += keyStr ? ', FK' : 'FK';

      const defaultStr = col.column_default ? `\`${col.column_default}\`` : '-';

      doc += `| ${col.column_name} | ${typeStr} | ${col.is_nullable} | ${defaultStr} | ${keyStr} |\n`;
    }

    // Foreign keys
    const tableFks = fkByTable.get(tableName);
    if (tableFks && tableFks.length > 0) {
      doc += `\n**Foreign Keys**:\n`;
      for (const fk of tableFks) {
        doc += `- \`${fk.column_name}\` → \`${fk.foreign_table_schema}.${fk.foreign_table_name}.${fk.foreign_column_name}\`\n`;
      }
    }

    // Indexes
    const tableIndexes = indexByTable.get(tableName);
    if (tableIndexes && tableIndexes.length > 0) {
      doc += `\n**Indexes**:\n`;
      for (const idx of tableIndexes) {
        doc += `- \`${idx.indexname}\`\n`;
      }
    }

    doc += `\n---\n\n`;
  }

  // Enums section
  if (enumMap.size > 0) {
    doc += `## Enums\n\n`;
    for (const [enumName, values] of enumMap) {
      doc += `### ${enumName}\n\n`;
      doc += `\`\`\`\n${values.join('\n')}\n\`\`\`\n\n`;
    }
  }

  return doc;
}

// Run extraction
extractSchema();
