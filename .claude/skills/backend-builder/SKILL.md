---
name: backend-builder
description: Build production-ready Express.js backends with database integration, REST APIs, authentication, middleware, and OpenAPI documentation. Use when creating a backend, building an API server, setting up Express.js projects, implementing REST endpoints, configuring databases (PostgreSQL, MongoDB, Redis), adding authentication, or when user mentions "backend", "API server", "Express", "REST API", "database setup", or "API documentation".
---

# Backend Builder

Build production-ready Express.js backends with proper architecture, database integration, API documentation, and deployment configuration.

## Quick start

Tell me what you want to build, and I'll set up a complete backend with:
- Express.js server with TypeScript
- Database integration (PostgreSQL, MongoDB, or Redis)
- REST API endpoints with validation
- OpenAPI/Swagger documentation
- Environment configuration
- Error handling and logging
- Development and production configs

Example: "Create a backend for a task management app with user authentication and PostgreSQL"

**Note**: For authentication, use the `/better-auth` skill which provides comprehensive auth setup with Better Auth framework.

## Instructions

### Step 1: Gather requirements

Ask the user for key details:
1. **Project purpose**: What does this backend do?
2. **Database choice**: PostgreSQL (relational), MongoDB (document), or both?
3. **Key features**: Authentication, file uploads, real-time features, etc.
4. **Data models**: What entities (users, posts, tasks, etc.)?

### Step 2: Initialize project structure

Create a well-organized Express.js project:

```
project-name/
├── src/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── middleware/     # Custom middleware
│   ├── services/       # Business logic
│   ├── utils/          # Helper functions
│   ├── types/          # TypeScript types
│   └── server.ts       # Entry point
├── tests/              # Test files
├── .env.example        # Environment template
├── .gitignore
├── tsconfig.json
├── package.json
└── README.md
```

### Step 3: Set up core server

Create the Express server with essential middleware:

1. **Install dependencies**:
   ```bash
   npm init -y
   npm install express cors helmet morgan dotenv
   npm install -D typescript @types/express @types/node @types/cors ts-node nodemon
   ```

2. **Create `server.ts`** with:
   - Express app initialization
   - Middleware setup (cors, helmet, morgan, json parser)
   - Error handling middleware
   - Health check endpoint
   - Server startup logic

3. **Configure TypeScript** with `tsconfig.json`

4. **Add scripts** to package.json:
   - `dev`: Development with nodemon
   - `build`: TypeScript compilation
   - `start`: Production server
   - `test`: Run tests

### Step 4: Set up database integration

Based on user's choice, configure the database:

**PostgreSQL (with Prisma)**:
```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

- Create schema in `prisma/schema.prisma`
- Generate models with `npx prisma generate`
- Set up migrations

**MongoDB (with Mongoose)**:
```bash
npm install mongoose
```

- Create connection in `config/database.ts`
- Define schemas in `models/`
- Set up indexes and validation

**Redis (for caching/sessions)**:
```bash
npm install redis
```

- Configure client in `config/redis.ts`
- Set up connection pooling

See [database-setup.md](references/database-setup.md) for detailed configurations.

### Step 5: Build API structure

Create a scalable API architecture:

1. **Define routes** in `routes/`:
   - Organize by resource (users, posts, tasks, etc.)
   - Use Express Router
   - Group related endpoints

2. **Implement controllers** in `controllers/`:
   - Handle request/response logic
   - Validate input data
   - Call service layer
   - Return appropriate status codes

3. **Create services** in `services/`:
   - Business logic
   - Database operations
   - External API calls

4. **Add validation** with express-validator or Zod:
   ```bash
   npm install express-validator
   # or
   npm install zod
   ```

Example route structure:
```typescript
// routes/users.routes.ts
import { Router } from 'express';
import { getUsers, createUser, updateUser } from '../controllers/users.controller';
import { validateCreateUser } from '../middleware/validation';

const router = Router();

router.get('/', getUsers);
router.post('/', validateCreateUser, createUser);
router.put('/:id', updateUser);

