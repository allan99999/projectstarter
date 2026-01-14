# TypeScript Types Template

Use this template to generate type-safe TypeScript interfaces from database schemas.

## Structure

```typescript
/**
 * Database Types
 * Generated from: [database_name]
 * Generated at: [ISO timestamp]
 *
 * DO NOT EDIT MANUALLY - regenerate from database schema
 */

// ============================================
// Enums
// ============================================

export type [EnumName] = '[value1]' | '[value2]' | '[value3]';

// ============================================
// Base Table Types
// ============================================

export interface [TableName] {
  [column_name]: [typescript_type];
  [nullable_column]: [typescript_type] | null;
}

// ============================================
// Insert Types (omit auto-generated fields)
// ============================================

export type [TableName]Insert = Omit<[TableName], 'id' | 'created_at' | 'updated_at'>;

// ============================================
// Update Types (all fields optional except id)
// ============================================

export type [TableName]Update = Partial<Omit<[TableName], 'id'>> & { id: string };

// ============================================
// Relationship Types
// ============================================

export interface [TableName]WithRelations extends [TableName] {
  [relation_name]: [RelatedType][];
  [single_relation]: [RelatedType];
}
```

## Type Mapping Reference

### PostgreSQL → TypeScript

| PostgreSQL | TypeScript |
|------------|------------|
| integer, int4, serial | number |
| bigint, int8, bigserial | string |
| smallint, int2 | number |
| real, float4 | number |
| double precision, float8 | number |
| numeric, decimal | string |
| varchar, text, char | string |
| boolean | boolean |
| date, timestamp, timestamptz | Date |
| time, timetz | string |
| uuid | string |
| json, jsonb | unknown |
| bytea | Buffer |
| array types | T[] |

### MS SQL Server → TypeScript

| SQL Server | TypeScript |
|------------|------------|
| int, smallint, tinyint | number |
| bigint | string |
| bit | boolean |
| decimal, numeric, money | string |
| float, real | number |
| varchar, nvarchar, char, text | string |
| date, datetime, datetime2 | Date |
| time | string |
| uniqueidentifier | string |
| varbinary, binary | Buffer |

### MySQL → TypeScript

| MySQL | TypeScript |
|-------|------------|
| int, smallint, mediumint, tinyint | number |
| bigint | string |
| tinyint(1) | boolean |
| float, double | number |
| decimal, numeric | string |
| varchar, text, char | string |
| date, datetime, timestamp | Date |
| time | string |
| json | unknown |
| blob, binary | Buffer |
| enum | union type |

## Example Output

```typescript
/**
 * Database Types
 * Generated from: myapp_db
 * Generated at: 2024-01-15T10:30:00Z
 */

// ============================================
// Enums
// ============================================

export type UserRole = 'admin' | 'user' | 'guest';

export type PostStatus = 'draft' | 'published' | 'archived';

// ============================================
// Base Table Types
// ============================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string | null;
  status: PostStatus;
  published_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: Date;
}

// ============================================
// Insert Types
// ============================================

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'>;

export type PostInsert = Omit<Post, 'id' | 'created_at' | 'updated_at'>;

export type CommentInsert = Omit<Comment, 'id' | 'created_at'>;

// ============================================
// Update Types
// ============================================

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;

export type PostUpdate = Partial<Omit<Post, 'id' | 'created_at' | 'updated_at'>>;

// ============================================
// Relationship Types
// ============================================

export interface UserWithPosts extends User {
  posts: Post[];
}

export interface UserWithPostsAndComments extends User {
  posts: Post[];
  comments: Comment[];
}

export interface PostWithAuthor extends Post {
  author: User;
}

export interface PostWithComments extends Post {
  comments: CommentWithAuthor[];
}

export interface CommentWithAuthor extends Comment {
  author: User;
}

// ============================================
// Query Result Types
// ============================================

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export type UserListResult = PaginatedResult<User>;
export type PostListResult = PaginatedResult<PostWithAuthor>;
```

## Usage Guidelines

1. **Nullable columns**: Always use `| null` not `?:` for database nullability
2. **BigInt**: Use `string` to preserve precision in JavaScript
3. **Decimal/Money**: Use `string` to avoid floating point issues
4. **Dates**: Use `Date` type, handle serialization at API boundary
5. **JSON columns**: Use `unknown` or define specific interfaces
6. **Arrays**: PostgreSQL arrays map to `T[]`
