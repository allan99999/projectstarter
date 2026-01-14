# Prisma Schema Template

Use this template to generate Prisma schema files from existing database schemas.

## Structure

```prisma
// ============================================
// Prisma Schema
// Generated from: [database_name]
// Generated at: [ISO timestamp]
// ============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "[postgresql|mysql|sqlite|sqlserver]"
  url      = env("DATABASE_URL")
}

// ============================================
// Enums
// ============================================

enum [EnumName] {
  value1
  value2
  value3
}

// ============================================
// Models
// ============================================

model [ModelName] {
  // Primary key
  id        String   @id @default(uuid())

  // Fields
  [field]   [Type]   @map("[db_column_name]")
  [field]   [Type]?  // nullable

  // Relations
  [relation] [RelatedModel]   @relation(fields: [fk], references: [pk])
  [relation] [RelatedModel][] // one-to-many

  // Timestamps
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Table mapping
  @@map("[db_table_name]")

  // Indexes
  @@index([field])
  @@unique([field1, field2])
}
```

## Type Mapping Reference

### PostgreSQL → Prisma

| PostgreSQL | Prisma |
|------------|--------|
| integer, int4, serial | Int |
| bigint, int8, bigserial | BigInt |
| smallint, int2 | Int |
| real, float4 | Float |
| double precision, float8 | Float |
| numeric, decimal | Decimal |
| varchar, text, char | String |
| boolean | Boolean |
| date | DateTime @db.Date |
| timestamp | DateTime |
| timestamptz | DateTime |
| time | DateTime @db.Time |
| uuid | String @db.Uuid |
| json | Json |
| jsonb | Json |
| bytea | Bytes |

### MS SQL Server → Prisma

| SQL Server | Prisma |
|------------|--------|
| int | Int |
| bigint | BigInt |
| smallint, tinyint | Int |
| bit | Boolean |
| decimal, numeric | Decimal |
| money | Decimal |
| float, real | Float |
| varchar, nvarchar | String |
| text, ntext | String |
| date | DateTime @db.Date |
| datetime, datetime2 | DateTime |
| time | DateTime @db.Time |
| uniqueidentifier | String @db.UniqueIdentifier |
| varbinary | Bytes |

### MySQL → Prisma

| MySQL | Prisma |
|-------|--------|
| int | Int |
| bigint | BigInt |
| smallint, tinyint, mediumint | Int |
| tinyint(1) | Boolean |
| float, double | Float |
| decimal | Decimal |
| varchar, text, char | String |
| date | DateTime @db.Date |
| datetime, timestamp | DateTime |
| time | DateTime @db.Time |
| json | Json |
| blob | Bytes |
| enum | enum type |

## Example Output

```prisma
// ============================================
// Prisma Schema
// Generated from: myapp_db
// Generated at: 2024-01-15T10:30:00Z
// ============================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// Enums
// ============================================

enum UserRole {
  admin
  user
  guest
}

enum PostStatus {
  draft
  published
  archived
}

// ============================================
// Models
// ============================================

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  name      String?
  role      UserRole @default(user)
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  posts     Post[]
  comments  Comment[]

  @@map("users")
}

model Post {
  id          String     @id @default(uuid()) @db.Uuid
  title       String     @db.VarChar(200)
  content     String?
  status      PostStatus @default(draft)
  publishedAt DateTime?  @map("published_at")
  createdAt   DateTime   @default(now()) @map("created_at")
  updatedAt   DateTime   @updatedAt @map("updated_at")

  // Foreign keys
  userId      String     @map("user_id") @db.Uuid

  // Relations
  author      User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  comments    Comment[]

  @@index([userId])
  @@index([status])
  @@map("posts")
}

model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  content   String
  createdAt DateTime @default(now()) @map("created_at")

  // Foreign keys
  postId    String   @map("post_id") @db.Uuid
  userId    String   @map("user_id") @db.Uuid

  // Relations
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@index([userId])
  @@map("comments")
}

model Tag {
  id    String @id @default(uuid()) @db.Uuid
  name  String @unique @db.VarChar(50)

  // Many-to-many via implicit join table
  posts Post[] @relation("PostTags")

  @@map("tags")
}
```

## Usage Notes

1. **@map**: Use to map Prisma field names to snake_case database columns
2. **@@map**: Use to map Prisma model names to database table names
3. **@db.X**: Use native database type attributes for precise mapping
4. **Relations**: Define both sides of relationships
5. **onDelete**: Specify cascade behavior from foreign key constraints
6. **Indexes**: Recreate database indexes with @@index

## Alternative: Use Prisma Introspection

For accurate schema generation, consider using Prisma's built-in introspection:

```bash
# Pull schema from existing database
npx prisma db pull

# This creates/updates prisma/schema.prisma automatically
```

The generated schema from this template can serve as a starting point or reference.
