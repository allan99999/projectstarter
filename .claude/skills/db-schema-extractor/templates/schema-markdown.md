# Markdown Schema Template

Use this template to generate human-readable schema documentation.

## Structure

```markdown
# Database Schema Documentation

**Generated**: [ISO timestamp]
**Database**: [PostgreSQL/MySQL/MS SQL/SQLite]
**Connection**: [masked connection info]

---

## Overview

- **Total Tables**: [count]
- **Total Relationships**: [count]
- **Schemas**: [list of schemas]

---

## Tables

### [schema].[table_name]

[Table description/comment if available]

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| [column_name] | [data_type] | [YES/NO] | [default or -] | [PK/FK/UK] | [comment] |

**Primary Key**: [column(s)]

**Foreign Keys**:
- `[column]` → `[referenced_table].[referenced_column]`

**Indexes**:
- `[index_name]` (unique) on ([columns])

**Constraints**:
- CHECK: [constraint definition]

---

## Relationships

### One-to-Many
- `[parent_table]` (1) → `[child_table]` (many) via `[foreign_key_column]`

### Many-to-Many
- `[table_a]` ↔ `[table_b]` via `[junction_table]`

---

## Enums

### [enum_name]
- `value_1`
- `value_2`
- `value_3`

---

## Notes

[Any database-specific notes, conventions, or important information]
```

## Formatting Guidelines

1. **Table names**: Use `schema.table` format for databases with schemas
2. **Types**: Include length/precision where applicable: `varchar(255)`, `decimal(10,2)`
3. **Keys**:
   - PK = Primary Key
   - FK = Foreign Key
   - UK = Unique Key
4. **Defaults**: Wrap in backticks, use `-` for no default
5. **Descriptions**: Include from table/column comments when available

## Example Output

```markdown
# Database Schema Documentation

**Generated**: 2024-01-15T10:30:00Z
**Database**: PostgreSQL

---

## Tables

### public.users

User accounts for the application.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK | Unique identifier |
| email | varchar(255) | NO | - | UK | User's email address |
| name | varchar(100) | YES | - | | Display name |
| role | user_role | NO | `'user'` | | User's role |
| created_at | timestamptz | NO | `now()` | | Creation timestamp |

**Primary Key**: id

**Indexes**:
- `users_email_idx` (unique) on (email)

---

### public.posts

Blog posts created by users.

| Column | Type | Nullable | Default | Key | Description |
|--------|------|----------|---------|-----|-------------|
| id | uuid | NO | `gen_random_uuid()` | PK | |
| user_id | uuid | NO | - | FK | Author reference |
| title | varchar(200) | NO | - | | Post title |
| content | text | YES | - | | Post body |
| status | post_status | NO | `'draft'` | | Publication status |
| created_at | timestamptz | NO | `now()` | | |

**Primary Key**: id

**Foreign Keys**:
- `user_id` → `users.id`

---

## Relationships

### One-to-Many
- `users` (1) → `posts` (many) via `posts.user_id`

---

## Enums

### user_role
- `admin`
- `user`
- `guest`

### post_status
- `draft`
- `published`
- `archived`
```
