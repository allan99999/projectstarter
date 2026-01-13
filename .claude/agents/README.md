# Project Initializer Agent

## Overview

The **project-initializer** agent orchestrates the complete project initialization workflow after the `new-project` skill creates the PROJECT_SPEC.md. It handles:

1. Creating the `claude.md` project configuration file
2. Fetching external web pages for context (if user references URLs)
3. Invoking the `project-setup` skill for infrastructure setup
4. Validating all setup completed successfully
5. Providing comprehensive summary and next steps

## Location

[project-initializer.md](project-initializer.md)

## Agent Details

**Name:** `project-initializer`
**Model:** inherit
**Color:** green
**Tools:** Read, Write, Edit, Bash, Grep, Glob, TodoWrite, AskUserQuestion, Skill, WebFetch

## When This Agent Triggers

The agent automatically triggers when users say things like:
- "Set up the project infrastructure"
- "Initialize the project"
- "Configure all the environment variables and database"
- "Set up the infrastructure, check out [URL] for reference"

## Workflow

### Phase 1: Prerequisites Check
- Verifies PROJECT_SPEC.md exists
- Checks for web references in user's request
- Confirms working directory

### Phase 2: Create claude.md
Creates a comprehensive project configuration file with:
- Project context from PROJECT_SPEC.md
- Tech stack details
- Coding conventions (TypeScript, component patterns, naming)
- File organization structure
- Database patterns
- API route conventions
- Authentication guidelines
- Environment variable best practices
- Development workflow

### Phase 3: Web Context Fetching (if applicable)
If user mentioned any URLs:
- Uses WebFetch to retrieve web pages
- Extracts relevant patterns (auth, API design, UI/UX)
- Stores context for later reference
- Falls back to manual input if fetch fails

### Phase 4: Invoke Project Setup Skill
Calls the `project-setup` skill which handles:
- Environment variables (.env.example, .env, ENV_SETUP_GUIDE.md)
- Database configuration (Drizzle ORM, schema, migrations)
- Authentication setup (Better Auth, OAuth providers)
- Payment integration (Stripe, webhooks)
- Third-party services (email, storage, AI, analytics)
- Verification scripts
- Security checklist

### Phase 5: Post-Setup Validation
Verifies all files were created:
- claude.md with project conventions
- .env.example and .env
- ENV_SETUP_GUIDE.md
- Database schema and migrations
- Authentication configuration
- Infrastructure documentation

### Phase 6: Summary and Next Steps
Provides comprehensive report:
- What was set up
- Documentation created
- Action items (API keys to obtain)
- Next development steps
- External references summary

## Key Features

### 1. claude.md Creation
Automatically generates a project-specific configuration file that helps Claude understand:
- Project structure and organization
- Preferred coding patterns
- Tech stack and conventions
- Development workflow

### 2. Web Context Integration
When users reference external sites:
```
"Set up infrastructure like how Vercel does it at https://vercel.com/dashboard"
```
The agent fetches and analyzes the page to incorporate relevant patterns.

### 3. Progress Tracking
Uses TodoWrite to track:
1. Prerequisites Check
2. Create claude.md
3. Web Context Fetching (if applicable)
4. Invoke Project Setup Skill
5. Post-Setup Validation
6. Summary and Next Steps

### 4. MCP Server Guidance
If WebFetch isn't sufficient, provides instructions for creating custom MCP servers for persistent web access.

## Integration with Skills

### Works With:
- **new-project** - Requires PROJECT_SPEC.md from this skill
- **project-setup** - Invokes this skill for infrastructure setup
- **better-auth** - References for authentication configuration

### Workflow:
```
1. User runs: new-project skill (creates PROJECT_SPEC.md)
2. User says: "Set up the infrastructure"
3. Agent triggers: project-initializer
4. Agent creates: claude.md
5. Agent invokes: project-setup skill
6. Result: Fully initialized project with conventions and infrastructure
```

## Example Usage

### Basic Usage
```
User: "Now set up all the infrastructure for the project"
Agent: [Triggers project-initializer]
→ Reads PROJECT_SPEC.md
→ Creates claude.md with conventions
→ Invokes project-setup skill
→ Creates all infrastructure files
→ Provides summary with next steps
```

### With Web Reference
```
User: "Initialize the project. Check out Stripe's API docs at https://stripe.com/docs/keys"
Agent: [Triggers project-initializer]
→ Reads PROJECT_SPEC.md
→ Creates claude.md
→ Fetches Stripe docs for API key patterns
→ Invokes project-setup skill with context
→ Creates infrastructure with Stripe best practices
→ Summary includes Stripe patterns reference
```

## Files Created by This Agent

The agent orchestrates creation of:

### Direct:
- `claude.md` - Project conventions and coding standards

### Via project-setup skill:
- `.env.example` - Environment variable template
- `.env` - Development environment
- `ENV_SETUP_GUIDE.md` - API key acquisition guide
- `INFRASTRUCTURE.md` - Architecture documentation
- `db/schema.ts` - Database schema
- `db/migrate.ts` - Migration helper
- `db/index.ts` - Database client
- `lib/auth.ts` - Authentication configuration
- `lib/auth-client.ts` - Auth client
- `lib/stripe.ts` - Payment client (if applicable)
- `app/api/auth/[...all]/route.ts` - Auth routes
- `app/api/webhooks/stripe/route.ts` - Webhooks (if applicable)
- `components/providers/auth-provider.tsx` - Auth provider
- `scripts/verify-env.ts` - Environment verification
- `drizzle.config.ts` - ORM configuration
- Updated `README.md`
- Updated `package.json`

## Edge Cases Handled

- **Missing PROJECT_SPEC.md** - Instructs user to run new-project first
- **Invalid URLs** - Continues setup, asks for manual context
- **WebFetch failures** - Provides fallback options
- **Partial infrastructure** - Detects existing files, asks about updates
- **Network issues** - Clear error messages and troubleshooting

## Testing

To test the agent:

1. Create a PROJECT_SPEC.md file
2. Say: "Set up the project infrastructure"
3. Verify agent triggers
4. Check it creates claude.md
5. Verify it invokes project-setup skill
6. Confirm all files are created
7. Review final summary

## Related Documentation

- [project-setup skill](../skills/project-setup/SKILL.md)
- [project-setup reference](../skills/project-setup/REFERENCE.md)
- [new-project skill](../skills/new-project/SKILL.md)
