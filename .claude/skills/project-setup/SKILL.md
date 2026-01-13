---
name: project-setup
description: Set up critical infrastructure after project specification is created. Handles API keys, environment variables, authentication configuration, database initialization, payment integration, and third-party services. Use after new-project skill completes, when setting up infrastructure, configuring auth, or when user mentions "setup environment", "configure API keys", "initialize database", "setup authentication", or "configure services".
---

# Project Setup & Infrastructure

This skill handles the critical infrastructure setup after the PROJECT_SPEC.md has been created by the `new-project` skill. It ensures all necessary services, API keys, authentication, database, and third-party integrations are properly configured before development begins.

## Quick Start

After completing the `new-project` skill interview, say "Set up the project infrastructure" or "Configure the environment" to begin setup.

## When to Use This Skill

Use this skill when:
- PROJECT_SPEC.md has been created and you need to implement the infrastructure
- Setting up authentication for the first time
- Configuring API keys and environment variables
- Initializing database schemas and connections
- Setting up payment systems (Stripe, etc.)
- Configuring third-party integrations
- Preparing the project for first-time development

## Setup Process

### Phase 1: Review Project Specification

**1. Read PROJECT_SPEC.md**
- Use the Read tool to load the complete project specification
- Identify all required services and integrations
- Note authentication requirements
- List database requirements
- Identify payment system needs
- Document all third-party services mentioned

**2. Create Infrastructure Checklist**
- Use TodoWrite to create a comprehensive checklist of all setup tasks
- Include:
  - Environment variables configuration
  - Database setup
  - Authentication configuration
  - Payment system setup
  - Third-party API integrations
  - Development tool configuration

### Phase 2: Environment Variables Setup

**1. Identify All Required Environment Variables**

Review PROJECT_SPEC.md and identify variables needed for:

**Database:**
- `DATABASE_URL` - PostgreSQL connection string
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME` - If using separate variables

**Authentication (Better Auth):**
- `BETTER_AUTH_SECRET` - Secret key for session encryption (generate secure random string)
- `BETTER_AUTH_URL` - Application URL (e.g., http://localhost:3000 for dev)
- `BETTER_AUTH_TRUSTED_ORIGINS` - Allowed origins for CORS
- OAuth provider credentials if mentioned:
  - `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`

**Payment Systems (Stripe):**
- `STRIPE_PUBLIC_KEY` - Public/publishable key (safe for frontend)
- `STRIPE_SECRET_KEY` - Secret key (backend only)
- `STRIPE_WEBHOOK_SECRET` - Webhook signing secret

**Email Services (if applicable):**
- Resend: `RESEND_API_KEY`
- SendGrid: `SENDGRID_API_KEY`
- Postmark: `POSTMARK_API_KEY`

**Cloud Storage (if applicable):**
- AWS S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `AWS_BUCKET_NAME`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

**AI/ML Services (if applicable):**
- OpenAI: `OPENAI_API_KEY`
- Anthropic: `ANTHROPIC_API_KEY`
- Other AI services as specified

**Analytics (if applicable):**
- Google Analytics: `GA_MEASUREMENT_ID`
- PostHog: `POSTHOG_API_KEY`, `POSTHOG_HOST`

**Other Services:**
- Any additional third-party services mentioned in PROJECT_SPEC.md

**2. Update .env.example File**

Enhance the existing .env.example or create a comprehensive one:

```env
# =============================================================================
# DATABASE CONFIGURATION
# =============================================================================
DATABASE_URL=postgresql://username:password@localhost:5432/dbname

# =============================================================================
# AUTHENTICATION (Better Auth)
# =============================================================================
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-here

# Application URL
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:3000

# OAuth Providers (if applicable)
# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# =============================================================================
# PAYMENT PROCESSING (Stripe)
# =============================================================================
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your-publishable-key
STRIPE_SECRET_KEY=sk_test_your-secret-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret

# =============================================================================
# EMAIL SERVICE
# =============================================================================
RESEND_API_KEY=re_your-api-key

