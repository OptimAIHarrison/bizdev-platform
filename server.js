/**
 * @file server.js
 * @description Express dashboard server for Infinity Machine.
 * Deployed on Railway (always-on). GitHub Actions call the worker
 * modules (outreach, replies, nurture) on schedule.
 *
 * All routes that read from Google Sheets degrade gracefully —
 * they return empty arrays/objects instead of 500 errors when
 * credentials are missing or Sheets isn't set up yet.
 */

'use strict';

require('dotenv').config();
const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 8080;

// ─── Lazy-load heavy modules so the server starts even if they fail ───────────
// Each getter catches its own import error and returns a stub.

function safeRequire(mod) {
  try { return require(mod); }
  catch (e) { console.warn(`[Server] Could not load ${mod}: ${e.message}`); return null; }
}

const crm        = safeRequire('./modules/crm');
const templating = safeRequire('./modules/templating');
const emailModule  = safeRequire('./modules/outreach/email');

// These are only used for fire-and-forget actions — null is fine at startup
let _outreach, _prospecting, _replies, _nurture, _healthCheck;
function getOutreach()    { return _outreach    || (_outreach    = safeRequire('./modules/outreach')); }
function getProspecting() { return _prospecting || (_prospecting = safeRequire('./modules/prospecting')); }
function getReplies()     { return _replies     || (_replies     = safeRequire('./modules/replies')); }
function getNurture()     { return _nurture     || (_nurture     = safeRequire('./modules/nurture')); }
function getHealthCheck() { return _healthCheck || (_healthCheck = safeRequire('./modules/health-check')); }

// ─── CRM safe wrapper ─────────────────────────────────────────────────────────
// Returns a fallback value instead of throwing when Sheets isn't configured.

async function crmCall(fn, fallback) {
  if (!crm) return fallback;
  try {
    return await fn(crm);
  } catch (err) {
    const msg = err.message || String(err);
    // Log the real error server-side for debugging
    console.error('[CRM]', msg);
    return fallback;
  }
}

// ─── Startup env check ────────────────────────────────────────────────────────

function checkEnv() {
  const required = {
    GOOGLE_OAUTH_CLIENT_ID:     'Google Cloud Console → OAuth credentials',
    GOOGLE_OAUTH_CLIENT_SECRET: 'Google Cloud Console → OAuth credentials',
    GOOGLE_OAUTH_REFRESH_TOKEN: 'Run: node scripts/get-oauth-token.js',
    GOOGLE_SHEETS_ID:           'The long ID from your Google Sheet URL',
    DASHBOARD_SECRET:           'Any random string — used to log in to the dashboard',
  };
  const optional = [
    'LINKEDIN_SESSION_COOKIE', 'OPTIMAI_EMAIL', 'NUDGE_EMAIL',
    'FOUNDER_EMAIL', 'RESEND_API_KEY', 'HUNTER_API_KEY',
    'APOLLO_API_KEY', 'CALENDLY_URL',
  ];

  console.log('\n[Infinity Machine] Checking environment...');
  let ok = true;
  for (const [key, hint] of Object.entries(required)) {
    if (process.env[key]) {
      console.log(`  ✓ ${key}`);
    } else {
      console.warn(`  ✗ ${key} — MISSING (${hint})`);
      ok = false;
    }
  }
  for (const key of optional) {
    if (!process.env[key]) console.log(`  - ${key} — not set (optional)`);
  }
  if (!ok) console.warn('\n  ⚠ Some required env vars are missing. Dashboard will load but CRM calls will fail.\n');
  return ok;
}

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard/public')));

// Auth middleware
app.use((req, res, next) => {
  if (req.path === '/health') return next();
  if (req.path.startsWith('/public')) return next();

  const secret = process.env.DASHBOARD_SECRET;

  // If no DASHBOARD_SECRET is set, allow everything (dev mode)
  if (!secret) return next();

  const authHeader = req.headers['x-dashboard-secret'];
  if (authHeader === secret) return next();

  const cookieMatch = req.headers.cookie?.split(';')
    .map(c => c.trim())
    .find(c => c.startsWith('ds='));
  const cookieVal = cookieMatch ? decodeURIComponent(cookieMatch.split('=')[1]) : null;
  if (cookieVal === secret) return next();

  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorised — check your access code' });
  }

  if (!req.path.startsWith('/login')) return res.redirect('/login.html');
  next();
});

