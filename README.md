# Outreach Machine

Template-based, rule-driven multi-channel outreach for OptimAI and Nudge Digital. No AI/LLM API required to run.

---

## What this does

Runs human-reviewed (or fully automated) outreach sequences across email and LinkedIn for two brands simultaneously. Every message comes from editable templates you control — no API key, no per-message cost, no waiting on a model. Replies are classified by keyword/pattern rules and routed automatically. Leads are sourced either by direct search (Sales Navigator URL) or by signal monitoring — finding people who've already engaged with relevant LinkedIn content, the same "buying signal" approach used by tools like Gojiberry. Long-term nurture runs on autopilot.

**Tech stack:** Node.js · Google Sheets (CRM) · Gmail API · Playwright (LinkedIn) · GitHub Actions (scheduling) · Railway (dashboard)

**No AI dependency:** message copy is templated (`config/templates.json`, editable from the dashboard), reply classification is rule-based (`modules/replies/classifier.js`), and lead scoring is rule-based (`modules/prospecting/scoring.js` + `modules/prospecting/signals.js`).

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
| `LINKEDIN_SESSION_COOKIE` | Run `node scripts/refresh-linkedin-cookie.js` |

No `ANTHROPIC_API_KEY` or any other AI provider key is needed.

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
# → http://localhost:8080
```

---

## Architecture

```
GitHub Actions (scheduling)
    ↓ triggers
modules/
  prospecting/    ← LinkedIn search scraper + signal monitoring + enrichment + ICP scoring
    index.js        — search scraper, post-engagement scraper, pipeline orchestration
    signals.js       — rule-based buying-signal detection (hiring, funding, engagement)
    scoring.js        — rule-based ICP scoring (0–100)
    enrichment.js      — website scraper + Hunter.io/Apollo email discovery
  outreach/       ← Email (Gmail) + LinkedIn (Playwright) sequence runner — template-driven
  replies/        ← Gmail + LinkedIn inbox monitor + rule-based intent classifier
    index.js        — polling, routing, action handling
    classifier.js     — keyword/pattern intent classification (no AI call)
  templating/     ← Variable-substitution template engine — reads config/templates.json
  nurture/        ← Long-term nurture track manager — template-driven
  crm/            ← Google Sheets read/write abstraction
  health-check/   ← Daily digest + system status monitor

server.js         ← Express dashboard (Railway)
```

---

## How lead sourcing works (Gojiberry-style, rule-based)

Two ways to find prospects, both rule-scored — no AI involved:

### Search-based sourcing
Paste a LinkedIn Sales Navigator or People Search URL with your filters already applied. The system scrapes the results, deduplicates against your existing CRM, enriches each lead (website scrape, email discovery), scores against your ICP, and queues anything that clears the threshold.

### Signal-based sourcing
This is the part modeled on Gojiberry's approach: instead of cold search, find people already engaging with relevant content. Paste a LinkedIn post URL — your own, a competitor's, or an industry post — and the system pulls the list of people who liked or commented on it. Comment authors get scored higher than like-only reactions, since commenting takes more effort and signals stronger intent. Every signal-sourced lead also gets an automatic scoring bonus in `modules/prospecting/signals.js`, because "already paying attention to your market" is one of the strongest buying signals there is.

Both flows are available from the dashboard **Find Leads** tab.

### What counts as a signal (rule-based, see `modules/prospecting/signals.js`)

- Hiring/growth language on a company's website (`"we're hiring"`, `"join our team"`, etc.)
- Automation-readiness language for OptimAI (`"manual process"`, `"spreadsheet"`, `"bottleneck"`)
- Marketing-readiness language for Nudge (`"website redesign"`, `"new product launch"`, `"seo"`)
- Funding/growth-stage mentions (`"series a"`, `"raised funding"`)
- Direct LinkedIn post engagement (the strongest signal — see above)

None of this requires a model call. It's keyword matching against scraped text, same category of technique Gojiberry and similar tools use under the hood for their "signal detection," just without the black box.

---

## Modules

### Prospecting (`modules/prospecting/`)

**Discover:** LinkedIn people search scraper, LinkedIn post-engagement scraper (likes + comments), Google Maps local business scraper.

**Enrich:** Website scraper (meta, tech stack, job listings) + Hunter.io / Apollo email discovery.

**Score:** Rule-based ICP scoring (0–100) with a rule-based signal bonus. Only prospects above the brand's threshold (default 60) are added to the queue.

**Run a prospecting job:**
```bash
# Via the dashboard:
# Find Leads tab → paste a search URL or post URL → Run

