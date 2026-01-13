# Project Setup Reference

This document provides detailed reference information for setting up various services and integrations.

## Table of Contents
- [Database Setup Options](#database-setup-options)
- [Authentication Providers](#authentication-providers)
- [Payment Systems](#payment-systems)
- [Email Services](#email-services)
- [Cloud Storage](#cloud-storage)
- [AI Services](#ai-services)
- [Analytics Services](#analytics-services)
- [Environment Variable Patterns](#environment-variable-patterns)

## Database Setup Options

### Local PostgreSQL

**Windows:**
```bash
# Using Chocolatey
choco install postgresql

# Or download from postgresql.org
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux:**
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Create Database:**
```bash
createdb myapp_dev
```

**Connection String Format:**
```
postgresql://username:password@localhost:5432/database_name
```

### Railway PostgreSQL

1. Sign up at [railway.app](https://railway.app)
2. Click "New Project" → "Provision PostgreSQL"
3. Go to PostgreSQL service → "Connect" tab
4. Copy the "Postgres Connection URL"
5. Add to `.env` as `DATABASE_URL`

**Features:**
- Free tier: 500 hours/month
- Automatic backups
- Easy scaling
- Built-in monitoring

### Supabase PostgreSQL

1. Sign up at [supabase.com](https://supabase.com)
2. Create new project
3. Wait for database provisioning
4. Go to Settings → Database
5. Copy "Connection string" under "Connection pooling"
6. Replace `[YOUR-PASSWORD]` with your database password

**Features:**
- Free tier: 500MB database, 2GB bandwidth
- Built-in auth (can replace Better Auth)
- Real-time subscriptions
- Storage and edge functions

### Neon PostgreSQL

1. Sign up at [neon.tech](https://neon.tech)
2. Create new project
3. Copy connection string
4. Add to `.env` as `DATABASE_URL`

**Features:**
- Free tier: 10GB storage
- Serverless (scales to zero)
- Branch databases for testing
- Very fast cold starts

## Authentication Providers

### Better Auth Configuration

**Email/Password:**
```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: true,
  minPasswordLength: 8,
  maxPasswordLength: 128,
}
```

### OAuth Provider Setup

#### GitHub OAuth

1. Go to [GitHub Settings](https://github.com/settings/developers)
2. Click "OAuth Apps" → "New OAuth App"
3. Fill in:
   - Application name: Your App Name
   - Homepage URL: `http://localhost:3000` (dev) or your domain
   - Authorization callback URL: `http://localhost:3000/api/auth/callback/github`
4. Click "Register application"
5. Copy "Client ID" to `GITHUB_CLIENT_ID`
6. Generate new client secret → copy to `GITHUB_CLIENT_SECRET`

**Better Auth Config:**
```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
}
```

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable "Google+ API"
4. Go to "Credentials" → "Create Credentials" → "OAuth client ID"
5. Configure consent screen if prompted
6. Application type: "Web application"
7. Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
8. Copy Client ID and Client Secret

**Better Auth Config:**
```typescript
socialProviders: {
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
}
```

#### Discord OAuth

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application"
3. Go to "OAuth2" section
4. Copy "Client ID" and "Client Secret"
5. Add redirect: `http://localhost:3000/api/auth/callback/discord`

**Better Auth Config:**
```typescript
socialProviders: {
  discord: {
    clientId: process.env.DISCORD_CLIENT_ID!,
    clientSecret: process.env.DISCORD_CLIENT_SECRET!,
  },
}
```

## Payment Systems

### Stripe Setup

1. Sign up at [stripe.com](https://stripe.com)
2. Get test API keys from Dashboard
3. Copy:
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - Secret key → `STRIPE_SECRET_KEY`

**Webhook Setup (Local Development):**
```bash
# Install Stripe CLI
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Copy webhook signing secret to STRIPE_WEBHOOK_SECRET
```

**Webhook Setup (Production):**
1. Go to Stripe Dashboard → Developers → Webhooks
2. Click "Add endpoint"
3. URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select events to listen to
5. Copy webhook signing secret

**Common Event Types:**
- `checkout.session.completed` - Payment successful
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changed
- `customer.subscription.deleted` - Subscription cancelled
- `invoice.payment_succeeded` - Invoice paid
- `invoice.payment_failed` - Payment failed

### Paddle Setup

1. Sign up at [paddle.com](https://paddle.com)
2. Get vendor ID and API key
3. Set up webhook URL in Paddle dashboard

## Email Services

### Resend (Recommended)

1. Sign up at [resend.com](https://resend.com)
2. Go to API Keys → Create API Key
3. Copy to `RESEND_API_KEY`

**Installation:**
```bash
npm install resend
```

**Usage:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

await resend.emails.send({
  from: 'onboarding@yourdomain.com',
  to: 'user@example.com',
  subject: 'Welcome!',
  html: '<p>Welcome to our app!</p>',
});
```

**Features:**
- Free tier: 3,000 emails/month
- React Email support
- Great DX
- Good deliverability

### SendGrid

1. Sign up at [sendgrid.com](https://sendgrid.com)
2. Create API Key with full access
3. Copy to `SENDGRID_API_KEY`

**Features:**
- Free tier: 100 emails/day
- Robust enterprise features
- Email validation API
- Marketing campaigns

### Postmark

1. Sign up at [postmarkapp.com](https://postmarkapp.com)
2. Create server
3. Get server API token
4. Copy to `POSTMARK_API_KEY`

**Features:**
- Free tier: 100 emails/month
- Excellent deliverability
- Bounce/spam tracking
- Transactional focus

## Cloud Storage

### AWS S3

1. Sign up for [AWS](https://aws.amazon.com)
2. Go to IAM → Create user with S3 access
3. Create access key
4. Copy Access Key ID and Secret Access Key
5. Create S3 bucket
6. Configure bucket CORS

**Environment Variables:**
```env
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
AWS_BUCKET_NAME=your-bucket
```

**CORS Configuration:**
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["http://localhost:3000", "https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Get credentials from dashboard
3. Copy Cloud Name, API Key, API Secret

**Environment Variables:**
```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Features:**
- Free tier: 25GB storage, 25GB bandwidth
- Image transformations
- Video processing
- Great for media-heavy apps

### UploadThing (Recommended for Next.js)

1. Sign up at [uploadthing.com](https://uploadthing.com)
2. Create new app
3. Copy API key

**Features:**
- Built for Next.js
- Simple setup
- Free tier generous
- Type-safe

## AI Services

### OpenAI

1. Sign up at [platform.openai.com](https://platform.openai.com)
2. Add payment method
3. Go to API Keys
4. Create new secret key
5. Copy to `OPENAI_API_KEY`

**Models:**
- `gpt-4-turbo-preview` - Most capable
- `gpt-3.5-turbo` - Fast and cheap
- `text-embedding-ada-002` - Embeddings

### Anthropic (Claude)

1. Sign up at [console.anthropic.com](https://console.anthropic.com)
2. Add payment method
3. Get API key from dashboard
4. Copy to `ANTHROPIC_API_KEY`

**Models:**
- `claude-opus-4-5` - Most capable
- `claude-sonnet-4-5` - Balanced
- `claude-haiku-4-0` - Fastest

### Vercel AI SDK (Recommended)

Works with multiple providers through one SDK:

```bash
npm install ai
```

Supports OpenAI, Anthropic, Google, Cohere, and more.

## Analytics Services

### PostHog (Recommended)

1. Sign up at [posthog.com](https://posthog.com)
2. Create project
3. Copy API key from project settings
4. Copy host URL

**Environment Variables:**
```env
NEXT_PUBLIC_POSTHOG_KEY=phc_your_key
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
```

**Features:**
- Free tier: 1M events/month
- Product analytics
- Session replay
- Feature flags
- A/B testing
- Open source option

### Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create account and property
3. Get Measurement ID (starts with G-)
4. Copy to `NEXT_PUBLIC_GA_MEASUREMENT_ID`

### Plausible Analytics

1. Sign up at [plausible.io](https://plausible.io)
2. Add your website
3. Get script snippet with data-domain

**Features:**
- Privacy-friendly
- No cookies required
- Lightweight
- GDPR compliant

## Environment Variable Patterns

### Naming Conventions

**Next.js Public Variables:**
- Prefix with `NEXT_PUBLIC_`
- Available in browser and server
- Example: `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

**Server-Only Variables:**
- No prefix
- Only available server-side
- Example: `STRIPE_SECRET_KEY`, `DATABASE_URL`

**Secrets:**
- Never prefix with `NEXT_PUBLIC_`
- Never expose to browser
- Examples: API keys, database passwords, webhook secrets

### Security Best Practices

1. **Different keys per environment:**
   ```
   .env.local          # Local development (gitignored)
   .env.development    # Development server
   .env.staging        # Staging environment
   .env.production     # Production
   ```

2. **Use strong random strings for secrets:**
   ```bash
   # 32 bytes (256 bits) - good for most secrets
   openssl rand -base64 32

   # 64 bytes (512 bits) - extra secure
   openssl rand -base64 64
   ```

3. **Validate environment variables on startup:**
   ```typescript
   const envSchema = z.object({
     DATABASE_URL: z.string().url(),
     BETTER_AUTH_SECRET: z.string().min(32),
     // ... other required vars
   });

   envSchema.parse(process.env);
   ```

4. **Use environment variable managers:**
   - Vercel Environment Variables
   - Railway Variables
   - AWS Secrets Manager
   - HashiCorp Vault

### Common Environment Variable Templates

**Minimal Web App:**
```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
```

**Web App with OAuth:**
```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**SaaS with Payments:**
```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
RESEND_API_KEY=
```

**AI-Powered App:**
```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
```

**Full Stack SaaS:**
```env
# Database
DATABASE_URL=

# Authentication
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
BETTER_AUTH_TRUSTED_ORIGINS=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Email
RESEND_API_KEY=

# Storage
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET_NAME=

# AI
OPENAI_API_KEY=

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

## Troubleshooting

### Database Connection Issues

**Error: "password authentication failed"**
- Check username and password in connection string
- Verify PostgreSQL user exists
- Reset password: `ALTER USER username WITH PASSWORD 'newpassword';`

**Error: "Connection refused"**
- Check PostgreSQL is running: `sudo systemctl status postgresql`
- Verify port (default 5432)
- Check firewall rules

**Error: "database does not exist"**
- Create database: `createdb database_name`
- Or: `CREATE DATABASE database_name;` in psql

### Authentication Issues

**Error: "Invalid session"**
- Verify BETTER_AUTH_SECRET is set and consistent
- Check cookie settings in Better Auth config
- Ensure BETTER_AUTH_URL matches actual URL

**OAuth callback errors:**
- Verify redirect URI in OAuth app matches exactly
- Check OAuth credentials are correct
- Ensure OAuth app is not in development mode (for production)

### API Key Issues

**Error: "Invalid API key"**
- Check key is copied correctly (no extra spaces)
- Verify key is for correct environment (test vs. live)
- Regenerate key if compromised

**Rate limiting errors:**
- Check API usage in provider dashboard
- Implement caching to reduce API calls
- Consider upgrading plan

### Environment Variable Issues

**Variables not loading:**
- Restart development server after changing .env
- Check variable name spelling
- Verify .env file is in project root
- For Next.js public vars, ensure NEXT_PUBLIC_ prefix

**Variables undefined in browser:**
- Server-only variables can't be accessed client-side
- Use NEXT_PUBLIC_ prefix for client variables
- Check build process includes env vars

## Additional Resources

- [Better Auth Documentation](https://better-auth.com)
- [Drizzle ORM Documentation](https://orm.drizzle.team)
- [Stripe Documentation](https://stripe.com/docs)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
