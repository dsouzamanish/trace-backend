# Momentum - Project Context & Documentation

## 📋 Project Overview

**Project Name:** Momentum — Blockers Tracker & Insights Platform  
**Started:** December 2024  
**Status:** In Development  

Momentum is an internal productivity improvement tool that enables team members to log daily blockers, analyze productivity patterns, and provides managers with team-wide insights. The application leverages Contentstack CMS for data storage and management.

---

## 🏗️ Architecture

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend** | NestJS (TypeScript) | REST API, Business Logic |
| **Frontend** | React + Redux | User Interface, State Management |
| **CMS** | Contentstack | Data Storage & Content Management |
| **Auth** | Google OAuth 2.0 + JWT | Authentication & Authorization |
| **Process Manager** | PM2 | Application Lifecycle Management |
| **Hosting** | Contentstack Launch | Frontend & Backend Deployment |

### Directory Structure

```
trace/
├── backend/                 # NestJS Backend Application
│   ├── src/
│   │   ├── common/          # Shared utilities, guards, decorators
│   │   ├── modules/
│   │   │   ├── auth/        # Authentication (Google OAuth, JWT)
│   │   │   ├── contentstack/ # Contentstack SDK integration
│   │   │   ├── team-member/ # Team Member CRUD operations
│   │   │   ├── team/        # Team management (manager determination)
│   │   │   ├── blocker/     # Blocker CRUD operations
│   │   │   ├── ai-report/   # AI Report generation
│   │   │   ├── slack/       # Slack integration (/blocker command)
│   │   │   └── migration/   # Content type & seed data management
│   │   └── main.ts          # Application entry point
│   └── package.json
├── frontend/                # React Frontend Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/      # Layout, LoadingSpinner, StatCard
│   │   │   ├── blockers/    # BlockerCard, CreateBlockerModal
│   │   │   ├── dashboard/   # StatsOverview, TrendChart, CategoryBreakdown
│   │   │   ├── ai-report/   # AiReportCard, AiReportDetail
│   │   │   └── team/        # TeamMemberCard, MemberDetailModal
│   │   ├── pages/           # LoginPage, Dashboard, BlockersPage, MyTeamPage
│   │   ├── store/           # Redux store & slices
│   │   ├── services/        # API service layer
│   │   └── App.tsx
│   └── package.json
├── prd.md                   # Product Requirements Document
├── context.md               # This file - Project documentation
├── .cursorrules             # Cursor AI coding guidelines
├── startup.json             # PM2 configuration
└── ecosystem.config.js      # PM2 ecosystem config
```

---

## 📊 Content Models (Contentstack)

### 1. Team Member (`team_member`)

Stores team member information for user management and blocker association.

| Field | Type | Description |
|-------|------|-------------|
| `first_name` | Text | Member's first name (Required) |
| `last_name` | Text | Member's last name (Required) |
| `email` | Text | Unique email for login/mapping (Required, Unique) |
| `slack_id` | Text | Slack user ID for integration |
| `profile_pic` | File | Uploaded profile image |
| `profile_pic_url` | Text | External profile URL (Google OAuth) |
| `designation` | Select | Role: Engineer, Sr. Engineer, Tech Lead, QA, Manager, Other |
| `team` | Text | Team name (e.g., CMS Core, QA Automation) |
| `is_manager` | Boolean | Manager privileges flag |
| `joined_date` | Date | Date joined team |
| `status` | Select | Active / Inactive |

### 2. Blocker (`blocker`)

Stores blocker entries reported by team members.

| Field | Type | Description |
|-------|------|-------------|
| `team_member` | Reference | Links to team_member entry (Required) |
| `description` | Text (Multiline) | Blocker description (Required) |
| `category` | Select | Process, Technical, Dependency, Infrastructure, Other |
| `severity` | Select | Low, Medium, High |
| `timestamp` | ISO Date | Time of submission |
| `status` | Select | Open, Resolved, Ignored |
| `reported_via` | Text | Source: Slack, Web |
| `manager_notes` | Text | Resolution notes |

### 3. AI Report (`ai_report`)

Stores AI-generated insights and recommendations.

| Field | Type | Description |
|-------|------|-------------|
| `report_type` | Select | individual, team |
| `target_member` | Reference | Links to team_member (for individual reports) |
| `report_period` | Select | weekly, monthly, quarterly |
| `summary` | Text (Multiline) | AI-generated summary |
| `action_items` | Text (Multiline) | JSON array of action items |
| `insights` | Text (Multiline) | JSON array of insights |
| `generated_at` | ISO Date | Report generation timestamp |