# =============================================================================
# CLOUD STORAGE (if applicable)
# =============================================================================
# AWS S3
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket-name

# =============================================================================
# AI SERVICES (if applicable)
# =============================================================================
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# =============================================================================
# ANALYTICS (if applicable)
# =============================================================================
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
POSTHOG_API_KEY=phc_your-posthog-key
POSTHOG_HOST=https://app.posthog.com

# =============================================================================
# DEVELOPMENT
# =============================================================================
NODE_ENV=development
PORT=3000
```

**3. Create .env File**

Create actual .env file with development placeholders:

```bash
# Copy .env.example to .env
cp .env.example .env
```

Add clear TODOs in the .env file for values that need to be obtained:
```env
# TODO: Replace with actual database URL after setting up database
DATABASE_URL=postgresql://localhost:5432/myapp_dev

# TODO: Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=REPLACE_ME_WITH_SECURE_RANDOM_STRING

# ... etc
```

**4. Create ENV_SETUP_GUIDE.md**

Create a comprehensive guide for obtaining all necessary API keys and secrets:

```markdown
# Environment Setup Guide

This document explains how to obtain and configure all required API keys and environment variables.

## Critical Setup Steps

### 1. Database Setup

**Option A: Local PostgreSQL**
1. Install PostgreSQL: [installation guide]
2. Create database: `createdb myapp_dev`
3. Set DATABASE_URL: `postgresql://localhost:5432/myapp_dev`

**Option B: Railway**
1. Sign up at railway.app
2. Create new PostgreSQL database
3. Copy connection string to DATABASE_URL

**Option C: Supabase**
1. Sign up at supabase.com
2. Create new project
3. Get connection string from Settings > Database

### 2. Authentication Setup (Better Auth)

**Generate Secret Key:**
```bash
openssl rand -base64 32
```
Copy output to `BETTER_AUTH_SECRET`

**OAuth Providers (Optional):**

[Include detailed setup steps for each OAuth provider mentioned in spec]

### 3. Payment Setup (Stripe)

[Step-by-step Stripe setup if applicable]

### 4. Other Services

[Detailed setup for each service mentioned in PROJECT_SPEC.md]

## Quick Start Checklist

- [ ] Database configured and DATABASE_URL set
- [ ] BETTER_AUTH_SECRET generated
- [ ] BETTER_AUTH_URL set to correct domain
- [ ] Stripe keys obtained (if applicable)
- [ ] OAuth providers configured (if applicable)
- [ ] Email service API key obtained (if applicable)
- [ ] All other required API keys obtained

## Verification

Test your configuration:
```bash
npm run verify-env
```
```

### Phase 3: Database Configuration

**1. Set Up Database Connection**

Based on the database choice in PROJECT_SPEC.md:

**For PostgreSQL (Recommended):**

Install Drizzle ORM and PostgreSQL driver:
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit
```

**2. Create/Update Drizzle Configuration**

Create or update `drizzle.config.ts`:
```typescript
import type { Config } from 'drizzle-kit';

export default {
  schema: './db/schema.ts',
  out: './db/migrations',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!,
  },
} satisfies Config;
```

**3. Initialize Database Schema**

If `db/schema.ts` doesn't exist or needs enhancement based on PROJECT_SPEC.md features:

Create base schema with common tables:
```typescript
import { pgTable, serial, text, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

// Users table (for Better Auth)
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  emailVerified: boolean('email_verified').default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Sessions table (for Better Auth)
export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: serial('user_id').references(() => users.id).notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Add additional tables based on PROJECT_SPEC.md features
// Example: if project needs posts/articles
// export const posts = pgTable('posts', { ... });
```

Analyze PROJECT_SPEC.md core features and create appropriate schema tables:
- Read the features list
- For each feature, determine what data models are needed
- Create corresponding database tables
- Add proper relationships, indexes, and constraints

**4. Set Up Database Scripts**