export default router;
```

### Step 6: Add OpenAPI documentation

Generate automatic API documentation:

1. **Install Swagger tools**:
   ```bash
   npm install swagger-ui-express swagger-jsdoc
   npm install -D @types/swagger-ui-express @types/swagger-jsdoc
   ```

2. **Configure Swagger** in `config/swagger.ts`:
   - Define OpenAPI specification
   - Set API info, servers, tags
   - Configure schema components

3. **Add JSDoc comments** to routes:
   ```typescript
   /**
    * @openapi
    * /api/users:
    *   get:
    *     tags: [Users]
    *     summary: Get all users
    *     responses:
    *       200:
    *         description: Success
    */
   ```

4. **Mount Swagger UI** at `/api-docs`

See [api-documentation.md](references/api-documentation.md) for examples.

### Step 7: Implement middleware

Add essential middleware layers:

1. **Error handling**:
   - Global error handler
   - Async error wrapper
   - Custom error classes

2. **Authentication** (if needed):
   - **IMPORTANT**: Use the `/better-auth` skill for complete authentication setup
   - The better-auth skill provides comprehensive auth with Better Auth framework
   - For custom auth needs: JWT verification, session management, RBAC

3. **Logging**:
   - Request logging (morgan)
   - Application logging (winston)
   - Error tracking

4. **Security**:
   - Rate limiting (express-rate-limit)
   - Input sanitization
   - CORS configuration
   - Helmet security headers

See [middleware-patterns.md](references/middleware-patterns.md) for implementations.

### Step 8: Configure environment

Set up environment management:

1. **Create `.env.example`**:
   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL=postgresql://user:pass@localhost:5432/dbname
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your-secret-key
   ```

2. **Create `.env`** (add to .gitignore)

3. **Use dotenv** for config loading:
   ```typescript
   import dotenv from 'dotenv';
   dotenv.config();
   ```

4. **Validate environment** variables at startup

### Step 9: Add testing setup

Create a testing infrastructure:

1. **Install test tools**:
   ```bash
   npm install -D jest @types/jest ts-jest supertest @types/supertest
   ```

2. **Configure Jest** in `jest.config.js`

3. **Create test structure**:
   - Unit tests for services
   - Integration tests for routes
   - Test database setup

4. **Add test scripts** to package.json

### Step 10: Document and deploy

Finalize the backend:

1. **Write README.md** with:
   - Project description
   - Setup instructions
   - API endpoints
   - Environment variables
   - Development workflow

2. **Add deployment config**:
   - Docker and docker-compose
   - PM2 ecosystem file
   - CI/CD pipeline (GitHub Actions)

3. **Create run instructions**

See [deployment.md](references/deployment.md) for configurations.

## Best practices

### Code organization
- Separate concerns: routes, controllers, services, models
- Keep controllers thin, move logic to services
- Use dependency injection where appropriate
- Group related functionality together

### Error handling
- Use custom error classes
- Always send consistent error responses
- Log errors with context
- Never expose internal errors to clients

### Security
- Validate all inputs
- Use parameterized queries (prevent SQL injection)
- Hash passwords (bcrypt)
- Implement rate limiting
- Keep dependencies updated
- Use environment variables for secrets

### Performance
- Use database indexes
- Implement caching (Redis)
- Enable compression
- Use connection pooling
- Implement pagination for large datasets

### API design
- Use RESTful conventions
- Version your API (/api/v1/)
- Return appropriate status codes
- Include pagination metadata
- Use consistent naming

## Common patterns

### RESTful CRUD endpoints

```typescript
GET    /api/resources       # List all
GET    /api/resources/:id   # Get one
POST   /api/resources       # Create
PUT    /api/resources/:id   # Update
DELETE /api/resources/:id   # Delete
```

### Response format

```typescript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Resource created successfully"
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [ ... ]
  }
}
```

### Controller pattern

```typescript
export const createUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userData = req.body;
    const user = await userService.create(userData);
    res.status(201).json({
      success: true,
      data: user,
      message: 'User created successfully'
    });
  } catch (error) {
    next(error);
  }
};
```

## Advanced features

For advanced topics, see reference documentation:
- [Database Setup](references/database-setup.md) - Prisma, Mongoose, Redis configurations
- [API Documentation](references/api-documentation.md) - OpenAPI/Swagger setup
- [Middleware Patterns](references/middleware-patterns.md) - Auth, validation, error handling
- [Deployment](references/deployment.md) - Docker, PM2, CI/CD

## Dependencies

Core dependencies installed by this skill:
- `express` - Web framework
- `typescript` - Type safety
- `cors` - CORS middleware
- `helmet` - Security headers
- `morgan` - HTTP logging
- `dotenv` - Environment config

Database options:
- `@prisma/client` + `prisma` - PostgreSQL ORM
- `mongoose` - MongoDB ODM
- `redis` - Redis client

Documentation:
- `swagger-ui-express` - API docs UI
- `swagger-jsdoc` - JSDoc to OpenAPI

Validation:
- `express-validator` or `zod` - Input validation

## Output format

When building a backend, I will:

1. Ask clarifying questions about requirements
2. Create the project structure
3. Set up TypeScript and Express server
4. Configure the database
5. Build API routes with controllers and services
6. Add OpenAPI documentation
7. Implement middleware (auth, validation, errors)
8. Configure environment and deployment
9. Add README with setup instructions
10. Provide commands to run the server

The result will be a production-ready backend following best practices.
