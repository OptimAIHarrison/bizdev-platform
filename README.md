# BizDev Outreach Platform

AI-powered multi-channel outreach for OptimAI and Nudge Digital.

---

## What this does

Runs fully automated (or human-in-the-loop) outreach sequences across email and LinkedIn for two brands simultaneously. Every message is written by Claude with full prospect context. Replies are classified and routed automatically. Long-term nurture runs on autopilot.

**Tech stack:** Node.js · Google Sheets (CRM) · Gmail API · Playwright (LinkedIn) · Claude API · GitHub Actions (scheduling) · Railway (dashboard)

---

## Quick start

### 1. Clone and install

```bash
git clone <your-repo>
cd bizdev-platform
npm install
npx playwright install chromium --with-deps
cp .env.example .env
```

### 2. Configure credentials

Fill in `.env`. The required ones are:

| Variable | How to get it |
|---|---|
| `GOOGLE_OAUTH_CLIENT_ID` | Google Cloud Console → APIs → OAuth credentials |
| `GOOGLE_OAUTH_CLIENT_SECRET` | Same as above |
| `GOOGLE_OAUTH_REFRESH_TOKEN` | Run `node scripts/get-oauth-token.js` |
| `GOOGLE_SHEETS_ID` | The long ID in your Google Sheet's URL |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `LINKEDIN_SESSION_COOKIE` | Run `node scripts/refresh-linkedin-cookie.js` |

### 3. Set up Google Cloud project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project
3. Enable: **Gmail API** and **Google Sheets API**
4. Create credentials: **OAuth 2.0 Client ID** → Desktop app
5. Run `node scripts/get-oauth-token.js` to get your refresh token

### 4. Run setup

```bash
node setup.js
```

This creates all 6 sheets in your Google Sheet with correct headers, seeds default settings, and validates your credentials.

### 5. Start the dashboard

```bash
node server.js
# → http://localhost:3000
```

---

## Architecture

```
GitHub Actions (scheduling)
    ↓ triggers
modules/
  prospecting/    ← LinkedIn scraper + enrichment + ICP scoring
  outreach/       ← Email (Gmail) + LinkedIn (Playwright) sequence runner
  replies/        ← Gmail + LinkedIn inbox monitor + intent classifier
  nurture/        ← Long-term nurture track manager
  ai/             ← Claude API wrapper (all generation + classification)
  crm/            ← Google Sheets read/write abstraction
  health-check/   ← Daily digest + system status monitor

server.js         ← Express dashboard (Railway)
```

---

## Modules

### Prospecting (`modules/prospecting/`)

**Discover:** LinkedIn people search scraper + Google Maps local business scraper.

**Enrich:** Website scraper (meta, tech stack, job listings) + Hunter.io / Apollo email discovery.

**Score:** Rule-based ICP scoring (0–100) with AI intent signal bonus. Only prospects 60+ are added to the queue.

**Run a prospecting job:**
```bash
# Via GitHub Actions:
# Actions → Prospect Discovery → Run workflow
# Fill in: brand, source, LinkedIn search URL

# Or locally:
node -e "
const { scrapeLinkedInSearch, runProspectingPipeline } = require('./modules/prospecting');
scrapeLinkedInSearch('https://www.linkedin.com/search/results/people/?keywords=ceo+melbourne+saas', 50)
  .then(leads => runProspectingPipeline(leads, 'optimai', 'linkedin'))
  .then(console.log);
"
```

### Outreach (`modules/outreach/`)

Processes the outreach queue — executes the next due sequence step for each prospect.

