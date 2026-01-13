# Middleware Patterns Reference

Comprehensive guide to implementing middleware in Express.js applications.

## Error Handling Middleware

### Custom Error Classes

Create `src/utils/errors.ts`:

```typescript
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code: string = 'INTERNAL_ERROR',
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(403, message, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(404, message, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message, 'CONFLICT');
  }
}
```

### Global Error Handler

Create `src/middleware/error.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
  });

  // Handle custom app errors
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
      },
    });
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: err.message,
      },
    });
  }

  // Handle Mongoose cast errors
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      error: {
        code: 'INVALID_ID',
        message: 'Invalid ID format',
      },
    });
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid authentication token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Authentication token has expired',
      },
    });
  }

  // Default server error
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development'
        ? err.message
        : 'Internal server error',
    },
  });
};

// Not found handler
export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.originalUrl} not found`,
    },
  });
};
```

### Async Error Wrapper

Create `src/utils/async-handler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

Usage in controllers:

```typescript
import { asyncHandler } from '../utils/async-handler';

export const getUsers = asyncHandler(async (req, res) => {
  const users = await userService.findAll();
  res.json({ success: true, data: users });
});
```

## Authentication Middleware

### JWT Authentication

**Note**: For comprehensive authentication, use the `/better-auth` skill.

Create `src/middleware/auth.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '../utils/errors';

interface JWTPayload {
  userId: string;
  email: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'secret'
    ) as JWTPayload;

    // Attach user to request
    req.user = decoded;

    next();
  } catch (error) {
    next(new UnauthorizedError('Invalid or expired token'));
  }
};

// Optional authentication (doesn't fail if no token)
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'secret'
      ) as JWTPayload;
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Continue without user
    next();
  }
};
```

### Role-Based Access Control

```typescript
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new UnauthorizedError());
    }

    if (!roles.includes(req.user.role || '')) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
};

// Usage
router.delete('/:id', authenticate, authorize('admin', 'moderator'), deleteUser);
```

### Resource Ownership Check

```typescript
export const checkOwnership = (resourceField: string = 'userId') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new UnauthorizedError());
      }

      const resourceUserId = req.params[resourceField] || req.body[resourceField];

      if (resourceUserId !== req.user.userId && req.user.role !== 'admin') {
        return next(new ForbiddenError('You do not own this resource'));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Usage
router.put('/:userId/profile', authenticate, checkOwnership('userId'), updateProfile);
```

## Validation Middleware

### Express Validator

Create `src/middleware/validation.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import { ValidationError } from '../utils/errors';

export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed', errors.array());
  }

  next();
};

// User validation rules
export const validateCreateUser = [
  body('email')
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and number'),
  validate,
];

export const validateUpdateUser = [
  param('id')
    .isUUID()
    .withMessage('Invalid user ID'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Must be a valid email')
    .normalizeEmail(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  validate,
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
    .toInt(),
  validate,
];
```

### Zod Validation

```typescript
import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';
import { ValidationError } from '../utils/errors';

export const validateWithZod = (schema: ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', error.errors));
      } else {
        next(error);
      }
    }
  };
};

// Schema definitions
export const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  name: z.string().min(2).max(50).optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain uppercase, lowercase, and number'
    ),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  name: z.string().min(2).max(50).optional(),
});

// Usage
router.post('/', validateWithZod(createUserSchema), createUser);
```

## Rate Limiting

Create `src/middleware/rate-limit.middleware.ts`:

```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redisClient from '../config/redis';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
});

// Redis-based rate limiter (for distributed systems)
export const redisLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000,
  max: 100,
});

// Usage
app.use('/api/', apiLimiter);
app.use('/api/auth/', authLimiter);
```

## Request Logging

Create `src/middleware/logger.middleware.ts`:

```typescript
import morgan from 'morgan';
import winston from 'winston';

// Winston logger configuration
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Morgan HTTP logger
export const httpLogger = morgan(
  ':method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
  }
);

// Request ID middleware
export const requestId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || crypto.randomUUID();
  res.setHeader('X-Request-ID', req.id);
  next();
};

export { logger };
```

## Security Middleware

Create `src/middleware/security.middleware.ts`:

```typescript
import helmet from 'helmet';
import cors from 'cors';
import { Request, Response, NextFunction } from 'express';

// CORS configuration
export const corsOptions = {
  origin: (origin: string | undefined, callback: Function) => {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Helmet security headers
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
});

// Sanitize user input
export const sanitizeInput = (req: Request, res: Response, next: NextFunction) => {
  // Remove any properties starting with $
  const sanitize = (obj: any): any => {
    if (typeof obj !== 'object' || obj === null) return obj;

    Object.keys(obj).forEach((key) => {
      if (key.startsWith('$') || key.startsWith('_')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });

    return obj;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);

  next();
};
```

## File Upload Middleware

```typescript
import multer from 'multer';
import path from 'path';
import { ValidationError } from '../utils/errors';

// Disk storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ValidationError('Invalid file type. Only JPEG, PNG, and GIF are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});
```

## Middleware Integration

In `src/server.ts`:

```typescript
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOptions, helmetConfig, sanitizeInput } from './middleware/security.middleware';
import { httpLogger, requestId } from './middleware/logger.middleware';
import { apiLimiter } from './middleware/rate-limit.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';

const app = express();

// Security middleware
app.use(helmet(helmetConfig));
app.use(cors(corsOptions));

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging and tracking
app.use(requestId);
app.use(httpLogger);

// Rate limiting
app.use('/api/', apiLimiter);

// Input sanitization
app.use(sanitizeInput);

// Routes
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);

// Error handling (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
```

## Best Practices

### Middleware Order
1. Security headers (helmet)
2. CORS
3. Body parsing
4. Logging
5. Rate limiting
6. Authentication
7. Routes
8. Not found handler
9. Error handler (must be last)

### Error Handling
- Use custom error classes
- Catch all async errors
- Never expose internal errors
- Log errors with context

### Security
- Always validate and sanitize input
- Use rate limiting on all endpoints
- Implement proper CORS configuration
- Keep security middleware updated

### Performance
- Use caching middleware strategically
- Implement compression
- Optimize rate limit windows
- Monitor middleware performance