// HTML routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'dashboard/public/login.html')));

// NOTE: SPA catch-all is at the BOTTOM — after all /api/* routes.

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ─── Overview ─────────────────────────────────────────────────────────────────

app.get('/api/overview', async (req, res) => {
  const [prospects, messages, replies] = await Promise.all([
    crmCall(c => c.getProspects(), []),
    crmCall(c => c.readSheet('Messages'), []),
    crmCall(c => c.getUnhandledReplies(), []),
  ]);

  const today = new Date().toISOString().split('T')[0];
  const active = ['active','responded','meeting_booked','won'];

  res.json({
    funnel: {
      total:     prospects.length,
      contacted: prospects.filter(p => active.includes(p.status)).length,
      replied:   prospects.filter(p => ['responded','meeting_booked','won'].includes(p.status)).length,
      meetings:  prospects.filter(p => ['meeting_booked','won'].includes(p.status)).length,
      won:       prospects.filter(p => p.status === 'won').length,
    },
    todayMessages: messages.filter(m => m.sent_at?.startsWith(today) && m.status === 'sent').length,
    unhandledReplies: replies.length,
    byBrand: {
      optimai: prospects.filter(p => p.brand === 'optimai').length,
      nudge:   prospects.filter(p => p.brand === 'nudge').length,
    },
    crmConnected: !!process.env.GOOGLE_SHEETS_ID && !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  });
});

// ─── Prospects ────────────────────────────────────────────────────────────────

app.get('/api/prospects', async (req, res) => {
  let prospects = await crmCall(c => c.getProspects(), []);

  const { brand, status, search } = req.query;
  if (brand)  prospects = prospects.filter(p => p.brand === brand);
  if (status) prospects = prospects.filter(p => p.status === status);
  if (search) {
    const q = search.toLowerCase();
    prospects = prospects.filter(p =>
      `${p.first_name} ${p.last_name} ${p.company} ${p.email}`.toLowerCase().includes(q)
    );
  }

  prospects.sort((a, b) => new Date(b.last_activity || 0) - new Date(a.last_activity || 0));
  res.json(prospects);
});

app.get('/api/prospects/:id', async (req, res) => {
  const prospect = await crmCall(c => c.getProspectById(req.params.id), null);
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });
  const messages = await crmCall(c => c.getMessagesForProspect(req.params.id), []);
  res.json({ ...prospect, messages });
});

