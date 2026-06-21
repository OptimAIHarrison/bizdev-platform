/**
 * @module health-check
 * @description Daily system health check and digest emailer.
 * Tests: LinkedIn session, Gmail auth, API limits, data integrity.
 * Sends a summary email to the founder at 7am AEST every day.
 */

'use strict';

require('dotenv').config();
const dayjs = require('dayjs');
const crm = require('./crm');
const emailModule = require('./outreach/email');
const { checkSessionHealth } = require('./outreach/linkedin');

/**
 * Tests Gmail authentication by attempting to list messages.
 * @returns {Promise<boolean>}
 */
async function testGmailAuth() {
  try {
    const { google } = require('googleapis');
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_OAUTH_CLIENT_ID,
      process.env.GOOGLE_OAUTH_CLIENT_SECRET
    );
    auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth });
    await gmail.users.getProfile({ userId: 'me' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Tests Google Sheets access.
 * @returns {Promise<boolean>}
 */
async function testSheetsAccess() {
  try {
    await crm.getSettings();
    return true;
  } catch {
    return false;
  }
}

/**
 * Checks remaining Hunter.io API credits.
 * @returns {Promise<number|null>}
 */
async function checkHunterLimits() {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey) return null;
  try {
    const axios = require('axios');
    const res = await axios.get('https://api.hunter.io/v2/account', { params: { api_key: apiKey }, timeout: 5000 });
    return res.data?.data?.requests?.searches?.available || null;
  } catch {
    return null;
  }
}

/**
 * Gets yesterday's activity summary from the Activity_Log sheet.
 * @returns {Promise<Object>}
 */
async function getYesterdaySummary() {
  const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
  const log = await crm.readSheet('Activity_Log');

  const yesterdayLog = log.filter(e => e.timestamp?.startsWith(yesterday));

  return {
    emailsSent: yesterdayLog.filter(e => e.channel === 'email' && e.outcome === 'success').length,
    linkedinActions: yesterdayLog.filter(e => e.channel === 'linkedin' && e.outcome === 'success').length,
    repliesReceived: yesterdayLog.filter(e => e.action === 'reply_received' || e.action === 'linkedin_reply_received').length,
    prospectsAdded: yesterdayLog.filter(e => e.action === 'prospect_added').length,
    errors: yesterdayLog.filter(e => e.outcome === 'failed').length
  };
}

/**
 * Gets today's scheduled actions count (prospects in queue).
 * @returns {Promise<Object>}
 */
async function getTodayQueue() {
  const queued = await crm.getProspects({ status: ['queued', 'active'] });
  const optimai = queued.filter(p => p.brand === 'optimai').length;
  const nudge = queued.filter(p => p.brand === 'nudge').length;
  const meetings = await crm.getProspects({ status: 'meeting_booked' });
  const pipeline = await crm.getProspects({ status: 'responded' });

  return {
    totalActive: queued.length,
    optimaiActive: optimai,
    nudgeActive: nudge,
    meetingsBooked: meetings.length,
    warmPipeline: pipeline.length
  };
}

/**
 * Runs the full health check and sends a digest email to the founder.
 * @returns {Promise<Object>} Health report
 */
async function runHealthCheck() {
  console.log('[Health] Running system health check...');

  const [linkedinOk, gmailOk, sheetsOk, hunterCredits, yesterday, todayQueue] = await Promise.allSettled([
    checkSessionHealth(),
    testGmailAuth(),
    testSheetsAccess(),
    checkHunterLimits(),
    getYesterdaySummary(),
    getTodayQueue()
  ]);

  const report = {
    timestamp: dayjs().toISOString(),
    linkedin: linkedinOk.value ?? false,
    gmail: gmailOk.value ?? false,
    sheets: sheetsOk.value ?? false,
    hunterCredits: hunterCredits.value ?? 'unknown',
    yesterday: yesterday.value ?? {},
    today: todayQueue.value ?? {}
  };

  // Alert on session failures
  if (!report.linkedin) {
    await emailModule.sendFounderAlert({
      subject: '⚠️ LinkedIn session needs refresh',
      body: 'Your LinkedIn session cookie has expired. Update LINKEDIN_SESSION_COOKIE in Railway to resume LinkedIn outreach.\n\nEmail outreach is continuing normally.'
    });
  }

  if (!report.gmail) {
    await emailModule.sendFounderAlert({
      subject: '⚠️ Gmail authentication failed',
      body: 'Gmail OAuth authentication is failing. Email outreach may be disrupted. Check your OAuth credentials in Railway.'
    }).catch(() => {}); // Can't send email if gmail is broken — silent fail
  }

  // Build and send daily digest
  const statusLine = (ok) => ok ? '✅ OK' : '❌ FAILED';
  const digestBody = [
    `Good morning. Here's your BizDev Platform daily briefing.`,
    ``,
    `SYSTEM HEALTH`,
    `LinkedIn session: ${statusLine(report.linkedin)}`,
    `Gmail auth: ${statusLine(report.gmail)}`,
    `Google Sheets: ${statusLine(report.sheets)}`,
    `Hunter.io credits remaining: ${report.hunterCredits ?? 'unknown'}`,
    ``,
    `YESTERDAY (${dayjs().subtract(1, 'day').format('DD MMM')})`,
    `Emails sent: ${report.yesterday.emailsSent || 0}`,
    `LinkedIn actions: ${report.yesterday.linkedinActions || 0}`,
    `Replies received: ${report.yesterday.repliesReceived || 0}`,
    `New prospects added: ${report.yesterday.prospectsAdded || 0}`,
    `Errors: ${report.yesterday.errors || 0}`,
    ``,
    `TODAY'S QUEUE`,
    `Active prospects: ${report.today.totalActive || 0} (OptimAI: ${report.today.optimaiActive || 0}, Nudge: ${report.today.nudgeActive || 0})`,
    `Meetings booked: ${report.today.meetingsBooked || 0}`,
    `Warm pipeline (responded): ${report.today.warmPipeline || 0}`,
    ``,
    `Dashboard: http://localhost:${process.env.PORT || 3000}`,
    ``,
    `Have a great day.`
  ].join('\n');

  await emailModule.sendFounderAlert({
    subject: `📊 BizDev Daily — ${dayjs().format('ddd DD MMM')}`,
    body: digestBody
  });

  console.log('[Health] Health check complete:', { linkedin: report.linkedin, gmail: report.gmail, sheets: report.sheets });
  return report;
}

module.exports = { runHealthCheck, testGmailAuth, testSheetsAccess, checkSessionHealth };