Update `package.json` with database management scripts:
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:studio": "drizzle-kit studio",
    "db:migrate": "tsx db/migrate.ts",
    "verify-env": "tsx scripts/verify-env.ts"
  }
}
```

**5. Create Database Migration Helper**

Create `db/migrate.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

const runMigrations = async () => {
  const connection = postgres(process.env.DATABASE_URL!, { max: 1 });
  const db = drizzle(connection);

  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './db/migrations' });
  console.log('Migrations complete!');

  await connection.end();
};

runMigrations().catch(console.error);
```

**6. Create Database Client**

Create `db/index.ts` for database access:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL!;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

### Phase 4: Authentication Setup

**1. Install Better Auth**

```bash
npm install better-auth
```

**2. Create Better Auth Configuration**

Create `lib/auth.ts`:
```typescript
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from '@/db';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
  },
  socialProviders: {
    // Add providers based on PROJECT_SPEC.md requirements
    // Example:
    // github: {
    //   clientId: process.env.GITHUB_CLIENT_ID!,
    //   clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    // },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.User;
```

**3. Create Auth API Routes**

Create `app/api/auth/[...all]/route.ts`:
```typescript
import { auth } from '@/lib/auth';
import { toNextJsHandler } from 'better-auth/next-js';

export const { GET, POST } = toNextJsHandler(auth);
```

**4. Create Auth Client**

Create `lib/auth-client.ts`:
```typescript
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
});

export const { signIn, signUp, signOut, useSession } = authClient;
```

**5. Add Auth Provider**

Create `components/providers/auth-provider.tsx`:
```typescript
'use client';

import { SessionProvider } from 'better-auth/react';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
```

Update root layout to include AuthProvider.

**6. Create Auth Components**

Based on PROJECT_SPEC.md requirements, create:
- Login form component
- Sign up form component
- Password reset component
- OAuth provider buttons (if applicable)
- Protected route wrapper

### Phase 5: Payment Integration (if applicable)

**Only complete this phase if PROJECT_SPEC.md mentions payments, subscriptions, or e-commerce.**

**1. Install Stripe**

```bash
npm install stripe @stripe/stripe-js
npm install -D @stripe/react-stripe-js
```

**2. Create Stripe Client**

Create `lib/stripe.ts`:
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: true,
});
```

**3. Create Stripe Webhook Handler**

Create `app/api/webhooks/stripe/route.ts`:
```typescript
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed':
        // Handle successful checkout
        break;
      case 'customer.subscription.updated':
        // Handle subscription updates
        break;
      // Add more event handlers based on requirements
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }
}
```

**4. Create Payment Components**

Based on features, create:
- Checkout button component
- Pricing table component
- Subscription management component

### Phase 6: Additional Service Integrations

**For each service mentioned in PROJECT_SPEC.md:**

**Email Service (Resend, SendGrid, etc.):**
1. Install client library
2. Create email client configuration
3. Create email templates
4. Set up transactional email functions

**Cloud Storage (S3, Cloudinary, etc.):**
1. Install SDK
2. Configure upload handlers
3. Create utility functions for upload/download
4. Set up proper CORS and bucket policies

**AI Services (OpenAI, Anthropic, etc.):**
1. Install SDK
2. Create API client wrapper
3. Implement rate limiting
4. Add error handling and retry logic

**Analytics (PostHog, GA, etc.):**
1. Install tracking library
2. Create analytics provider
3. Set up event tracking utilities
4. Configure privacy settings

### Phase 7: Environment Verification Script

**Create scripts/verify-env.ts**