app.patch('/api/prospects/:id', async (req, res) => {
  try {
    await crmCall(c => c.updateProspect(req.params.id, req.body), null);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/prospects', async (req, res) => {
  try {
    const id = await crmCall(c => c.insertProspect({ ...req.body, source: 'manual', status: 'queued' }), null);
    res.json({ success: true, id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Replies ──────────────────────────────────────────────────────────────────

app.get('/api/replies', async (req, res) => {
  const replies = await crmCall(c => c.getUnhandledReplies(), []);
  const enriched = await Promise.all(
    replies.map(async r => {
      const prospect = await crmCall(c => c.getProspectById(r.prospect_id), null);
      return { ...r, prospect };
    })
  );
  res.json(enriched);
});

app.post('/api/replies/:id/handle', async (req, res) => {
  try {
    await crmCall(c => c.markReplyHandled(req.params.id), null);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Drafts ───────────────────────────────────────────────────────────────────

app.get('/api/drafts', async (req, res) => {
  const messages = await crmCall(c => c.readSheet('Messages'), []);
  const drafts   = messages.filter(m => m.status === 'draft');
  const enriched = await Promise.all(
    drafts.map(async d => {
      const prospect = await crmCall(c => c.getProspectById(d.prospect_id), null);
      return { ...d, prospect };
    })
  );
  res.json(enriched);
});

app.post('/api/drafts/:messageId/approve', async (req, res) => {
  try {
    const messages = await crmCall(c => c.readSheet('Messages'), []);
    const draft    = messages.find(m => m.message_id === req.params.messageId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const prospect = await crmCall(c => c.getProspectById(draft.prospect_id), null);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    if (draft.channel === 'email') {
      if (!emailModule) return res.status(500).json({ error: 'Email module not available' });
      const from   = prospect.brand === 'optimai' ? process.env.OPTIMAI_EMAIL : process.env.NUDGE_EMAIL;
      const result = await emailModule.sendEmail({ from, to: prospect.email, subject: draft.subject, body: draft.body });
      if (result.success) {
        await crmCall(c => c.updateRow('Messages', 'message_id', draft.message_id, {
          status: 'sent', sent_at: new Date().toISOString()
        }), null);
      }
      res.json({ success: result.success, error: result.error });
    } else {
      res.json({ success: false, error: 'LinkedIn draft approval: action manually on LinkedIn' });
    }
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/drafts/:messageId', async (req, res) => {
  try {
    await crmCall(c => c.updateRow('Messages', 'message_id', req.params.messageId, { status: 'rejected' }), null);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Actions (fire-and-forget) ────────────────────────────────────────────────

app.post('/api/actions/run-outreach', (req, res) => {
  const mod = getOutreach();
  if (mod) mod.runOutreachQueue({ brand: req.body?.brand }).catch(e => console.error('[Outreach]', e.message));
  res.json({ success: true, message: 'Outreach queue started' });
});

app.post('/api/actions/run-replies', (req, res) => {
  const mod = getReplies();
  if (mod) mod.runReplyMonitor().catch(e => console.error('[Replies]', e.message));
  res.json({ success: true, message: 'Reply monitor started' });
});

app.post('/api/actions/run-nurture', (req, res) => {
  const mod = getNurture();
  if (mod) mod.runNurtureEngine().catch(e => console.error('[Nurture]', e.message));
  res.json({ success: true, message: 'Nurture engine started' });
});

app.post('/api/actions/health-check', async (req, res) => {
  try {
    const mod    = getHealthCheck();
    const report = mod ? await mod.runHealthCheck() : { error: 'Health check module not available' };
    res.json({ success: true, report });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/actions/scrape-linkedin', (req, res) => {
  const { searchUrl, brand } = req.body || {};
  if (!searchUrl || !brand) return res.status(400).json({ error: 'searchUrl and brand required' });

  const mod = getProspecting();
  if (mod) {
    (async () => {
      try {
        const leads = await mod.scrapeLinkedInSearch(searchUrl);
        await mod.runProspectingPipeline(leads, brand, 'linkedin_search');
      } catch (e) { console.error('[Scrape]', e.message); }
    })();
  }
  res.json({ success: true, message: 'LinkedIn search scrape started' });
});

app.post('/api/actions/scrape-signals', (req, res) => {
  const { postUrl, brand, signalType } = req.body || {};
  if (!postUrl || !brand) return res.status(400).json({ error: 'postUrl and brand required' });

  const mod = getProspecting();
  if (mod) {
    (async () => {
      try {
        const leads = signalType === 'comments'
          ? await mod.scrapePostComments(postUrl)
          : await mod.scrapePostEngagement(postUrl);
        await mod.runProspectingPipeline(leads, brand, 'linkedin_signal');
      } catch (e) { console.error('[Signals]', e.message); }
    })();
  }
  res.json({ success: true, message: 'Signal scrape started' });
});

// ─── Settings ─────────────────────────────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  const settings = await crmCall(c => c.getSettings(), {});
  res.json(settings);
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await crmCall(c => c.setSetting(key, value), null);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Reporting ────────────────────────────────────────────────────────────────

app.get('/api/reporting', async (req, res) => {
  const [messages, prospects] = await Promise.all([
    crmCall(c => c.readSheet('Messages'), []),
    crmCall(c => c.getProspects(), []),
  ]);

  const sent    = messages.filter(m => m.status === 'sent');
  const replied = messages.filter(m => m.replied === 'true');

  const byStep = {};
  for (const msg of sent) {
    const key = `${msg.channel}-${msg.step}`;
    if (!byStep[key]) byStep[key] = { sent: 0, replied: 0 };
    byStep[key].sent++;
  }
  for (const msg of replied) {
    const key = `${msg.channel}-${msg.step}`;
    if (byStep[key]) byStep[key].replied++;
  }

  const statusCounts = {};
  for (const p of prospects) {
    statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
  }

  const subjectPerf = {};
  for (const msg of sent.filter(m => m.subject)) {
    if (!subjectPerf[msg.subject]) subjectPerf[msg.subject] = { sent: 0, replied: 0 };
    subjectPerf[msg.subject].sent++;
    if (msg.replied === 'true') subjectPerf[msg.subject].replied++;
  }

  const topSubjects = Object.entries(subjectPerf)
    .map(([subject, s]) => ({ subject, ...s, rate: s.sent > 0 ? s.replied / s.sent : 0 }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 10);

  res.json({
    totalSent:    sent.length,
    totalReplied: replied.length,
    replyRate:    sent.length > 0 ? (replied.length / sent.length * 100).toFixed(1) : '0.0',
    byStep,
    statusCounts,
    topSubjects,
  });
});

// ─── Templates ────────────────────────────────────────────────────────────────

app.get('/api/templates', (req, res) => {
  try {
    res.json(templating ? templating.getAllTemplates() : {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/templates', (req, res) => {
  try {
    const { path: dotPath, value } = req.body;
    if (!dotPath || value === undefined) return res.status(400).json({ error: 'path and value required' });
    if (!templating) return res.status(500).json({ error: 'Templating module not available' });
    templating.updateTemplate(dotPath, value);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/templates/preview', (req, res) => {
  try {
    const { path: dotPath, brand, prospect } = req.body;
    if (!templating) return res.status(500).json({ error: 'Templating module not available' });
    const preview = templating.previewTemplate(dotPath, brand, prospect || {});
    res.json({ preview });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/templates/render-email', (req, res) => {
  try {
    if (!templating) return res.json({ subject: '', body: '' });
    const { brand, stepNumber, abVariant } = req.query;
    const mock = { first_name: 'Alex', last_name: 'Chen', company: 'Acme Co', title: 'CEO', industry: 'SaaS', location: 'Melbourne', website: 'acme.com' };
    const rendered = templating.renderEmailStep({ prospect: mock, brand, stepNumber: parseInt(stepNumber), abVariant: abVariant || 'A', settings: {} });
    res.json(rendered || { subject: '', body: '' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Sequences ────────────────────────────────────────────────────────────────

app.get('/api/sequences', (req, res) => {
  try {
    res.json(require('./config/sequences.json'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Preview message ──────────────────────────────────────────────────────────

app.post('/api/preview-message', async (req, res) => {
  try {
    const { prospectId, stepId, brand } = req.body;
    const prospect = await crmCall(c => c.getProspectById(prospectId), null);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    const sequences = require('./config/sequences.json');
    const step      = sequences[brand]?.find(s => s.sequence_id === stepId);
    if (!step) return res.status(404).json({ error: 'Step not found' });

    const settings = await crmCall(c => c.getSettings(), {});
    if (!templating) return res.status(500).json({ error: 'Templating module not available' });

    let preview;
    if (step.channel === 'email') {
      preview = templating.renderEmailStep({ prospect, brand, stepNumber: step.step_number, settings });
    } else if (step.channel === 'linkedin_connect') {
      preview = { message: templating.renderLinkedInConnect({ prospect, brand, settings }) };
    } else if (step.channel === 'linkedin_message') {
      preview = templating.renderLinkedInMessage({ prospect, brand, stepNumber: step.step_number, settings });
    } else {
      preview = { message: `[${step.channel} — no content needed]` };
    }

    res.json(preview || { error: 'No template found' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SPA catch-all — MUST be last ────────────────────────────────────────────

app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'API route not found' });
  res.sendFile(path.join(__dirname, 'dashboard/public/index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────

checkEnv();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n[Infinity Machine] ✓ Running on port ${PORT}`);
  console.log(`[Infinity Machine] → http://localhost:${PORT}\n`);
});

module.exports = app;
