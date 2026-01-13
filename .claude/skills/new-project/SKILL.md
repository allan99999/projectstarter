---
name: new-project
description: Intelligent project initialization through guided interview. Gathers app description, features, existing code/assets, tech stack preferences, and generates comprehensive project specification. Use when starting a new project, creating a new app, initializing a website, or when user mentions "new project", "start project", "create app", or "build website".
---

# New Project Setup

This skill conducts a structured interview to gather all necessary information for starting a new project, then generates comprehensive documentation and sets up the initial project structure.

## Quick Start

Simply say "I want to start a new project" or "Help me create a new app" and I'll guide you through the setup process.

## Interview Process

### Phase 1: Project Vision & Features

**1. App/Website Description**
- Ask: "Please provide a brief description of your app or website idea. What problem does it solve?"
- Capture the core purpose and value proposition

**2. Main Features (required)**
- Ask: "What are the essential features that MUST be in the initial version? List the core functionality."
- Encourage prioritization of 3-5 main features
- Ask clarifying questions for each feature if needed

**3. Additional Features (nice-to-have)**
- Ask: "What additional features would you like to include if time permits? These are lower priority enhancements."
- Capture the feature wishlist

### Phase 2: Existing Assets & Code

**4. Existing Resources**
- Ask: "Do you have any existing code, design assets, or other materials to include in this project?"
- **If YES:**
  - Ask: "Please provide the location(s) of these resources (file paths, repo URLs, etc.)"
  - **For each code repository:**
    - Clone or read the repository using appropriate tools
    - **CRITICAL:** Actually analyze the codebase structure - don't skip this step
    - Summarize key components, patterns, and architecture
    - Document reusable code, dependencies, and integration points
    - Identify potential issues or compatibility concerns
  - **For design assets:**
    - Note asset locations and types
    - Identify design system patterns if present
- **If NO:** Continue to next phase

### Phase 3: Technical Stack Selection

**5. Platform Type**
- Ask: "What type of project is this?"
- Options:
  - Web application (full-stack)
  - Mobile application
  - Desktop application
  - Backend API only
  - Other (specify)

**6. Preferred Stack Recommendation**

Present the recommended stack based on platform type:

**For Web Applications:**
- Frontend: Next.js 15+ (App Router)
- Styling: Tailwind CSS
- UI Components: shadcn/ui + Radix UI primitives
- Authentication: Better Auth
- Database: PostgreSQL
- ORM: Drizzle ORM + Drizzle Studio
- Alternative DB: Self-hosted Supabase
- Payments: Stripe
- Backend Architecture: Use the `backend-design` skill for API design

**For Mobile Applications:**
- Framework: React Native with Expo
- Architecture: Follow the `react-native-architecture` skill patterns
- Backend: Same as web (Next.js API routes or separate backend)
- Database: PostgreSQL + Drizzle ORM
- Authentication: Better Auth
- Payments: Stripe

Ask: "I recommend using our preferred stack (listed above). Would you like to use this stack, or do you have specific requirements for different technologies?"

**If user wants different stack:**
- Ask about each layer: frontend framework, styling, database, auth, etc.
- Document the custom choices and reasons

**7. Infrastructure & Deployment**
- Ask: "Where do you plan to deploy this application?"
- Common options:
  - Vercel (recommended for Next.js)
  - Railway
  - Fly.io
  - AWS/GCP/Azure
  - Self-hosted
  - Not decided yet
- Document deployment target

**8. Environment & Development Setup**
- Ask: "Do you have any specific environment requirements?"
  - Node.js version preferences
  - Package manager (npm, yarn, pnpm, bun)
  - Development tools (Docker, specific IDEs)
  - CI/CD preferences
- Ask: "Are there any environment variables or secrets we need to plan for?"
  - Document required API keys, connection strings, etc.

### Phase 4: Project Constraints & Context

**9. Timeline & Priorities**
- Ask: "Are there any critical deadlines or milestone dates we should be aware of?"
- Ask: "What should we build first? Which features are the highest priority?"

**10. Additional Context**
- Ask: "Is there anything else important I should know about this project? (specific requirements, constraints, integrations, etc.)"

## Actions After Interview

### 1. Generate PROJECT_SPEC.md

Create a comprehensive project specification document in the project root:

```markdown
# Project Specification: [Project Name]

## Project Overview
[Brief description from Phase 1]

## Core Features
[List of main features with details]

## Additional Features (Wishlist)
[List of nice-to-have features]

## Existing Assets & Code

### Existing Repositories
[For each repo: summary, key components, integration approach]

### Design Assets
[Locations and descriptions]

## Technical Stack

### Frontend
- Framework: [e.g., Next.js 15]
- Styling: [e.g., Tailwind CSS]
- UI Components: [e.g., shadcn/ui]
- [Other frontend tech]

### Backend
- Framework: [e.g., Next.js API routes]
- Database: [e.g., PostgreSQL]
- ORM: [e.g., Drizzle ORM]
- Authentication: [e.g., Better Auth]
- [Other backend tech]

### Infrastructure
- Hosting: [e.g., Vercel]
- Database Hosting: [e.g., Railway, Supabase]
- CI/CD: [if applicable]

### Mobile (if applicable)
- Framework: [e.g., Expo]
- Architecture: [e.g., react-native-architecture patterns]

## Environment Setup

### Required Tools
- Node.js: [version]
- Package Manager: [npm/yarn/pnpm/bun]
- [Other tools]

### Environment Variables
[List of required env vars with descriptions]

## Development Phases & Priorities

### Phase 1 (MVP)
[Highest priority features to build first]

### Phase 2
[Next priority features]

### Phase 3+
[Future enhancements]

## Timeline & Milestones
[Any important dates or deadlines]

## Additional Notes
[Any other important context]

## Integration with Existing Code
[If applicable: how existing code will be integrated]

---
*Generated by Claude Code - New Project Skill*
*Date: [Current Date]*
```

### 2. Create EXISTING_CODE_ANALYSIS.md (if applicable)

If user provided existing code repositories, create detailed analysis document:

```markdown
# Existing Code Analysis

## Repository: [Repo Name/URL]

### Overview
[High-level summary of what the code does]

### Architecture
[Key architectural patterns and structure]

### Key Components
[List important files, modules, components with file paths]

### Dependencies
[Notable dependencies and their purposes]

### Reusable Code
[Specific functions, components, utilities that can be reused]

### Integration Strategy
[How this code should be integrated into the new project]

### Potential Issues
[Any compatibility concerns, outdated patterns, or technical debt]

---
[Repeat for each repository]
```

### 3. Initialize Project Structure

Based on the platform type:

**For Web Projects (Next.js):**
```bash
# Create Next.js project
npx create-next-app@latest project-name --typescript --tailwind --app --use-npm

# Set up folder structure
mkdir -p app components lib db public
```

Basic structure:
```
/app          # Next.js app router pages
/components   # React components
/lib          # Utilities and helpers
/db           # Database schema and migrations
  /schema.ts  # Drizzle schema
/public       # Static assets
.env.example  # Environment variables template
```

**For Mobile Projects (React Native/Expo):**
- Invoke the `react-native-architecture` skill to set up the project structure
- Set up backend separately (likely Next.js API or standalone backend)

**For Backend-Only Projects:**
- Invoke the `backend-design` skill to design the API architecture
- Set up chosen backend framework
- Initialize database and ORM

### 4. Create Configuration Files

Generate the following files:

**package.json** - With appropriate dependencies for the chosen stack

**.env.example** - Documented environment variables:
```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/dbname

# Authentication (Better Auth)
BETTER_AUTH_SECRET=your-secret-here
BETTER_AUTH_URL=http://localhost:3000

# Stripe (if applicable)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...

# Add other environment variables as needed
```

**.gitignore** - Appropriate for the stack:
```
node_modules/
.env
.env.local
.next/
dist/
build/
*.log
.DS_Store
```

**README.md** - Setup and development instructions:
```markdown
# [Project Name]

[Brief description]

## Setup

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Set up environment variables:
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your actual values
   \`\`\`

3. Set up database:
   \`\`\`bash
   npm run db:push
   \`\`\`

4. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## Tech Stack

[List of technologies]

## Project Structure

[Brief explanation of folder structure]

## Environment Variables

See .env.example for required environment variables.

## Development

[Development workflow and commands]
```

**TypeScript configuration** (if using TypeScript - recommended)

### 5. Set Up Database Schema (if applicable)

Create initial Drizzle schema based on core features:

**db/schema.ts:**
```typescript
import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Example schema - customize based on project needs
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name'),
  createdAt: timestamp('created_at').defaultNow(),
});

// Add more tables based on project requirements
```

Document database setup instructions in README.md

### 6. Present Summary Report

After completing all setup tasks, present:

```
✅ Project interview complete!

📋 Generated Documents:
- PROJECT_SPEC.md: Complete project specification
- EXISTING_CODE_ANALYSIS.md: Analysis of existing code (if applicable)
- README.md: Setup and development instructions

🛠️ Initialized Structure:
[List of created folders and key files]

📦 Tech Stack:
[Summary of chosen technologies]

🎯 Next Steps:
1. Review PROJECT_SPEC.md and confirm it matches your vision
2. Set up environment variables in .env (see .env.example)
3. Install dependencies: [package manager] install
4. [Database setup steps if applicable]
5. Start development server: [command]
6. Begin implementing [first priority feature]

Would you like me to start implementing the first feature, or would you like to make any changes to the specification?
```

## Best Practices

1. **Be conversational but efficient**: Keep questions clear and focused
2. **Show understanding**: Summarize user's answers to confirm understanding
3. **Provide context**: Explain WHY we recommend certain technologies
4. **Be flexible**: If user has strong preferences, adapt to them
5. **Think ahead**: Ask about integration points if using existing code
6. **Document everything**: The spec document should be the single source of truth
7. **Actually analyze code**: Don't just note that repos exist - read and understand them
8. **Use tools effectively**:
   - Use `AskUserQuestion` for each interview phase
   - Use `TodoWrite` to track interview progress and setup tasks
   - Use `Read`, `Grep`, and `Glob` to analyze existing codebases
   - Use `Bash` for git operations and project initialization

## Integration with Other Skills

- **backend-design**: Automatically invoke for API architecture design when building backend
- **react-native-architecture**: Automatically invoke for mobile app structure setup
- **better-auth**: Reference for authentication setup
- **frontend-design**: May be useful for UI/UX planning

## Requirements

This skill works best when:
- User has a clear idea (even if rough) of what they want to build
- User can provide access to existing code repositories if they exist
- User is willing to engage in the interview process

No external dependencies required - uses built-in Claude Code tools.

## Examples

**Example 1: Web Application**
```
User: "I want to start a new project"
Claude: [Loads new-project skill]
Claude: "Please provide a brief description of your app or website idea..."
User: "A task management app with team collaboration"
Claude: "What are the essential features that MUST be in the initial version?"
User: "Task creation, assignment, and status tracking"
[Interview continues through all phases]
[Claude generates PROJECT_SPEC.md and sets up Next.js project]
```

**Example 2: Mobile App with Existing Code**
```
User: "Help me build a mobile app for my existing backend"
Claude: [Loads new-project skill]
Claude: "Please provide a brief description..."
User: "Fitness tracking app"
[Interview continues]
Claude: "Do you have any existing code or assets?"
User: "Yes, backend at github.com/user/fitness-api"
Claude: [Clones and analyzes the repository]
Claude: [Creates EXISTING_CODE_ANALYSIS.md with insights]
[Invokes react-native-architecture skill for mobile setup]
```

## Troubleshooting

**Skill doesn't activate:**
- Try explicit phrases: "start new project", "create app", "initialize project"
- Make sure you're asking to start something new (not modify existing)

**Interview feels incomplete:**
- All 10 questions should be asked across the 4 phases
- If a phase is skipped, prompt Claude to continue with the next phase

**Generated files are incomplete:**
- Ensure all interview phases completed
- Check that you provided all requested information
- Review PROJECT_SPEC.md and ask for additions if needed

## Notes for Claude

When this skill is activated:

1. **Use AskUserQuestion tool** for each interview phase - don't ask multiple phases at once
2. **Track progress with TodoWrite** - create todos for:
   - Each interview phase
   - Code analysis (if applicable)
   - Document generation
   - Project initialization
   - Configuration setup
3. **Actually read repositories** - use Read, Grep, and Glob tools to understand existing code
4. **Generate real content** - no placeholders in generated files
5. **Be thorough** - the PROJECT_SPEC.md should guide the entire development process
6. **Invoke related skills** when appropriate:
   - Use `backend-design` for API architecture
   - Use `react-native-architecture` for mobile setup
7. **Present the preferred stack confidently** but allow customization
8. **Mark todos as completed** as you finish each section