```typescript
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  // Add all required env vars based on PROJECT_SPEC.md
});

const optionalEnvSchema = z.object({
  // Add optional env vars
});

async function verifyEnvironment() {
  console.log('🔍 Verifying environment configuration...\n');

  // Check required variables
  try {
    envSchema.parse(process.env);
    console.log('✅ All required environment variables are set\n');
  } catch (error) {
    console.error('❌ Missing or invalid required environment variables:');
    if (error instanceof z.ZodError) {
      error.errors.forEach((err) => {
        console.error(`   - ${err.path.join('.')}: ${err.message}`);
      });
    }
    process.exit(1);
  }

  // Check optional variables
  const optionalResult = optionalEnvSchema.safeParse(process.env);
  if (!optionalResult.success) {
    console.log('⚠️  Optional environment variables not set:');
    optionalResult.error.errors.forEach((err) => {
      console.log(`   - ${err.path.join('.')}`);
    });
    console.log();
  }

  // Test database connection
  console.log('🔌 Testing database connection...');
  try {
    const { db } = await import('../db');
    // Simple query to test connection
    await db.execute('SELECT 1');
    console.log('✅ Database connection successful\n');
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }

  console.log('✨ Environment verification complete!');
}

verifyEnvironment().catch(console.error);
```

### Phase 8: Documentation Updates

**1. Update README.md**

Add comprehensive setup instructions:
- Prerequisites (Node.js, PostgreSQL, etc.)
- Step-by-step environment setup
- How to obtain API keys
- First-time setup commands
- Verification steps

**2. Create INFRASTRUCTURE.md**

Document the complete infrastructure setup:
- Architecture overview
- Service dependencies
- Environment variables reference
- Database schema overview
- Authentication flow
- Payment integration details (if applicable)
- Deployment considerations

**3. Update .gitignore**

Ensure all sensitive files are excluded:
```
.env
.env.local
.env.*.local
*.pem
*.key
.DS_Store
node_modules/
```

### Phase 9: Security Checklist

**1. Verify Security Best Practices**

- [ ] All secrets use strong random generation
- [ ] .env files are in .gitignore
- [ ] API keys have appropriate scopes/permissions
- [ ] Database has proper user permissions
- [ ] CORS is properly configured
- [ ] Rate limiting is configured (if applicable)
- [ ] Webhook signatures are verified
- [ ] Input validation is in place
- [ ] SQL injection prevention (via Drizzle ORM)
- [ ] XSS prevention (React auto-escaping)

**2. Create Security Notes**

Add security reminders to ENV_SETUP_GUIDE.md:
- Never commit secrets to git
- Use different keys for dev/staging/production
- Rotate secrets regularly
- Use environment-specific configurations
- Enable MFA on service accounts

### Phase 10: Final Setup Summary

**1. Run All Setup Commands**

Execute in order:
```bash
# Install dependencies
npm install

# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push

# Verify environment
npm run verify-env

# Start development server
npm run dev
```

**2. Present Setup Summary**

After completing all phases, present a comprehensive summary:

```
✅ Infrastructure Setup Complete!

📦 Installed Packages:
- Drizzle ORM + PostgreSQL driver
- Better Auth
- [Other packages based on PROJECT_SPEC.md]

🗄️ Database:
- Schema created with [X] tables
- Migrations set up
- Connection verified

🔐 Authentication:
- Better Auth configured
- [OAuth providers] enabled
- Auth API routes created
- Session management ready

💳 Payments: [if applicable]
- Stripe integrated
- Webhook handler configured
- Payment components created

📧 Email: [if applicable]
- [Service] configured
- Templates created

📊 Analytics: [if applicable]
- [Service] set up
- Event tracking ready

📝 Documentation Created:
- ENV_SETUP_GUIDE.md - How to obtain API keys
- INFRASTRUCTURE.md - Architecture overview
- Updated README.md with setup instructions

🔒 Security:
- All secrets properly configured
- .env files excluded from git
- Environment verification script created

⚠️ ACTION REQUIRED:
1. Review ENV_SETUP_GUIDE.md
2. Obtain necessary API keys:
   [List of services that need API keys]
3. Update .env with actual values
4. Run: npm run verify-env
5. Run: npm run dev

📋 Next Steps:
- Review INFRASTRUCTURE.md for architecture details
- Start implementing [first feature from PROJECT_SPEC.md]
- Set up production environment when ready

All critical infrastructure is configured. Ready to start development!
```

## User Interaction Guidelines

**1. Ask for Clarification When Needed**

