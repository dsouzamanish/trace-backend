# Slack App Setup Guide

This guide walks you through setting up the Slack app for the `/blocker` command in Momentum.

## Overview

The Slack integration allows team members to log blockers directly from Slack using the `/blocker` command. When invoked, it opens a modal where users can describe their blocker, select a category, and severity level.

## Prerequisites

- A Slack workspace where you have permission to install apps
- Your Momentum backend running (default: `http://localhost:3001`)
- For production: A publicly accessible URL (use ngrok for local development)

---

## Step 1: Create a Slack App

1. Go to [Slack API Apps](https://api.slack.com/apps)
2. Click **"Create New App"**
3. Choose **"From scratch"**
4. Enter:
   - **App Name:** `Momentum Blocker Tracker`
   - **Workspace:** Select your workspace
5. Click **"Create App"**

---

## Step 2: Configure Bot Token Scopes

1. In the left sidebar, go to **OAuth & Permissions**
2. Scroll to **Scopes** → **Bot Token Scopes**
3. Add the following scopes:

| Scope | Purpose |
|-------|---------|
| `commands` | Handle slash commands |
| `users:read` | Read user info (name, email) |
| `users:read.email` | Read user email addresses |
| `chat:write` | Send messages |
| `im:write` | Open DM channels to send confirmation messages |

---

## Step 3: Create the Slash Command

1. In the left sidebar, go to **Slash Commands**
2. Click **"Create New Command"**
3. Configure:

| Field | Value |
|-------|-------|
| Command | `/blocker` |
| Request URL | `https://your-domain.com/api/slack/commands/blocker` |
| Short Description | `Log a work blocker` |
| Usage Hint | `Describe your blocker` |

> **For local development:** Use ngrok to expose your local server:
> ```bash
> ngrok http 3001
> ```
> Then use the ngrok URL: `https://xxxx.ngrok.io/api/slack/commands/blocker`

4. Click **"Save"**

---

## Step 4: Enable Interactivity (Modal Submissions)

**⚠️ This step is critical!** This is how Slack knows where to send modal form submissions.

1. In the left sidebar, go to **Interactivity & Shortcuts**
2. Toggle **Interactivity** to **On**
3. Set **Request URL:** `https://your-domain.com/api/slack/interactions`

> **For local development with ngrok:**
> ```
> https://xxxx.ngrok-free.app/api/slack/interactions
> ```

4. Click **"Save Changes"**

### Why This Matters

Slack does NOT auto-discover your endpoints. You must explicitly tell Slack where to send data:

| What You Configure | Where in Slack App Settings | What It Does |
|-------------------|----------------------------|--------------|
| Slash Command URL | **Slash Commands** → Request URL | Receives `/blocker` command |
| Interactivity URL | **Interactivity & Shortcuts** → Request URL | Receives modal submissions |

When a user submits the blocker modal, Slack sends a POST request to the **Interactivity Request URL** you configured above.

---

## Step 5: Get Your Credentials

### Bot Token

1. Go to **OAuth & Permissions**
2. Click **"Install to Workspace"**
3. Authorize the app
4. Copy the **Bot User OAuth Token** (starts with `xoxb-`)

### Signing Secret

1. Go to **Basic Information**
2. Under **App Credentials**, find **Signing Secret**
3. Click **"Show"** and copy it

---

## Step 6: Configure Environment Variables

Add these to your backend `.env` file:

```env
# Slack Configuration
SLACK_BOT_TOKEN=xoxb-your-bot-token-here
SLACK_SIGNING_SECRET=your-signing-secret-here
```

---

## Step 7: Restart the Backend

```bash
pm2 restart momentum-backend

# Or if running manually:
npm run start:dev
```

---

## Step 8: Test the Integration

1. Open Slack in your workspace
2. Go to any channel or DM
3. Type `/blocker` and press Enter
4. A modal should appear with fields for:
   - Description
   - Category (Process, Technical, Dependency, Infrastructure, Other)
   - Severity (Low, Medium, High)
5. Fill in the details and click **Submit**
6. Check your Contentstack dashboard - a new Blocker entry should appear!

---

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│  User types /blocker in Slack                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Slack sends POST to /api/slack/commands/blocker            │
│  - trigger_id for opening modal                             │
│  - user_id, user_name                                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend opens modal via Slack API                          │
│  POST https://slack.com/api/views.open                      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  User fills form and submits                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Slack sends POST to /api/slack/interactions                │
│  - Form values (description, category, severity)            │
│  - User info                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend processes submission:                              │
│  1. Find/create team member by Slack ID or email            │
│  2. Create Blocker entry in Contentstack                    │
│  3. Send confirmation message                               │
└─────────────────────────────────────────────────────────────┘
```

---

## User Mapping

When a user submits a blocker via Slack, the system:

1. **Looks up by Slack ID:** Checks if a team member with this Slack ID exists
2. **Falls back to email:** Gets user email from Slack API, checks if team member exists
3. **Creates new member:** If no match found, creates a new team member with Slack user info

This means:
- Existing users (from web login) will have blockers linked if their Slack email matches
- New Slack users will get a team member profile created automatically

---

## Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/slack/commands/blocker` | POST | Receives `/blocker` command |
| `/api/slack/interactions` | POST | Receives modal submissions |
| `/api/slack/events` | POST | Receives Slack events (optional) |

---

## URL Configuration Summary

**Slack does NOT auto-discover your backend endpoints.** You must configure these URLs in your Slack app settings:

### URLs to Configure in Slack

| Setting Location | URL to Enter |
|-----------------|--------------|
| **Slash Commands** → `/blocker` → Request URL | `https://your-domain/api/slack/commands/blocker` |
| **Interactivity & Shortcuts** → Request URL | `https://your-domain/api/slack/interactions` |

### Example with ngrok

If your ngrok URL is `https://abc123.ngrok-free.app`:

```
Slash Command URL:    https://abc123.ngrok-free.app/api/slack/commands/blocker
Interactivity URL:    https://abc123.ngrok-free.app/api/slack/interactions
```

### Data Flow

```
┌───────────────────────────────────────────────────────────────────────────┐
│  1. YOU configure URLs in Slack App Settings                              │
│     • Slash Commands → Request URL                                        │
│     • Interactivity & Shortcuts → Request URL                             │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  2. User types /blocker → Slack sends POST to YOUR Slash Command URL      │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  3. Your backend opens modal via Slack API                                │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  4. User submits modal → Slack sends POST to YOUR Interactivity URL       │
└───────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌───────────────────────────────────────────────────────────────────────────┐
│  5. Your backend creates blocker in Contentstack                          │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Troubleshooting

### Modal doesn't open

1. Check that `SLACK_BOT_TOKEN` is correct
2. Verify the Request URL is accessible from the internet
3. Check backend logs: `pm2 logs momentum-backend`

### "dispatch_failed" error

1. Slack couldn't reach your server
2. If using ngrok, ensure it's running
3. Check firewall settings

### Blocker not created

1. Check if team member lookup is working
2. Verify Contentstack credentials are correct
3. Check backend logs for errors

### Signature verification fails

1. Ensure `SLACK_SIGNING_SECRET` is correct
2. Check that the request isn't being modified by a proxy

---

## Production Deployment

For production, replace ngrok URLs with your actual domain:

```
https://api.yourcompany.com/api/slack/commands/blocker
https://api.yourcompany.com/api/slack/interactions
```

Remember to:
1. Update URLs in Slack App settings
2. Update environment variables
3. Ensure HTTPS is configured
4. Test the integration

---

## Security Notes

- **Signing Secret:** Always verify Slack signatures in production
- **Bot Token:** Keep this secret, never commit to git
- **HTTPS:** Use HTTPS in production for all webhook URLs