**Email:** Sends via Gmail API (from Harrison's real address). Falls back to Resend.

**LinkedIn:** Profile view → post like → connection request (with note) → DM sequence. Hard daily limits: 20 connections, 40 profile views, 100 total actions.

**Manual approval mode (default ON):** Messages are saved as drafts in the Sheets and shown in the Dashboard Drafts tab. You review and approve each one before it's sent.

**Auto-send mode:** Set `MANUAL_APPROVAL_MODE=false` in Settings to send automatically.

```bash
# Run manually:
node -e "const { runOutreachQueue } = require('./modules/outreach'); runOutreachQueue().then(console.log)"
```

### Replies (`modules/replies/`)

Polls Gmail every 30 minutes and scrapes LinkedIn inbox on schedule. Matches senders to known prospects and runs Claude intent classification.

**Intent actions:**
- `positive_interest` → alerts founder, pauses sequence, optional Calendly auto-reply
- `not_now_nurture` → moves to nurture track A
- `negative_hard_no` → marks Do Not Contact
- `referral_signal` → alerts founder with referred person details
- `question_objection` → alerts founder with suggested reply draft
- `out_of_office` → pauses sequence, resumes after OOO end date
- STOP/unsubscribe → immediately unsubscribes (Australian Spam Act compliance)

### Nurture (`modules/nurture/`)

Weekly engine that manages long-term prospect relationships.

- **Track A (Not Now):** Bi-monthly insight email + monthly LinkedIn like + quarterly re-engagement
- **Track B (Warm):** Monthly value email + weekly LinkedIn like + bi-monthly soft CTA
- **Track C (Re-activation):** Single "break-up" email, then LinkedIn-only

### Dashboard (`server.js` + `dashboard/`)

Deployed on Railway. Sections:
- **Overview:** Funnel, today's stats, quick action buttons
- **Prospects:** Filterable CRM table with per-prospect timeline
- **Inbox:** Unified Gmail + LinkedIn reply inbox with intent badges
- **Drafts:** AI-generated messages awaiting your approval
- **Sequences:** Visual view of all sequence steps
- **Reporting:** Reply rates, top subject lines, funnel breakdown
- **Settings:** Toggles, daily limits, brand config

---

## Scheduling (GitHub Actions)

| Workflow | Schedule | Purpose |
|---|---|---|
| `daily-outreach.yml` | Mon–Fri 9:00 AM AEST | Run outreach queue for both brands |
| `reply-monitor.yml` | Every 30 min, 7am–8pm AEST weekdays | Check Gmail + LinkedIn for replies |
| `nurture-engine.yml` | Monday 9:15 AM AEST | Run weekly nurture cycle |
| `health-check.yml` | Daily 7:00 AM AEST | System health + daily digest email |
| `prospect-discovery.yml` | Manual trigger | Scrape LinkedIn/Maps + add prospects |

### Adding GitHub Secrets

Go to: `Settings → Secrets and variables → Actions → New repository secret`

Add all variables from `.env.example`.

---

## Railway deployment

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub repo
3. Add all env vars (same as `.env` but set in Railway dashboard)
4. Railway will auto-deploy from `railway.toml`
5. The dashboard runs 24/7 — GitHub Actions call the outreach/reply modules on schedule

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway link
railway up
```

---

## ICP Configuration

Edit `config/icp.json` to change targeting. Key fields:

```json
{
  "optimai": {
    "icp": {
      "companySizeMin": 5,
      "companySizeMax": 200,
      "industries": ["saas", "logistics", ...],
      "targetRoles": ["founder", "ceo", ...],
      "geographyPrimary": ["australia"],
      "intentSignals": ["hiring operations", "recently funded", ...],
      "minIcpScore": 60
    }
  }
}
```

---

## Sequences

Edit `config/sequences.json` to change step order, timing, or copy guidance.

Each step has:
- `channel`: `email` | `linkedin_view` | `linkedin_like` | `linkedin_connect` | `linkedin_message`
- `day_offset`: Days after prospect was added before this step is due
- `goal`: `warm_up` | `establish_credibility` | `ask_for_meeting` | `break_up`
- `notes`: Guidance injected into Claude's prompt for this step
- `message_template`: Set to `AI_GENERATED` for Claude to write it, or provide a template

---

## Australian Spam Act compliance

The system is built with compliance in mind:

1. **Sender identification:** Every email includes sender name, business name, and website
2. **Opt-out mechanism:** Every email ends with "reply STOP to opt out"
3. **Immediate unsubscribe:** STOP replies trigger immediate CRM status update to `unsubscribed` and halt all future messages
4. **Legitimate business reason:** Only B2B contacts are targeted
5. **No purchased lists:** Prospects are sourced via LinkedIn search (public profiles) only

If in doubt, consult `modules/replies/index.js` → `isUnsubscribeRequest()` for the unsubscribe detection logic.

---

## LinkedIn ToS notice

LinkedIn automation via Playwright violates LinkedIn's Terms of Service. This risk is accepted by the account holder. The system includes conservative rate limits (20 connections/day, ±15–45 minute jitter, working hours only) to reduce detection risk, but cannot eliminate it. Account suspension is possible.

---

## Troubleshooting

**LinkedIn session expired:**
```bash
node scripts/refresh-linkedin-cookie.js
# Update LINKEDIN_SESSION_COOKIE in Railway and GitHub Secrets
```

**Google OAuth expired:**
```bash
node scripts/get-oauth-token.js
# Update GOOGLE_OAUTH_REFRESH_TOKEN
```

**Check health manually:**
```bash
node -e "const { runHealthCheck } = require('./modules/health-check'); runHealthCheck().then(console.log)"
```

**View recent errors:**
Check the `Activity_Log` sheet → filter `outcome` column by `failed`.

---

## File map

```
bizdev-platform/
├── server.js                    ← Express dashboard server
├── setup.js                     ← One-time setup script
├── config/
│   ├── icp.json                 ← ICP targeting config for both brands
│   └── sequences.json           ← Multi-step sequence definitions
├── modules/
│   ├── crm/index.js             ← Google Sheets CRM abstraction
│   ├── ai/index.js              ← Claude API wrapper
│   ├── prospecting/
│   │   ├── index.js             ← LinkedIn + Maps scraper + pipeline
│   │   ├── enrichment.js        ← Website scraper + email discovery
│   │   └── scoring.js           ← ICP scoring engine
│   ├── outreach/
│   │   ├── index.js             ← Main outreach runner
│   │   ├── email.js             ← Gmail + Resend email module
│   │   └── linkedin.js          ← Playwright LinkedIn automation
│   ├── replies/index.js         ← Reply monitor + intent classifier
│   ├── nurture/index.js         ← Nurture track engine
│   └── health-check.js          ← Daily health check + digest
├── dashboard/
│   └── public/
│       ├── index.html           ← Dashboard SPA
│       └── login.html           ← Login page
├── scripts/
│   ├── get-oauth-token.js       ← One-time Google OAuth setup
│   └── refresh-linkedin-cookie.js ← LinkedIn session refresh
├── .github/workflows/
│   ├── daily-outreach.yml
│   ├── reply-monitor.yml
│   ├── nurture-engine.yml
│   ├── health-check.yml
│   └── prospect-discovery.yml
├── .env.example                 ← Environment variable template
├── railway.toml                 ← Railway deployment config
└── package.json
```