### 4. Team (`team`)

Organizes team members into teams and **determines manager privileges**.

| Field | Type | Description |
|-------|------|-------------|
| `title` | Text | Team name (Required, Unique) |
| `team_id` | Text | Unique team identifier (Required, Unique) |
| `description` | Text (Multiline) | Team description |
| `manager` | Reference | **Single** reference to team_member (Required) - **Determines manager status** |
| `members` | Reference | **Multiple** references to team_member |
| `status` | Select | Active, Inactive, Archived |

**Note:** The `manager` reference field is the source of truth for manager privileges. If a user is set as the manager in any Team entry, they gain access to the "My Team" feature.

---

## 🔐 Authentication Flow

### Google OAuth Auto-Registration

When a user logs in via Google OAuth for the first time, the system automatically creates their Team Member profile:

```
┌─────────────────────────────────────────────────────────────┐
│                    Google OAuth Login                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              AuthService.validateGoogleUser()               │
│  - Receives: email, firstName, lastName, picture            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│           TeamMemberService.findByEmail(email)              │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
               EXISTS               NOT FOUND
                    │                   │
                    ▼                   ▼
            ┌───────────────┐   ┌───────────────────────────┐
            │ Return        │   │ Create Team Member:       │
            │ existing      │   │ - firstName (Google)      │
            │ team member   │   │ - lastName (Google)       │
            └───────────────┘   │ - email (Google)          │
                    │           │ - profilePicUrl (Google)  │
                    │           │ - designation: "Other"    │
                    │           │ - isManager: false        │
                    │           │ - status: "Active"        │
                    │           └───────────────────────────┘
                    │                   │
                    └─────────┬─────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Generate JWT Token                              │
│  Payload: sub, email, firstName, lastName, isManager, team  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Return AuthResponse                             │
│  { accessToken, user: { uid, email, ... } }                 │
└─────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```typescript
interface JwtPayload {
  sub: string;          // User UID (Contentstack entry UID)
  email: string;
  firstName: string;
  lastName: string;
  isManager: boolean;   // Derived from Team entries (if user is manager of any team)
  team?: string;
  managedTeams?: string[];  // UIDs of teams where user is the manager
}
```

### Manager Determination Logic

Manager status is **derived from Team entries**, not from the `is_manager` field on team_member:

```
┌─────────────────────────────────────────────────────────────┐
│              User Login (Google OAuth)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│         TeamService.findTeamsManagedBy(userUid)             │
│   - Queries all Team entries in Contentstack                │
│   - Filters where team.manager.uid === userUid              │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
          managedTeams.length > 0    managedTeams.length === 0
                    │                   │
                    ▼                   ▼
            ┌───────────────┐   ┌───────────────────┐
            │ isManager:    │   │ isManager: false  │
            │ true          │   │ "My Team" hidden  │
            │ "My Team"     │   └───────────────────┘
            │ visible       │
            └───────────────┘
```

**To make a user a manager:**
1. Create a Team entry in Contentstack
2. Set the user's team_member entry as the `manager` reference
3. On next login, the user will have `isManager: true`

---

## 🔧 Implementation Decisions

### 1. Contentstack SDK Integration

**Decision:** Use both Delivery SDK and Management SDK

- **Delivery SDK** (`contentstack`): For reading/querying data (faster, uses CDN)
- **Management SDK** (`@contentstack/management`): For creating/updating entries

**Rationale:** Separation of concerns - read operations use optimized delivery layer, write operations use management API.

**Implementation Note:** The Delivery SDK required `require()` import instead of ES6 import due to CommonJS/ESM compatibility issues at runtime.

```typescript
// This works at runtime
const Contentstack = require('contentstack');