# Via GitHub Actions:
# Actions → Prospect Discovery → Run workflow

# Or locally:
node -e "
const { scrapeLinkedInSearch, runProspectingPipeline } = require('./modules/prospecting');
scrapeLinkedInSearch('https://www.linkedin.com/search/results/people/?keywords=ceo+melbourne+saas', 50)
  .then(leads => runProspectingPipeline(leads, 'optimai', 'linkedin'))
  .then(console.log);
"
```

### Templating (`modules/templating/`)

Reads `config/templates.json` and substitutes `{{variable}}` placeholders (`first_name`, `company`, `industry`, `calendly_url`, etc.) at send time. Templates are edited from the dashboard **Templates** tab and changes apply immediately — no restart needed, no deployment required.

### Outreach (`modules/outreach/`)

Processes the outreach queue — executes the next due sequence step for each prospect using the templating module.

**Email:** Sends via Gmail API (from your real address). Falls back to Resend.

**LinkedIn:** Profile view → post like → connection request (with note) → DM sequence. Hard daily limits: 20 connections, 40 profile views, 100 total actions.

**Manual approval mode (default ON):** Messages are saved as drafts in the Sheets and shown in the Dashboard Drafts tab. You review and approve each one before it's sent.

**Auto-send mode:** Set `MANUAL_APPROVAL_MODE=false` in Settings to send automatically.

```bash
# Run manually:
node -e "const { runOutreachQueue } = require('./modules/outreach'); runOutreachQueue().then(console.log)"
```

### Replies (`modules/replies/`)

Polls Gmail every 30 minutes and scrapes LinkedIn inbox on schedule. Matches senders to known prospects and classifies intent using keyword/pattern rules in `classifier.js` — no AI call.

**Intent actions:**
- `positive_interest` → alerts founder, pauses sequence, sends the editable `positive_booking` reply template if auto-respond is on
- `not_now_nurture` → moves to nurture track A
- `negative_hard_no` → marks Do Not Contact
- `referral_signal` → alerts founder with a best-effort extracted referred-person name
- `question_objection` → alerts founder with the editable `question_generic` reply template as a starting point
- `out_of_office` → pauses sequence, attempts to extract a return date
- STOP/unsubscribe → immediately unsubscribes (Australian Spam Act compliance)

The classifier matches against phrase banks (positive interest, hard no, not-now, referral, question, OOO) — see `modules/replies/classifier.js` to tune them. Anything it can't confidently classify is routed to `question_objection` for manual review rather than guessed at.

### Nurture (`modules/nurture/`)

Weekly engine that manages long-term prospect relationships using the same templating system.

- **Track A (Not Now):** Bi-monthly insight email + monthly LinkedIn like + quarterly re-engagement
- **Track B (Warm):** Monthly value email + weekly LinkedIn like
- **Track C (Re-activation):** Single "break-up" email, then LinkedIn-only

### Dashboard (`server.js` + `dashboard/`)

Deployed on Railway. Sections:
- **Overview:** Funnel, today's stats, quick action buttons
- **Prospects:** Filterable CRM table with per-prospect timeline
- **Find Leads:** Signal-based and search-based LinkedIn sourcing
- **Inbox:** Unified Gmail + LinkedIn reply inbox with intent badges
- **Drafts:** Templated messages awaiting your approval
- **Sequences:** Visual view of all sequence steps and timing
- **Templates:** Full editor for every piece of outreach copy — email sequences, LinkedIn notes/DMs, nurture emails, reply templates
- **Reporting:** Reply rates, top subject lines, funnel breakdown
- **Settings:** Toggles, daily limits, brand config

---

## Editing your outreach copy

All copy lives in `config/templates.json`, organised by brand (`optimai` / `nudge`) and type (email sequences, LinkedIn connect note, LinkedIn DMs, nurture emails, reply templates). Edit it directly, or — easier — use the dashboard **Templates** tab, which reads and writes the same file with a live preview using sample data.

Available placeholders in any template: `{{first_name}}`, `{{last_name}}`, `{{company}}`, `{{title}}`, `{{industry}}`, `{{location}}`, `{{website}}`, `{{sender_name}}`, `{{sender_company}}`, `{{sender_website}}`, `{{calendly_url}}`.

Some templates include `[CAPS PLACEHOLDER]` spots — these are intentionally left for manual per-prospect customisation (e.g. a specific website audit finding for Nudge Digital) rather than templated, since that detail is genuinely prospect-specific.

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
4. Railway auto-deploys from `railway.toml` — build step installs Playwright's Chromium, start command runs `node server.js`, healthcheck hits `/health`
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

Edit `config/sequences.json` to change step order, timing, or channel. The actual message copy for each step lives in `config/templates.json` (or the dashboard Templates tab) — `sequences.json` only controls structure (`channel`, `day_offset`, `goal`), not wording.

Each step has:
- `channel`: `email` | `linkedin_view` | `linkedin_like` | `linkedin_connect` | `linkedin_message`
- `day_offset`: Days after prospect was added before this step is due
- `goal`: `warm_up` | `establish_credibility` | `ask_for_meeting` | `break_up`
- `step_number`: Matches the corresponding entry in `templates.json`

---

## Australian Spam Act compliance

The system is built with compliance in mind:

1. **Sender identification:** Every email template includes sender name, business name, and website
2. **Opt-out mechanism:** Every email ends with "reply STOP to opt out"
3. **Immediate unsubscribe:** STOP replies trigger immediate CRM status update to `unsubscribed` and halt all future messages
4. **Legitimate business reason:** Only B2B contacts are targeted
5. **No purchased lists:** Prospects are sourced via LinkedIn search and engagement monitoring (public profiles) only

If in doubt, consult `modules/replies/index.js` → `isUnsubscribeRequest()` and `modules/replies/classifier.js` for the unsubscribe detection logic.

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

**Reply classification seems off:**
The classifier in `modules/replies/classifier.js` is keyword-based. If it's misreading a common reply pattern your prospects use, add the phrase to the relevant array in `PATTERNS` at the top of the file — no need to touch anything else.

---

## File map

```
bizdev-platform/
├── server.js                       ← Express dashboard server
├── setup.js                        ← One-time setup script
├── config/
│   ├── icp.json                    ← ICP targeting config for both brands
│   ├── sequences.json               ← Multi-step sequence structure (timing/channel)
│   └── templates.json               ← All editable outreach copy
├── modules/
│   ├── crm/index.js                ← Google Sheets CRM abstraction
│   ├── templating/index.js         ← Template rendering engine
│   ├── prospecting/
│   │   ├── index.js                ← LinkedIn + Maps scraper + pipeline + signal scrapers
│   │   ├── signals.js               ← Rule-based buying-signal detection
│   │   ├── enrichment.js            ← Website scraper + email discovery
│   │   └── scoring.js               ← ICP scoring engine
│   ├── outreach/
│   │   ├── index.js                ← Main outreach runner (template-driven)
│   │   ├── email.js                 ← Gmail + Resend email module
│   │   └── linkedin.js              ← Playwright LinkedIn automation
│   ├── replies/
│   │   ├── index.js                ← Reply monitor + routing
│   │   └── classifier.js            ← Rule-based intent classifier
│   ├── nurture/index.js            ← Nurture track engine (template-driven)
│   └── health-check.js             ← Daily health check + digest
├── dashboard/
│   └── public/
│       ├── index.html              ← Dashboard SPA
│       └── login.html              ← Login page
├── scripts/
│   ├── get-oauth-token.js          ← One-time Google OAuth setup
│   └── refresh-linkedin-cookie.js   ← LinkedIn session refresh
├── .github/workflows/
│   ├── daily-outreach.yml
│   ├── reply-monitor.yml
│   ├── nurture-engine.yml
│   ├── health-check.yml
│   └── prospect-discovery.yml
├── .env.example                    ← Environment variable template
├── railway.toml                    ← Railway deployment config
└── package.json
```