Use AskUserQuestion for:
- Database hosting preference (local vs. Railway vs. Supabase)
- Which OAuth providers to enable
- Whether to set up optional services
- Deployment target specifics

**2. Provide Progress Updates**

Use TodoWrite to track progress through all phases. Update todos as you complete each section.

**3. Handle Existing Setup**

If some infrastructure already exists:
- Detect existing files (db/schema.ts, lib/auth.ts, etc.)
- Ask if user wants to update or skip
- Merge new configurations with existing ones
- Don't overwrite custom user code

## Best Practices

1. **Security First**: Never expose secrets, always use environment variables
2. **Comprehensive Documentation**: Every service setup should be documented
3. **Verification**: Always test database connections and API key validity
4. **Incremental Setup**: Complete one service at a time, verify before moving on
5. **Error Handling**: Provide clear error messages and troubleshooting steps
6. **Future-Proof**: Set up infrastructure that scales with the project
7. **Development Experience**: Make it easy for new developers to get started
8. **Use Tools Effectively**:
   - Read: For PROJECT_SPEC.md and existing files
   - Write: For new configuration files
   - Edit: For updating existing files
   - Bash: For running setup commands and verification
   - TodoWrite: For tracking progress
   - AskUserQuestion: For user preferences

## Integration with Other Skills

- **new-project**: This skill runs immediately after new-project completes
- **better-auth**: Reference for advanced auth configuration
- **backend-design**: May be invoked for API architecture

## Troubleshooting

**Database connection fails:**
- Verify DATABASE_URL format
- Check PostgreSQL is running
- Confirm database exists
- Test credentials

**Better Auth errors:**
- Ensure BETTER_AUTH_SECRET is at least 32 characters
- Verify URL matches actual application URL
- Check OAuth credentials are correct

**Stripe webhook issues:**
- Use Stripe CLI for local testing: `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
- Verify webhook secret matches
- Check webhook signature validation

**Environment verification fails:**
- Review each failed variable in .env
- Consult ENV_SETUP_GUIDE.md
- Ensure no typos in variable names
- Check for missing quotes in values

## Notes for Claude

When this skill is activated:

1. **Read PROJECT_SPEC.md first** - All infrastructure setup should be based on the specification
2. **Use TodoWrite extensively** - Track each phase and sub-task
3. **Create todos for each major phase**:
   - Environment variables setup
   - Database configuration
   - Authentication setup
   - Payment integration (if applicable)
   - Additional services
   - Verification script
   - Documentation
   - Security checklist
4. **Don't skip steps** - Each phase is critical for preventing issues later
5. **Generate actual code** - No placeholders, create working implementations
6. **Test as you go** - Verify each service is configured correctly before moving on
7. **Be thorough with documentation** - Future developers will thank you
8. **Ask questions when PROJECT_SPEC.md is unclear** about required services
9. **Mark todos completed** as you finish each task
10. **Provide a comprehensive summary** at the end with action items for the user

## Example Output Files

This skill will create/update:
- `.env.example` - Comprehensive environment template
- `.env` - Development environment with placeholders
- `ENV_SETUP_GUIDE.md` - How to obtain API keys
- `INFRASTRUCTURE.md` - Architecture documentation
- `db/schema.ts` - Database schema
- `db/migrate.ts` - Migration helper
- `db/index.ts` - Database client
- `lib/auth.ts` - Better Auth server config
- `lib/auth-client.ts` - Better Auth client
- `lib/stripe.ts` - Stripe client (if applicable)
- `app/api/auth/[...all]/route.ts` - Auth API routes
- `app/api/webhooks/stripe/route.ts` - Stripe webhooks (if applicable)
- `components/providers/auth-provider.tsx` - Auth provider
- `scripts/verify-env.ts` - Environment verification
- `drizzle.config.ts` - Drizzle configuration
- Updated `README.md` - Setup instructions
- Updated `package.json` - Scripts and dependencies

All files will be production-ready with proper error handling, TypeScript types, and security best practices.