// This caused "Cannot read properties of undefined (reading 'Stack')"
import Contentstack from 'contentstack';
```

### 2. Profile Picture Handling

**Decision:** Added `profile_pic_url` text field alongside `profile_pic` file field

**Rationale:** Contentstack file fields cannot directly accept external URLs. Google OAuth provides profile pictures as URLs, not uploadable files.

**Implementation:**
- `profile_pic`: File field for manually uploaded images
- `profile_pic_url`: Text field for external URLs (Google, etc.)
- Service returns `profilePicUrl || profilePic?.url` for unified access

### 3. Schema Field Types

**Decision:** Changed AI Report `action_items` and `insights` from `json` to `text` (multiline)

**Rationale:** Contentstack doesn't support a direct `json` data type. Storing JSON as multiline text allows flexibility while maintaining structure (parsed at application level).

### 4. Enum Field Display Type

**Decision:** All enum/select fields include `display_type: 'dropdown'`

**Rationale:** Contentstack API requires explicit `display_type` for enum fields during content type creation.

### 5. Type Assertions for Config Values

**Decision:** Use `as string` type assertions for ConfigService values

**Rationale:** `configService.get<string>()` returns `string | undefined`, but Contentstack SDK requires non-null strings. Type assertions ensure TypeScript compliance while `.env` validation guarantees values exist at runtime.

```typescript
this.deliveryStack = Contentstack.Stack({
  api_key: this.configService.get<string>('CONTENTSTACK_API_KEY') as string,
  // ...
});
```

### 6. Manager Status from Team Content Type

**Decision:** Manager status is derived from Team entries, not the `is_manager` field on team_member

**Rationale:** This creates a clear organizational structure where:
- Teams are explicitly defined with managers and members
- Manager privileges are tied to team management responsibility
- Changes to team structure automatically update access permissions
- No need to manually toggle `is_manager` field

**Implementation:**
```typescript
// In AuthService.generateAuthResponse()
const managedTeams = await this.teamService.findTeamsManagedBy(teamMember.uid);
const isManager = managedTeams.length > 0;
```

### 7. Comprehensive Seed Data

**Decision:** Created 26 blockers distributed across all 8 team members

**Rationale:** Ensures meaningful AI report generation with:
- Blockers across all severity levels (High, Medium, Low)
- Multiple categories (Technical, Process, Dependency, Infrastructure, Other)
- Mix of Open, Resolved, and Ignored statuses
- Blockers assigned to both managers and individual contributors

---

## 🚀 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/google` | Initiate Google OAuth flow |
| GET | `/api/auth/google/callback` | Google OAuth callback |
| GET | `/api/auth/me` | Get current user profile |
| POST | `/api/auth/refresh` | Refresh JWT token |

### Team Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/team-members` | List all team members |
| GET | `/api/team-members/:id` | Get team member by ID |
| POST | `/api/team-members` | Create team member |
| PATCH | `/api/team-members/:id` | Update team member |
| DELETE | `/api/team-members/:id` | Delete team member |

### Blockers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/blockers` | List blockers (with filters) |
| GET | `/api/blockers/:id` | Get blocker by ID |
| POST | `/api/blockers` | Create blocker |
| PATCH | `/api/blockers/:id` | Update blocker |
| DELETE | `/api/blockers/:id` | Delete blocker |
| GET | `/api/blockers/my` | Get current user's blockers |
| GET | `/api/blockers/team/:teamId` | Get team blockers (manager only) |

### AI Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ai-reports/my` | Get current user's AI reports |
| GET | `/api/ai-reports/:id` | Get AI report by ID |
| GET | `/api/ai-reports/member/:memberId` | Get AI reports for a team member (Manager) |
| GET | `/api/ai-reports/team/:teamName` | Get AI reports for a team (Manager) |
| POST | `/api/ai-reports/generate/my` | Generate report for current user |
| POST | `/api/ai-reports/generate/member/:memberId` | Generate report for team member (Manager) |
| POST | `/api/ai-reports/generate/team/:teamName` | Generate team report (Manager) |

### Teams

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teams` | List all teams |
| GET | `/api/teams/:uid` | Get team by UID |
| GET | `/api/teams/by-team-id/:teamId` | Get team by team_id |
| GET | `/api/teams/member/:memberUid` | Get teams for a member |
| POST | `/api/teams` | Create a team (Manager only) |
| PUT | `/api/teams/:uid` | Update a team (Manager only) |
| POST | `/api/teams/:uid/members/:memberUid` | Add member to team (Manager) |
| DELETE | `/api/teams/:uid/members/:memberUid` | Remove member from team (Manager) |
| DELETE | `/api/teams/:uid` | Delete a team (Manager only) |

### Migration

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/migration/run` | Create/update content types |
| POST | `/api/migration/seed` | Seed sample data |
| GET | `/api/migration/status` | Check migration status |

---

## ⚙️ Environment Configuration

### Backend (.env)

```env
# Server
PORT=3001

# Contentstack Configuration
CONTENTSTACK_API_KEY=your_api_key
CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
CONTENTSTACK_MANAGEMENT_TOKEN=your_management_token
CONTENTSTACK_ENVIRONMENT=development
CONTENTSTACK_REGION=NA  # NA, EU, AZURE_NA, AZURE_EU

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3001/api/auth/google/callback

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRATION=7d

# OpenAI (for AI Reports)
OPENAI_API_KEY=your_openai_api_key

# Frontend URL (for redirects)
FRONTEND_URL=http://localhost:3000
```

### Frontend (.env)

