# Database Setup Reference

Detailed configurations for different database options in Express.js backends.

## PostgreSQL with Prisma

### Installation

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

### Schema Definition

Create `prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  password  String
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  String
  author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([authorId])
  @@index([published])
}
```

### Database Configuration

Create `src/config/database.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'info', 'warn', 'error']
    : ['error'],
});

// Handle connection errors
prisma.$connect()
  .then(() => console.log('Database connected successfully'))
  .catch((error) => {
    console.error('Database connection failed:', error);
    process.exit(1);
  });

// Graceful shutdown
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

export default prisma;
```

### Migrations

```bash
# Create migration
npx prisma migrate dev --name init

# Apply migrations in production
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

### Usage in Services

```typescript
// src/services/user.service.ts
import prisma from '../config/database';

export const userService = {
  async create(data: { email: string; name?: string; password: string }) {
    return await prisma.user.create({
      data,
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
      },
    });
  },

  async findByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  },

  async findById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        posts: {
          where: { published: true },
        },
      },
    });
  },

  async update(id: string, data: { name?: string }) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  },

  async delete(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  },
};
```

## MongoDB with Mongoose

### Installation

```bash
npm install mongoose
npm install -D @types/mongoose
```

### Database Connection

Create `src/config/database.ts`:

```typescript
import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || '', {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
};

export default connectDB;
```

### Schema Definition

Create `src/models/User.model.ts`:

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IUser extends Document {
  email: string;
  name?: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    name: {
      type: String,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Don't include password by default
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (doc, ret) => {
        delete ret.__v;
        delete ret.password;
        return ret;
      },
    },
  }
);

// Indexes
userSchema.index({ email: 1 });

// Virtual populate
userSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});

export const User = mongoose.model<IUser>('User', userSchema);
```

Create `src/models/Post.model.ts`:

```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IPost extends Document {
  title: string;
  content?: string;
  published: boolean;
  author: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    content: {
      type: String,
    },
    published: {
      type: Boolean,
      default: false,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
postSchema.index({ author: 1 });
postSchema.index({ published: 1 });

export const Post = mongoose.model<IPost>('Post', postSchema);
```

### Usage in Services

```typescript
// src/services/user.service.ts
import { User } from '../models/User.model';

export const userService = {
  async create(data: { email: string; name?: string; password: string }) {
    const user = await User.create(data);
    return user.toJSON();
  },

  async findByEmail(email: string) {
    return await User.findOne({ email }).select('+password');
  },

  async findById(id: string) {
    return await User.findById(id).populate({
      path: 'posts',
      match: { published: true },
    });
  },

  async update(id: string, data: { name?: string }) {
    return await User.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
  },

  async delete(id: string) {
    return await User.findByIdAndDelete(id);
  },
};
```

### Server Integration

In `src/server.ts`:

```typescript
import connectDB from './config/database';

// Connect to MongoDB
connectDB();
```

## Redis

### Installation

```bash
npm install redis
npm install -D @types/redis
```

### Redis Configuration

Create `src/config/redis.ts`:

```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        console.error('Redis reconnection failed after 10 attempts');
        return new Error('Redis reconnection limit exceeded');
      }
      return Math.min(retries * 100, 3000);
    },
  },
});

redisClient.on('error', (err) => {
  console.error('Redis error:', err);
});

redisClient.on('connect', () => {
  console.log('Redis connected');
});

redisClient.on('ready', () => {
  console.log('Redis ready');
});

// Connect
redisClient.connect().catch(console.error);

// Graceful shutdown
process.on('SIGINT', async () => {
  await redisClient.quit();
  process.exit(0);
});

export default redisClient;
```

### Caching Service

Create `src/services/cache.service.ts`:

```typescript
import redisClient from '../config/redis';

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  },

  async deletePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache delete pattern error:', error);
    }
  },

  async clear(): Promise<void> {
    try {
      await redisClient.flushDb();
    } catch (error) {
      console.error('Cache clear error:', error);
    }
  },
};
```

### Caching Middleware

```typescript
// src/middleware/cache.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../services/cache.service';

export const cacheMiddleware = (ttl: number = 3600) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `cache:${req.originalUrl}`;

    try {
      const cachedData = await cacheService.get(key);

      if (cachedData) {
        return res.json(cachedData);
      }

      // Store the original json method
      const originalJson = res.json.bind(res);

      // Override json method to cache the response
      res.json = (data: any) => {
        cacheService.set(key, data, ttl);
        return originalJson(data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};
```

### Usage Example

```typescript
import { cacheMiddleware } from '../middleware/cache.middleware';

// Cache for 1 hour
router.get('/users', cacheMiddleware(3600), getUsers);

// In controller, invalidate cache on updates
export const updateUser = async (req: Request, res: Response) => {
  const user = await userService.update(req.params.id, req.body);

  // Invalidate cache
  await cacheService.deletePattern('cache:/api/users*');

  res.json({ success: true, data: user });
};
```

## Environment Variables

Add to `.env.example`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
MONGODB_URI=mongodb://localhost:27017/dbname
REDIS_URL=redis://localhost:6379

# PostgreSQL specific
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dbname
POSTGRES_USER=user
POSTGRES_PASSWORD=password

# MongoDB specific
MONGO_HOST=localhost
MONGO_PORT=27017
MONGO_DB=dbname
MONGO_USER=user
MONGO_PASSWORD=password

# Redis specific
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

## Docker Compose Setup

Create `docker-compose.yml` for local development:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dbname
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  mongodb:
    image: mongo:7
    environment:
      MONGO_INITDB_ROOT_USERNAME: user
      MONGO_INITDB_ROOT_PASSWORD: password
      MONGO_INITDB_DATABASE: dbname
    ports:
      - '27017:27017'
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  postgres_data:
  mongo_data:
  redis_data:
```

Run with:
```bash
docker-compose up -d
```

## Best Practices

### Connection Management
- Use connection pooling
- Handle reconnection gracefully
- Close connections on shutdown
- Set appropriate timeouts

### Error Handling
- Log connection errors
- Implement retry logic
- Provide fallbacks for cache failures
- Never expose database errors to clients

### Security
- Use environment variables for credentials
- Enable SSL/TLS in production
- Restrict database user permissions
- Sanitize inputs to prevent injection

### Performance
- Create appropriate indexes
- Use pagination for large datasets
- Implement caching strategically
- Monitor query performance
- Use connection pooling

### Migrations
- Version control schema changes
- Test migrations on staging first
- Keep migrations reversible
- Document breaking changes
