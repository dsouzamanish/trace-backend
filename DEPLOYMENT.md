# Backend Deployment Guide - Railway

This guide covers deploying the Momentum backend to [Railway](https://railway.app/).

## Prerequisites

- GitHub account with the `trace` repository
- Railway account (sign up at [railway.app](https://railway.app/))
- All environment variables ready (see below)

---

## Quick Deploy (Recommended)

### Step 1: Connect Repository

1. Go to [railway.app](https://railway.app/) and sign in with GitHub
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `trace` repository
5. Railway will ask which directory to deploy - select **`backend`**

### Step 2: Configure Root Directory

In the service settings:
1. Click on the deployed service
2. Go to **Settings** tab
3. Under **Build & Deploy**, set:
   - **Root Directory:** `backend`
   - **Build Command:** `npm ci && npm run build`
   - **Start Command:** `npm run start:prod`

### Step 3: Add Environment Variables

Go to **Variables** tab and add:

```env
# Server
NODE_ENV=production
PORT=3001

# Contentstack
CONTENTSTACK_API_KEY=your_api_key
CONTENTSTACK_DELIVERY_TOKEN=your_delivery_token
CONTENTSTACK_MANAGEMENT_TOKEN=your_management_token
CONTENTSTACK_ENVIRONMENT=production
CONTENTSTACK_REGION=NA

# JWT
JWT_SECRET=your_super_secure_random_string_min_32_chars
JWT_EXPIRATION=7d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=https://YOUR_RAILWAY_URL/api/auth/google/callback

# OpenAI (optional, for AI reports)
OPENAI_API_KEY=your_openai_api_key

# Frontend URL (update after frontend deployment)
FRONTEND_URL=https://your-frontend-url.com

# Slack (if using Slack integration)
SLACK_BOT_TOKEN=xoxb-your-bot-token
SLACK_SIGNING_SECRET=your-signing-secret
```

### Step 4: Deploy

Railway will automatically deploy when you push to your main branch.

For manual deploy:
1. Push changes to GitHub
2. Railway auto-deploys, or click **"Deploy"** button

### Step 5: Get Your URL

After deployment:
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"** to get a `*.railway.app` URL
3. Or add a custom domain

---

## Post-Deployment Setup

### 1. Update Google OAuth

Update your Google Cloud Console OAuth redirect URI:
```
https://YOUR_APP.railway.app/api/auth/google/callback
```

### 2. Update Slack URLs

If using Slack integration, update:
- Slash Command URL: `https://YOUR_APP.railway.app/api/slack/commands/blocker`
- Interactivity URL: `https://YOUR_APP.railway.app/api/slack/interactions`

### 3. Run Migrations

After first deploy, run migrations to create Contentstack content types:
```bash
curl -X POST https://YOUR_APP.railway.app/api/migration/run
```

### 4. Verify Health Check

```bash
curl https://YOUR_APP.railway.app/api/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-12-16T10:00:00.000Z",
  "service": "momentum-backend",
  "version": "1.0.0"
}
```

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Yes | Server port (Railway sets this automatically) |
| `CONTENTSTACK_API_KEY` | Yes | Your Contentstack stack API key |
| `CONTENTSTACK_DELIVERY_TOKEN` | Yes | Delivery token for reading data |
| `CONTENTSTACK_MANAGEMENT_TOKEN` | Yes | Management token for writing data |
| `CONTENTSTACK_ENVIRONMENT` | Yes | Contentstack environment name |
| `CONTENTSTACK_REGION` | Yes | Region: `NA`, `EU`, `AZURE_NA`, `AZURE_EU` |
| `JWT_SECRET` | Yes | Secret for JWT signing (min 32 chars) |
| `JWT_EXPIRATION` | No | Token expiration (default: `7d`) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `GOOGLE_CALLBACK_URL` | Yes | OAuth callback URL |
| `FRONTEND_URL` | Yes | Frontend URL for redirects |
| `OPENAI_API_KEY` | No | For AI report generation |
| `SLACK_BOT_TOKEN` | No | For Slack integration |
| `SLACK_SIGNING_SECRET` | No | For Slack integration |

---

## Railway CLI (Optional)

Install Railway CLI for local development with production environment:

```bash
# Install
npm install -g @railway/cli

# Login
railway login

# Link project
railway link

# Run locally with production env
railway run npm run start:dev

# Deploy
railway up
```

---

## Monitoring

### View Logs

1. Go to your Railway project
2. Click on the service
3. Go to **Deployments** tab
4. Click on a deployment to view logs

### Health Monitoring

Railway automatically monitors the `/api/health` endpoint and restarts the service if it fails.

---

## Troubleshooting

### Build Fails

1. Check build logs in Railway dashboard
2. Ensure `package.json` has correct build script
3. Try building locally: `npm run build`

### App Crashes on Start

1. Check runtime logs
2. Verify all required environment variables are set
3. Check PORT is being used correctly (Railway provides `PORT` env var)

### Database/API Connection Issues

1. Verify Contentstack credentials
2. Check if tokens have correct permissions
3. Ensure region matches your Contentstack stack

### OAuth Redirect Issues

1. Verify `GOOGLE_CALLBACK_URL` matches Railway URL
2. Update Google Cloud Console with correct redirect URI
3. Check `FRONTEND_URL` for post-login redirect

---

## Cost

Railway free tier includes:
- $5 free credit per month
- Enough for ~500 hours of a small service
- No credit card required to start

For production, consider upgrading to the $5/month Hobby plan for:
- No sleep on idle
- More resources
- Better uptime

---

## Files Created for Deployment

| File | Purpose |
|------|---------|
| `Procfile` | Defines start command for Railway |
| `railway.json` | Railway-specific configuration |
| `Dockerfile` | Container build instructions |
| `.dockerignore` | Files to exclude from Docker build |
| `src/app.controller.ts` | Health check endpoint |

---

## Next Steps

After backend deployment:

1. [ ] Update frontend API URL to Railway backend
2. [ ] Deploy frontend (Vercel, Netlify, or Contentstack Launch)
3. [ ] Update Google OAuth and Slack URLs
4. [ ] Run migrations
5. [ ] Test all endpoints