```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## 🏃 Running the Application

### Using PM2

```bash
# Start both applications
pm2 start startup.json

# Or using ecosystem config
pm2 start ecosystem.config.js

# View logs
pm2 logs momentum-backend
pm2 logs momentum-frontend

# Restart
pm2 restart momentum-backend
pm2 restart momentum-frontend

# Stop all
pm2 stop all
```

### Manual Start

```bash
# Backend (from /trace/backend)
npm run start:dev

# Frontend (from /trace/frontend)
npm start
```

### Ports

- **Backend:** http://localhost:3001
- **Frontend:** http://localhost:3000
- **API Base:** http://localhost:3001/api
- **Swagger Docs:** http://localhost:3001/api/docs

---

## 🐛 Known Issues & Resolutions

### 1. Google OAuth redirect_uri_mismatch

**Issue:** OAuth callback fails with redirect_uri_mismatch error

**Resolution:** Ensure the callback URL in Google Cloud Console matches exactly:
```
http://localhost:3001/api/auth/google/callback
```
Note the `/api` prefix which is set by the global route prefix in NestJS.

### 2. Contentstack Delivery SDK Import Error

**Issue:** `TypeError: Cannot read properties of undefined (reading 'Stack')`

**Resolution:** Use CommonJS require instead of ES6 import:
```typescript
const Contentstack = require('contentstack');
```

### 3. Content Type Creation - JSON Field Type

**Issue:** Contentstack API error: "cannot set json data type for this field"

**Resolution:** Use `text` with `multiline: true` instead of `json` data type. Parse JSON at application level.

### 4. Enum Fields Missing display_type

**Issue:** Contentstack API error during content type creation for enum fields

**Resolution:** Add `display_type: 'dropdown'` to all enum/select field schemas.

---

## 📈 Progress Tracker

### Completed ✅

- [x] Project structure setup
- [x] Backend scaffolding (NestJS)
- [x] Frontend scaffolding (React + Redux)
- [x] Contentstack SDK integration
- [x] Content type schemas (Team Member, Blocker, AI Report, **Team**)
- [x] Migration module for content type creation
- [x] Seed data module (8 team members, 26 blockers across all severities)
- [x] Google OAuth authentication
- [x] JWT token generation and validation
- [x] Auto-registration on first Google login
- [x] Team Member CRUD API
- [x] **Team CRUD API** (for organizing teams and determining managers)
- [x] Blocker CRUD API
- [x] AI Report generation service (enhanced with severity-based action items)
- [x] PM2 configuration
- [x] PRD documentation
- [x] Context documentation (this file)
- [x] **Slack integration** (`/blocker` command with modal)
- [x] Frontend Google OAuth integration
- [x] Personal Dashboard UI
- [x] Blocker submission form
- [x] AI insights display
- [x] **My Team feature** (Manager-only team member management)
- [x] **Manager status derived from Team entries** (not is_manager field)

### In Progress 🔄

- [ ] Contentstack Launch deployment
- [ ] Railway deployment for backend

### Planned 📋

- [ ] Contentstack Automations webhook
- [ ] AI report scheduling (cron job)
- [ ] Email notifications
- [ ] Export functionality

---

## 📚 References

- [Contentstack Delivery SDK](https://www.contentstack.com/docs/developers/sdks/content-delivery-sdk/javascript/)
- [Contentstack Management SDK](https://www.contentstack.com/docs/developers/sdks/content-management-sdk/javascript/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Passport Google OAuth](http://www.passportjs.org/packages/passport-google-oauth20/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)

---

## 🆕 Recent Features

### My Team Feature (Manager Only)

The "My Team" page is visible only to managers and provides:

1. **Team Overview Cards**
   - Total team members count
   - Open blockers count
   - High severity blockers count
   - Members needing attention

2. **Team Member Cards**
   - Profile picture and details
   - Individual blocker statistics
   - Click to view detailed member view

3. **Member Detail Modal**
   - Full list of member's blockers (Open vs Resolved)
   - AI Insights tab with generated reports
   - Generate AI Summary button for individual members
   - Manager can update blocker status

4. **Team AI Report**
   - Generate comprehensive report for entire team
   - Severity-grouped analysis
   - Specific action items with solutions and effort estimates

### Enhanced AI Reports

Action items now include:
- `severity`: High, Medium, Low
- `category`: Technical, Process, Dependency, etc.
- `suggestedSolution`: Step-by-step resolution guidance
- `estimatedEffort`: quick-win, short-term, long-term
- `relatedBlockers`: Specific blockers addressed

---

*Last Updated: January 5, 2026*

