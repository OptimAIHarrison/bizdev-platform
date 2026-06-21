/**
 * @file server.js
 * @description Express dashboard server for the BizDev Platform.
 * Serves a clean web UI for prospect management, reply inbox,
 * sequence builder, and system health monitoring.
 *
 * Deployed on Railway (always-on service).
 */

'use strict';

require('dotenv').config();
const express = require('express');
const path = require('path');
const crm = require('./modules/crm');
const ai = require('./modules/ai');
const emailModule = require('./modules/outreach/email');
const { runOutreachQueue } = require('./modules/outreach');
const { runProspectingPipeline } = require('./modules/prospecting');
const { runReplyMonitor } = require('./modules/replies');
const { runNurtureEngine } = require('./modules/nurture');
const { runHealthCheck } = require('./modules/health-check');

const app = express();
const PORT = process.env.PORT || 8080;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Dashboard] BizDev Platform running on port ${PORT}`);
});

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'dashboard/public')));

// Simple token-based auth for the dashboard
app.use((req, res, next) => {
  // Skip auth for public assets
  if (req.path.startsWith('/public')) return next();

  // Allow if correct secret header is present (for API calls)
  const authHeader = req.headers['x-dashboard-secret'];
  if (authHeader === process.env.DASHBOARD_SECRET) return next();

  // Allow if cookie is set (from browser login)
  if (req.headers.cookie?.includes(`ds=${process.env.DASHBOARD_SECRET}`)) return next();

  // Return 401 for API routes
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'Unauthorised' });
  }

  // For HTML routes, serve the login page
  if (!req.path.startsWith('/login')) {
    return res.redirect('/login');
  }

  next();
});

// ─── HTML routes ──────────────────────────────────────────────────────────────

// Serve the SPA for all non-API routes
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'dashboard/public/login.html')));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(__dirname, 'dashboard/public/index.html'));
});

// ─── API: Dashboard overview ──────────────────────────────────────────────────

app.get('/api/overview', async (req, res) => {
  try {
    const [prospects, messages, replies] = await Promise.all([
      crm.getProspects(),
      crm.readSheet('Messages'),
      crm.getUnhandledReplies()
    ]);

    const today = new Date().toISOString().split('T')[0];

    // Funnel counts
    const funnel = {
      total: prospects.length,
      contacted: prospects.filter(p => ['active', 'responded', 'meeting_booked', 'won'].includes(p.status)).length,
      replied: prospects.filter(p => ['responded', 'meeting_booked', 'won'].includes(p.status)).length,
      meetings: prospects.filter(p => ['meeting_booked', 'won'].includes(p.status)).length,
      won: prospects.filter(p => p.status === 'won').length
    };

    // Today's stats
    const todayMessages = messages.filter(m => m.sent_at?.startsWith(today) && m.status === 'sent');

    // By brand
    const byBrand = {
      optimai: prospects.filter(p => p.brand === 'optimai').length,
      nudge: prospects.filter(p => p.brand === 'nudge').length
    };

    res.json({ funnel, todayMessages: todayMessages.length, unhandledReplies: replies.length, byBrand });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Prospects ───────────────────────────────────────────────────────────

app.get('/api/prospects', async (req, res) => {
  try {
    const { brand, status, search } = req.query;
    let prospects = await crm.getProspects({ brand, status });

    if (search) {
      const q = search.toLowerCase();
      prospects = prospects.filter(p =>
        p.first_name?.toLowerCase().includes(q) ||
        p.last_name?.toLowerCase().includes(q) ||
        p.company?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q)
      );
    }

    // Sort by last_activity desc
    prospects.sort((a, b) => new Date(b.last_activity) - new Date(a.last_activity));
    res.json(prospects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/prospects/:id', async (req, res) => {
  try {
    const prospect = await crm.getProspectById(req.params.id);
    if (!prospect) return res.status(404).json({ error: 'Not found' });
    const messages = await crm.getMessagesForProspect(req.params.id);
    res.json({ ...prospect, messages });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/prospects/:id', async (req, res) => {
  try {
    await crm.updateProspect(req.params.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/prospects', async (req, res) => {
  try {
    const id = await crm.insertProspect({ ...req.body, source: 'manual', status: 'queued' });
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Replies inbox ───────────────────────────────────────────────────────

app.get('/api/replies', async (req, res) => {
  try {
    const replies = await crm.getUnhandledReplies();
    // Enrich with prospect data
    const enriched = await Promise.all(replies.map(async r => {
      const prospect = await crm.getProspectById(r.prospect_id).catch(() => null);
      return { ...r, prospect };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/replies/:id/handle', async (req, res) => {
  try {
    await crm.markReplyHandled(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Message preview and approval ───────────────────────────────────────

app.get('/api/drafts', async (req, res) => {
  try {
    const messages = await crm.readSheet('Messages');
    const drafts = messages.filter(m => m.status === 'draft');
    const enriched = await Promise.all(drafts.map(async d => {
      const prospect = await crm.getProspectById(d.prospect_id).catch(() => null);
      return { ...d, prospect };
    }));
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/drafts/:messageId/approve', async (req, res) => {
  try {
    // Fetch the draft
    const messages = await crm.readSheet('Messages');
    const draft = messages.find(m => m.message_id === req.params.messageId);
    if (!draft) return res.status(404).json({ error: 'Draft not found' });

    const prospect = await crm.getProspectById(draft.prospect_id);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    // Send it
    if (draft.channel === 'email') {
      const fromEmail = prospect.brand === 'optimai' ? process.env.OPTIMAI_EMAIL : process.env.NUDGE_EMAIL;
      const result = await emailModule.sendEmail({ from: fromEmail, to: prospect.email, subject: draft.subject, body: draft.body });
      await crm.updateRow('Messages', 'message_id', draft.message_id, {
        status: result.success ? 'sent' : 'failed',
        sent_at: new Date().toISOString()
      });
      res.json({ success: result.success });
    } else {
      res.json({ success: false, error: 'LinkedIn draft approval not supported via dashboard — use manual LinkedIn action' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/drafts/:messageId', async (req, res) => {
  try {
    await crm.updateRow('Messages', 'message_id', req.params.messageId, { status: 'rejected' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Manual trigger actions ──────────────────────────────────────────────

app.post('/api/actions/run-outreach', async (req, res) => {
  try {
    const { brand } = req.body;
    // Run async — don't block the HTTP response
    runOutreachQueue({ brand }).catch(err => console.error('[Dashboard] Outreach error:', err));
    res.json({ success: true, message: 'Outreach queue started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actions/run-replies', async (req, res) => {
  try {
    runReplyMonitor().catch(err => console.error('[Dashboard] Reply monitor error:', err));
    res.json({ success: true, message: 'Reply monitor started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actions/run-nurture', async (req, res) => {
  try {
    runNurtureEngine().catch(err => console.error('[Dashboard] Nurture error:', err));
    res.json({ success: true, message: 'Nurture engine started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actions/health-check', async (req, res) => {
  try {
    const report = await runHealthCheck();
    res.json({ success: true, report });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/actions/scrape-linkedin', async (req, res) => {
  try {
    const { searchUrl, brand } = req.body;
    if (!searchUrl || !brand) return res.status(400).json({ error: 'searchUrl and brand required' });

    runProspectingPipeline([], brand, 'linkedin_search')
      .catch(err => console.error('[Dashboard] Prospect scrape error:', err));

    res.json({ success: true, message: 'LinkedIn scrape started' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Settings ────────────────────────────────────────────────────────────

app.get('/api/settings', async (req, res) => {
  try {
    const settings = await crm.getSettings();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', async (req, res) => {
  try {
    const { key, value } = req.body;
    await crm.setSetting(key, value);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── API: Reporting ───────────────────────────────────────────────────────────

app.get('/api/reporting', async (req, res) => {
  try {
    const [messages, prospects] = await Promise.all([
      crm.readSheet('Messages'),
      crm.getProspects()
    ]);

    const sent = messages.filter(m => m.status === 'sent');
    const replied = messages.filter(m => m.replied === 'true');

    // Reply rate by sequence step
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

    // Funnel
    const statusCounts = {};
    for (const p of prospects) {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    }

    // Best performing subjects (top 5 by replied/sent ratio)
    const subjectPerf = {};
    for (const msg of sent.filter(m => m.subject)) {
      if (!subjectPerf[msg.subject]) subjectPerf[msg.subject] = { sent: 0, replied: 0 };
      subjectPerf[msg.subject].sent++;
      if (msg.replied === 'true') subjectPerf[msg.subject].replied++;
    }

    const topSubjects = Object.entries(subjectPerf)
      .map(([subject, stats]) => ({ subject, ...stats, rate: stats.sent > 0 ? (stats.replied / stats.sent) : 0 }))
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 10);

    res.json({
      totalSent: sent.length,
      totalReplied: replied.length,
      replyRate: sent.length > 0 ? (replied.length / sent.length * 100).toFixed(1) : 0,
      byStep,
      statusCounts,
      topSubjects
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── AI preview ───────────────────────────────────────────────────────────────

app.post('/api/preview-message', async (req, res) => {
  try {
    const { prospectId, stepId, brand } = req.body;
    const prospect = await crm.getProspectById(prospectId);
    if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

    const sequences = require('./config/sequences.json');
    const step = sequences[brand]?.find(s => s.sequence_id === stepId);
    if (!step) return res.status(404).json({ error: 'Step not found' });

    const previousMessages = await crm.getMessagesForProspect(prospectId);

    let preview;
    if (step.channel === 'email') {
      preview = await ai.generateOutreachEmail({ prospect, step, brand, previousMessages });
    } else if (step.channel === 'linkedin_connect') {
      preview = await ai.generateLinkedInConnect({ prospect, brand });
    } else if (step.channel === 'linkedin_message') {
      preview = await ai.generateLinkedInMessage({ prospect, brand, step, previousMessages });
    } else {
      preview = { message: `[${step.channel} — no content needed]` };
    }

    res.json(preview);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ─── API: Templates ───────────────────────────────────────────────────────────

const templating = require('./modules/templating');

app.get('/api/templates', (req, res) => {
  try { res.json(templating.getAllTemplates()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/templates', (req, res) => {
  try {
    const { path: dotPath, value } = req.body;
    if (!dotPath || value === undefined) return res.status(400).json({ error: 'path and value required' });
    templating.updateTemplate(dotPath, value);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/templates/preview', (req, res) => {
  try {
    const { path: dotPath, brand, prospect } = req.body;
    const preview = templating.previewTemplate(dotPath, brand, prospect || {});
    res.json({ preview });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/templates/render-email', (req, res) => {
  try {
    const { prospectId, brand, stepNumber, abVariant } = req.query;
    // For preview without a real prospect
    const mockProspect = { first_name: 'Alex', last_name: 'Chen', company: 'Acme Co', title: 'CEO', industry: 'SaaS', location: 'Melbourne', website: 'acme.com' };
    const rendered = templating.renderEmailStep({ prospect: mockProspect, brand, stepNumber: parseInt(stepNumber), abVariant: abVariant || 'A', settings: {} });
    res.json(rendered || { subject: '', body: '' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`[Dashboard] BizDev Platform running on port ${PORT}`);
  console.log(`[Dashboard] http://localhost:${PORT}`);
});

module.exports = app;
