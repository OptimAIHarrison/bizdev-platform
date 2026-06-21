/**
 * @file setup.js
 * @description One-time setup script.
 * Run with: node setup.js
 *
 * What it does:
 *   1. Creates all required Google Sheets tabs with correct column headers
 *   2. Seeds default Settings values
 *   3. Populates Sequences sheet from sequences.json
 *   4. Validates environment variables
 *   5. Tests Google OAuth and Sheets access
 *   6. Outputs a checklist of what's configured and what still needs attention
 */

'use strict';

require('dotenv').config();
const crm = require('./modules/crm');
const sequences = require('./config/sequences.json');

// ── Colour output ─────────────────────────────────────────────────────────────
const c = {
  green: s => `\x1b[32m${s}\x1b[0m`,
  red: s => `\x1b[31m${s}\x1b[0m`,
  yellow: s => `\x1b[33m${s}\x1b[0m`,
  bold: s => `\x1b[1m${s}\x1b[0m`,
  dim: s => `\x1b[2m${s}\x1b[0m`
};

function ok(msg) { console.log(c.green('  ✓ ') + msg); }
function fail(msg) { console.log(c.red('  ✗ ') + msg); }
function warn(msg) { console.log(c.yellow('  ⚠ ') + msg); }
function section(msg) { console.log('\n' + c.bold(msg)); }

// ── Env check ─────────────────────────────────────────────────────────────────
function checkEnv() {
  section('Environment Variables');
  const required = [
    'GOOGLE_OAUTH_CLIENT_ID',
    'GOOGLE_OAUTH_CLIENT_SECRET',
    'GOOGLE_OAUTH_REFRESH_TOKEN',
    'GOOGLE_SHEETS_ID',
    'ANTHROPIC_API_KEY'
  ];
  const optional = [
    'LINKEDIN_SESSION_COOKIE',
    'OPTIMAI_EMAIL',
    'NUDGE_EMAIL',
    'FOUNDER_EMAIL',
    'HUNTER_API_KEY',
    'APOLLO_API_KEY',
    'CALENDLY_URL',
    'DASHBOARD_SECRET'
  ];

  let allRequired = true;
  for (const key of required) {
    if (process.env[key]) ok(key);
    else { fail(`${key} — REQUIRED, not set`); allRequired = false; }
  }
  for (const key of optional) {
    if (process.env[key]) ok(`${key} ${c.dim('(optional)')}` );
    else warn(`${key} — optional, not set`);
  }
  return allRequired;
}

// ── Sheets setup ──────────────────────────────────────────────────────────────
async function setupSheets() {
  section('Google Sheets');
  try {
    const result = await crm.initializeSheets();
    for (const name of result.created) ok(`Created sheet: ${name}`);
    for (const name of result.skipped) console.log(c.dim(`  — Sheet exists: ${name}`));
    return true;
  } catch (err) {
    fail(`Sheets setup failed: ${err.message}`);
    console.log(c.dim('    Make sure GOOGLE_SHEETS_ID and OAuth credentials are correct.'));
    return false;
  }
}

// ── Seed settings ─────────────────────────────────────────────────────────────
async function seedSettings() {
  section('Seeding Default Settings');
  const defaults = [
    ['MANUAL_APPROVAL_MODE', 'true', 'Require manual approval before sending messages'],
    ['AUTO_SEND_EMAIL', 'false', 'Auto-send emails without approval'],
    ['AUTO_SEND_LINKEDIN', 'false', 'Auto-send LinkedIn messages without approval'],
    ['AUTO_RESPOND_POSITIVE', 'false', 'Auto-send Calendly link on positive reply'],
    ['OPTIMAI_DAILY_LIMIT', '30', 'Max emails per day for OptimAI'],
    ['NUDGE_DAILY_LIMIT', '30', 'Max emails per day for Nudge Digital'],
    ['LINKEDIN_DAILY_CONNECTIONS', '20', 'Max LinkedIn connection requests per day'],
    ['CALENDLY_URL', process.env.CALENDLY_URL || '', 'Calendly booking link'],
    ['CASE_STUDIES', '', 'Recent wins and case studies for nurture emails'],
    ['ACTIVE_BRANDS', 'optimai,nudge', 'Comma-separated list of active brands']
  ];

  for (const [key, value, description] of defaults) {
    try {
      await crm.setSetting(key, value);
      ok(`${key} = ${value} ${c.dim(`(${description})`)}`);
    } catch (err) {
      fail(`Failed to set ${key}: ${err.message}`);
    }
  }
}

// ── Seed sequences ────────────────────────────────────────────────────────────
async function seedSequences() {
  section('Seeding Sequence Definitions');
  const allSteps = [...(sequences.optimai || []), ...(sequences.nudge || [])];
  try {
    // Clear and re-seed the Sequences sheet
    for (const step of allSteps) {
      const row = [
        step.sequence_id,
        step.brand,
        step.step_number,
        step.channel,
        step.day_offset,
        Array.isArray(step.subject_template) ? step.subject_template.join(' || ') : (step.subject_template || ''),
        step.message_template || '',
        step.ab_variant || '',
        step.active ? 'true' : 'false'
      ];
      await crm.appendRows('Sequences', [row]);
    }
    ok(`Seeded ${allSteps.length} sequence steps`);
  } catch (err) {
    fail(`Sequences seed failed: ${err.message}`);
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
function printSummary() {
  section('Next Steps');
  const steps = [
    ['Set up Google Cloud OAuth', 'https://console.cloud.google.com → APIs → Gmail API + Sheets API → OAuth credentials'],
    ['Get OAuth refresh token', 'Run the Google OAuth flow and capture the refresh token'],
    ['Add LinkedIn cookie', 'Log in to LinkedIn in Chrome → DevTools → Application → Cookies → copy li_at value'],
    ['Configure Railway', 'Push to GitHub → connect Railway → add all env vars from .env.example'],
    ['Add GitHub Secrets', 'Settings → Secrets → add all values from .env.example'],
    ['Test the dashboard', 'node server.js → open http://localhost:3000'],
    ['Run first prospect scrape', 'GitHub Actions → Prospect Discovery → Run workflow'],
    ['Review first drafts', 'Dashboard → Drafts → review and approve AI-generated messages'],
  ];
  steps.forEach(([title, detail], i) => {
    console.log(c.bold(`\n  ${i+1}. ${title}`));
    console.log(c.dim(`     ${detail}`));
  });
  console.log('');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n' + c.bold('╔════════════════════════════════════════╗'));
  console.log(c.bold('║  BizDev Platform — Setup                ║'));
  console.log(c.bold('╚════════════════════════════════════════╝'));

  const envOk = checkEnv();
  if (!envOk) {
    console.log(c.red('\n  Setup cannot continue until required env vars are set.'));
    console.log(c.dim('  Copy .env.example to .env and fill in the values.\n'));
    process.exit(1);
  }

  const sheetsOk = await setupSheets();
  if (sheetsOk) {
    await seedSettings();
    await seedSequences();
    console.log(c.green('\n  ✓ Setup complete!'));
  } else {
    console.log(c.red('\n  Setup failed at Sheets stage. Fix credentials and retry.'));
  }

  printSummary();
}

main().catch(err => {
  console.error(c.red('\nSetup crashed:'), err.message);
  process.exit(1);
});
