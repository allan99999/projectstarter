---
name: db-schema-extractor
description: Extract and document database schemas from existing databases (PostgreSQL, MS SQL Server, MySQL, Supabase, SQLite). Generates comprehensive schema documentation for Claude Code to use when building APIs, frontends, or data models. Use when connecting to existing database, extracting schema, documenting tables, reverse engineering database, or when user mentions "existing database", "schema documentation", "database introspection", "extract tables", or "document database".
---

# Database Schema Extractor

Extract comprehensive schema documentation from existing databases to help Claude Code build APIs, frontends, and data models.

## Quick start

Tell me about your database:
1. **Database type**: PostgreSQL, MS SQL Server, MySQL, Supabase, or SQLite
2. **Connection details**: Connection string or credentials
3. **Output format**: Markdown, TypeScript types, Prisma schema, or JSON

Example: "Extract the schema from my PostgreSQL database at localhost:5432/myapp"

## Instructions

### Step 1: Identify database type

Ask the user which database they're using:

| Database | Reference File |
|----------|----------------|
| PostgreSQL | [references/postgresql.md](references/postgresql.md) |
| Supabase | [references/supabase.md](references/supabase.md) |
| MS SQL Server | [references/mssql.md](references/mssql.md) |
| MySQL | [references/mysql.md](references/mysql.md) |
| SQLite | [references/sqlite.md](references/sqlite.md) |

Once identified, read the appropriate reference file for connection setup and extraction queries.

### Step 2: Gather connection information

Ask for connection details (never store or log credentials):

- **Connection string** (recommended): `postgresql://user:pass@host:5432/db`
- **Or individual values**: host, port, database, user, password

For cloud databases (Supabase, Azure SQL, etc.), check the reference file for SSL requirements.

### Step 3: Set up extraction script

Copy the appropriate script from the `scripts/` folder:

| Database | Script |
|----------|--------|
| PostgreSQL/Supabase | [scripts/extract-postgres.ts](scripts/extract-postgres.ts) |
| MS SQL Server | [scripts/extract-mssql.ts](scripts/extract-mssql.ts) |
| MySQL | [scripts/extract-mysql.ts](scripts/extract-mysql.ts) |
| SQLite | [scripts/extract-sqlite.ts](scripts/extract-sqlite.ts) |

Install the required dependencies listed in the script header.

### Step 4: Run extraction

1. Create `.env` with `DATABASE_URL` or individual credentials
2. Run the extraction script
3. Script generates `DATABASE_SCHEMA.md` in the project root

### Step 5: Choose output format

Based on user needs, generate additional formats:

| Format | Use Case | Template |
|--------|----------|----------|
| Markdown | Documentation, team reference | [templates/schema-markdown.md](templates/schema-markdown.md) |
| TypeScript | Frontend, API clients | [templates/schema-typescript.md](templates/schema-typescript.md) |
| Prisma | Backend with Prisma ORM | [templates/schema-prisma.md](templates/schema-prisma.md) |
| Mermaid ER | Visual diagrams | [templates/schema-mermaid.md](templates/schema-mermaid.md) |

### Step 6: Save to project

Place documentation in appropriate locations:

```
project/
├── docs/
│   └── DATABASE_SCHEMA.md    # Full documentation
├── src/types/
│   └── database.ts           # TypeScript types
└── prisma/
    └── schema.prisma         # Prisma schema (if needed)
```

## Output

When extracting a schema, I will:

1. Identify database type and read the appropriate reference
2. Help set up connection with proper security
3. Run extraction script
4. Generate documentation in requested format(s)
5. Provide summary and next steps for API/frontend development
