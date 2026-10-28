# Infinity Outreach

Daily outreach checklists, pipeline tracking and gamified goals for **OptimAI** and **Nudge Digital**, in one app. Switch playbooks with the logo buttons in the sidebar; the pipeline, partners, XP, streaks and badges are shared.

## What it does

- **Dashboard**: greeting, an "Ask" box (try "What do I need to do today?"), weekly tiles, today's plan, targets, 14-day outreach chart, pipeline funnel, this week's content and upcoming follow-ups.
- **Search everything**: press `/` or Ctrl/Cmd+K to search both full playbooks, scripts, content ideas, prospects, partners and tasks. Questions are answered from your own data (no AI model is called).
- **Playbooks**: the complete Nudge Digital 90-day plan (22 sections) and OptimAI playbook (21 sections), searchable, with tables, [Verified]/[Assumption]/[Hypothesis] tags and one-click copy or "Save as my script" on every message template.
- **Scripts**: all playbook scripts, editable, with Personalise (fill the [placeholders]) and restore-original. Add your own.
- **Content**: 35 OptimAI and 29 Nudge posts, articles and newsletter ideas with drafts where the playbooks include them, status tracking (Idea, Drafting, Scheduled, Published), your own ideas, the content calendar, pillars and templates.

- **Today**: the 60-minute core and 120-minute extras for the active playbook, today's focus from the weekly rhythm, follow-ups due, scorecard counters, and "next working day's three actions".
- **Carry-over**: unfinished tasks roll into the next day automatically (shown as "Carried over from ..."). Tomorrow's three actions become tasks on the day. Missed core items from the last working day can be carried over with one click. Tasks can be snoozed to the next working day.
- **Pipeline**: prospects with source, signal, score (75+ approach, 55 to 74 nurture, under 55 drop), channel, Spam Act basis, stage history, notes and automatic follow-up dates (OptimAI day 4/10/21, max 4 touches; Nudge day 4/10, max 3).
- **Partners**: referrals sent and received, last contact, next action.
- **Progress**: levels, streak, 4-week heat map, weekly targets, custom goals, 26 badges, activity table, funnel.
- **Light, dark or auto theme**: switch at the bottom of the sidebar (remembered per device).
- **Review**: Friday review per playbook with a week picker, plus backup and restore.
- **Playbooks > Operating system**: weekly rhythm, rules, recurring tasks (weekly, fortnightly, monthly, quarterly) and the launch checklist.

It tracks and prompts only. It never sends messages.

## XP, in brief

Core task +10, extra task +15, full core +25 bonus, full 120-minute day +25 more, each counted action (request, email, reply, call and so on) a few XP, calls booked +20, stage progress up to +225 for a win, tasks +5, recurring and launch items +10, reviews +20. XP is calculated from your data, so un-ticking something removes its XP.

Streak = consecutive weekdays with a completed core 60 in either playbook. Weekends never break it.

## Run locally

```bash
npm install
npm start          # http://localhost:3000
```

Data is stored in `data/state.json` (and mirrored in the browser's localStorage, so it keeps working offline and syncs when back online).

## Deploy on Railway

1. Push this folder to a GitHub repo.
2. Railway: **New Project > Deploy from GitHub repo**. `railway.json` sets the start command and health check (`/healthz`).
3. **Add a Volume** to the service, mount path `/data`.
4. Service **Variables**:
   - `DATA_DIR=/data` (so your data survives redeploys)
   - `APP_PASSWORD=<choose a password>` (strongly recommended; the browser will prompt for it, any username works)
5. Settings > Networking > **Generate Domain**.

Without the volume, data resets on every deploy. Without `APP_PASSWORD`, anyone with the URL can read and edit your pipeline.

## Notes

- Dates use the device's local timezone (Melbourne for you).
- Single-user app. If two devices edit at the same time, the most recent save wins.
- `Review > Download backup` exports everything as JSON.
