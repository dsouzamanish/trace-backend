# Momentum Backend

NestJS backend for the Momentum - Blockers Tracker & Insights Platform.

## Tech Stack

- **Framework**: NestJS with TypeScript
- **CMS**: Contentstack (Delivery & Management SDKs)
- **Authentication**: JWT with Passport.js (Google OAuth)
- **AI**: OpenAI GPT-4o-mini for insights generation
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- npm or yarn
- Contentstack account with configured stack
- Google OAuth credentials
- OpenAI API key

## Setup

1. **Install dependencies**

```bash
cd backend
npm install
```

2. **Configure environment**

Copy `env.example` to `.env` and fill in your credentials:

```bash
cp env.example .env
```

Required environment variables:
- `CONTENTSTACK_API_KEY` - Your Contentstack stack API key
- `CONTENTSTACK_DELIVERY_TOKEN` - Delivery token for reading data
- `CONTENTSTACK_MANAGEMENT_TOKEN` - Management token for creating/updating data
- `CONTENTSTACK_ENVIRONMENT` - Environment name (e.g., "development")
- `JWT_SECRET` - Secret key for JWT tokens
- `GOOGLE_CLIENT_ID` - Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` - Google OAuth client secret
- `OPENAI_API_KEY` - OpenAI API key for AI reports

3. **Create Contentstack Content Types (Automatic)**

The application includes a migration module that automatically creates the required content types. After configuring your environment variables, run the migrations:

```bash
# Start the server
npm run start:dev

# In another terminal, run migrations and seed data
curl -X POST http://localhost:3001/api/migration/run-all
```

Or use individual endpoints:
- `POST /api/migration/run` - Create content types only
- `POST /api/migration/seed` - Seed sample data only
- `GET /api/migration/status` - Check migration status
- `DELETE /api/migration/rollback` - Delete all content types (⚠️ destructive)

This will create:
- `team_member` - Team member profiles
- `blocker` - Blocker entries
- `ai_report` - AI-generated reports

And seed 8 sample team members and 10 sample blockers for testing.

## Running the Application

```bash
# Development
npm run start:dev

# Production build
npm run build
npm run start:prod
```

The API will be available at `http://localhost:3001`

## API Documentation

Swagger documentation is available at `http://localhost:3001/api/docs`

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - OAuth callback
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/refresh` - Refresh access token

### Team Members
- `GET /api/team-members` - List all team members
- `GET /api/team-members/:id` - Get team member by ID
- `POST /api/team-members` - Create team member
- `PATCH /api/team-members/:id` - Update team member

### Blockers
- `GET /api/blockers` - List all blockers (managers)
- `GET /api/blockers/my` - Get user's blockers
- `GET /api/blockers/my/stats` - Get user's blocker stats
- `GET /api/blockers/team/:teamName` - Get team blockers
- `POST /api/blockers` - Create blocker
- `PATCH /api/blockers/:id` - Update blocker

### AI Reports
- `GET /api/ai-reports/my` - Get user's AI reports
- `POST /api/ai-reports/generate/my` - Generate personal report
- `POST /api/ai-reports/generate/team/:teamName` - Generate team report

### Migration (No Auth Required)
- `GET /api/migration/status` - Get migration status
- `POST /api/migration/run` - Run content type migrations
- `POST /api/migration/seed` - Seed sample data
- `POST /api/migration/run-all` - Run migrations and seed data
- `DELETE /api/migration/rollback` - Delete all content types

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Project Structure

```
backend/
├── src/
│   ├── common/           # Shared decorators, guards, DTOs
│   ├── config/           # Configuration files
│   ├── modules/
│   │   ├── auth/         # Authentication module
│   │   ├── blocker/      # Blocker management
│   │   ├── contentstack/ # Contentstack integration
│   │   ├── team-member/  # Team member management
│   │   ├── ai-report/    # AI insights generation
│   │   └── migration/    # Content type migrations & seeding
│   │       ├── schemas/  # Content type definitions
│   │       └── seed-data/# Sample data for seeding
│   ├── app.module.ts
│   └── main.ts
├── test/                 # E2E tests
└── package.json
```

