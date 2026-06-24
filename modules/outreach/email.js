/**
 * @module email
 * @description Email outreach engine — per-brand OAuth.
 *
 * Each brand has its own Google OAuth credentials and Gmail inbox.
 * OptimAI and Nudge Digital send from their own Workspace accounts
 * using separate refresh tokens.
 *
 * Brand credential mapping (all set as Railway/env vars):
 *   OptimAI  → OPTIMAI_OAUTH_CLIENT_ID / SECRET / REFRESH_TOKEN
 *   Nudge    → NUDGE_OAUTH_CLIENT_ID   / SECRET / REFRESH_TOKEN
 *
 * If a brand-specific var is missing, falls back to the shared
 * GOOGLE_OAUTH_* vars so a single-account setup still works.
 *
 * TEST MODE: Set TEST_MODE=true to intercept all sends.
 * Emails are logged to console instead of being sent.
 * Set TEST_EMAIL=you@example.com to redirect all sends there instead.
 */

'use strict';

require('dotenv').config();
const { google } = require('googleapis');
const { Resend } = require('resend');

// ─── Brand credential resolution ─────────────────────────────────────────────

/**
 * Returns the OAuth credentials for a given brand.
 * Falls back to shared GOOGLE_OAUTH_* vars if brand-specific ones aren't set.
 * @param {'optimai'|'nudge'} brand
 */
function getBrandCredentials(brand) {
  const prefix = brand === 'nudge' ? 'NUDGE' : 'OPTIMAI';

  return {
    clientId:     process.env[`${prefix}_OAUTH_CLIENT_ID`]     || process.env.GOOGLE_OAUTH_CLIENT_ID,
    clientSecret: process.env[`${prefix}_OAUTH_CLIENT_SECRET`] || process.env.GOOGLE_OAUTH_CLIENT_SECRET,
    refreshToken: process.env[`${prefix}_OAUTH_REFRESH_TOKEN`] || process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
  };
}

/**
 * Returns true if a brand's Gmail credentials are fully configured.
 * @param {'optimai'|'nudge'} brand
 */
function isBrandGmailConfigured(brand) {
  const creds = getBrandCredentials(brand);
  return !!(creds.clientId && creds.clientSecret && creds.refreshToken);
}

// ─── Gmail client factory ─────────────────────────────────────────────────────

/**
 * Creates an authenticated Gmail API client for a specific brand.
 * @param {'optimai'|'nudge'} brand
 */
function getGmailClient(brand = 'optimai') {
  const creds = getBrandCredentials(brand);
  const auth  = new google.auth.OAuth2(creds.clientId, creds.clientSecret);
  auth.setCredentials({ refresh_token: creds.refreshToken });
  return google.gmail({ version: 'v1', auth });
}

// ─── Test mode helpers ────────────────────────────────────────────────────────

function isTestMode() {
  return process.env.TEST_MODE === 'true';
}

/**
 * In test mode, either redirects to TEST_EMAIL or just logs.
 * Returns a mock success so the rest of the pipeline treats it as sent.
 */
function handleTestModeSend(params) {
  const testEmail = process.env.TEST_EMAIL;
  if (testEmail) {
    console.log(`[Email] 🧪 TEST MODE — redirecting to ${testEmail}`);
    console.log(`  Would send to: ${params.to}`);
    console.log(`  Subject: ${params.subject}`);
    // Fall through with modified params — actual send to test address happens below
    return { ...params, to: testEmail, subject: `[TEST → ${params.to}] ${params.subject}` };
  }
  // No TEST_EMAIL set — just log and return mock success
  console.log(`[Email] 🧪 TEST MODE — email NOT sent (set TEST_EMAIL to redirect)`);
  console.log(`  Would send to: ${params.to}`);
  console.log(`  Subject: ${params.subject}`);
  console.log(`  Body preview: ${params.body?.substring(0, 120)}...`);
  return null; // null = intercepted, don't actually send
}

// ─── Retry wrapper ────────────────────────────────────────────────────────────

async function withRetry(fn, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try { return await fn(); }
    catch (err) {
      if (i === attempts) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, i - 1) * 1000));
    }
  }
}

// ─── Email composition ────────────────────────────────────────────────────────

function encodeEmail({ from, to, subject, body, replyTo }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    replyTo ? `Reply-To: ${replyTo}` : null
  ].filter(Boolean).join('\r\n');

  return Buffer.from(`${headers}\r\n\r\n${body}`).toString('base64url');
}

// ─── Send via Gmail (brand-specific) ─────────────────────────────────────────

async function sendViaGmail(params, brand = 'optimai') {
  if (!isBrandGmailConfigured(brand)) {
    return { success: false, error: `Gmail not configured for brand: ${brand}` };
  }

  const gmail = getGmailClient(brand);
  const raw   = encodeEmail(params);

  try {
    const res = await withRetry(() => gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    }));
    return { success: true, messageId: res.data.id };
  } catch (err) {
    console.error(`[Email] Gmail send error (${brand}):`, err.message);
    return { success: false, error: err.message };
  }
}

// ─── Send via Resend (fallback) ───────────────────────────────────────────────

async function sendViaResend(params) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const data = await withRetry(() => resend.emails.send({
      from: params.from,
      to:   params.to,
      subject: params.subject,
      text: params.body
    }));
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error('[Email] Resend fallback error:', err.message);
    return { success: false, error: err.message };
  }
}

// ─── Main send function ───────────────────────────────────────────────────────

/**
 * Sends an email for a specific brand.
 * Respects TEST_MODE — intercepts or redirects sends.
 * Falls back to Resend if Gmail fails.
 *
 * @param {Object} params
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.body
 * @param {'optimai'|'nudge'} [params.brand] - Used to select the right OAuth client
 */
async function sendEmail(params) {
  // Infer brand from from-address if not passed explicitly
  const brand = params.brand ||
    (params.from?.includes('nudge') ? 'nudge' : 'optimai');

  // Test mode intercept
  if (isTestMode()) {
    const redirected = handleTestModeSend(params);
    if (!redirected) return { success: true, provider: 'test_mode_intercepted' };
    // If TEST_EMAIL is set, send for real to that address
    params = redirected;
  }

  // Try Gmail first
  const gmailResult = await sendViaGmail(params, brand);
  if (gmailResult.success) return { ...gmailResult, provider: 'gmail', brand };

  // Fall back to Resend
  console.warn(`[Email] Gmail failed for ${brand}, trying Resend...`);
  const resendResult = await sendViaResend(params);
  return { ...resendResult, provider: 'resend', brand };
}

// ─── Gmail inbox polling (per brand) ─────────────────────────────────────────

/**
 * Polls a brand's Gmail inbox for replies from known prospect email addresses.
 * @param {string[]} knownEmails
 * @param {'optimai'|'nudge'} brand
 */
async function pollForReplies(knownEmails, brand = 'optimai') {
  if (!knownEmails?.length || !isBrandGmailConfigured(brand)) return [];

  const gmail   = getGmailClient(brand);
  const replies = [];

  try {
    const emailQuery = knownEmails.map(e => `from:${e}`).join(' OR ');
    const since      = Math.floor((Date.now() - 30 * 60 * 1000) / 1000);
    const query      = `(${emailQuery}) after:${since}`;

    const listRes = await withRetry(() => gmail.users.messages.list({
      userId: 'me', q: query, maxResults: 50
    }));

    const messageIds = listRes.data.messages || [];

    for (const { id } of messageIds) {
      try {
        const msgRes  = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const headers = msgRes.data.payload?.headers || [];
        const getHeader = n => headers.find(h => h.name.toLowerCase() === n.toLowerCase())?.value || '';

        const from    = getHeader('From');
        const subject = getHeader('Subject');
        const date    = getHeader('Date');

        let body = '';
        const parts = msgRes.data.payload?.parts || [];
        for (const part of parts) {
          if (part.mimeType === 'text/plain' && part.body?.data) {
            body = Buffer.from(part.body.data, 'base64').toString('utf-8');
            break;
          }
        }
        if (!body && msgRes.data.payload?.body?.data) {
          body = Buffer.from(msgRes.data.payload.body.data, 'base64').toString('utf-8');
        }

        const fromEmail = from.match(/<(.+)>/)?.[1] || from;
        replies.push({
          from: fromEmail, fromDisplay: from, subject,
          body: body.trim(),
          timestamp: new Date(date).toISOString(),
          threadId: msgRes.data.threadId,
          messageId: id,
          brand
        });
      } catch (err) {
        console.warn(`[Email] Could not fetch message ${id}:`, err.message);
      }
    }
  } catch (err) {
    console.error(`[Email] Gmail poll error (${brand}):`, err.message);
  }

  return replies;
}

// ─── Unsubscribe detection ────────────────────────────────────────────────────

function isUnsubscribeRequest(content = '') {
  const text = content.toLowerCase().trim();
  return ['stop', 'unsubscribe', 'remove me', 'opt out', 'opt-out',
    'don\'t email', 'do not email', 'no more emails', 'take me off'
  ].some(phrase => text.includes(phrase));
}

// ─── Founder alert ────────────────────────────────────────────────────────────

async function sendFounderAlert({ subject, body }) {
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) {
    console.warn('[Email] FOUNDER_EMAIL not set — cannot send alert');
    return;
  }
  await sendEmail({
    from:  process.env.OPTIMAI_EMAIL || founderEmail,
    to:    founderEmail,
    subject,
    body,
    brand: 'optimai'
  });
}

// ─── Status check (used by settings page) ────────────────────────────────────

/**
 * Returns the connection status for all email credentials.
 * Used by the dashboard Settings → System Status panel.
 */
function getEmailStatus() {
  return {
    testMode: isTestMode(),
    testEmail: process.env.TEST_EMAIL || null,
    optimai: {
      email:       process.env.OPTIMAI_EMAIL || null,
      configured:  isBrandGmailConfigured('optimai'),
      hasClientId: !!process.env.OPTIMAI_OAUTH_CLIENT_ID || !!process.env.GOOGLE_OAUTH_CLIENT_ID,
      hasSecret:   !!process.env.OPTIMAI_OAUTH_CLIENT_SECRET || !!process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      hasToken:    !!process.env.OPTIMAI_OAUTH_REFRESH_TOKEN || !!process.env.GOOGLE_OAUTH_REFRESH_TOKEN,
    },
    nudge: {
      email:       process.env.NUDGE_EMAIL || null,
      configured:  isBrandGmailConfigured('nudge'),
      hasClientId: !!process.env.NUDGE_OAUTH_CLIENT_ID,
      hasSecret:   !!process.env.NUDGE_OAUTH_CLIENT_SECRET,
      hasToken:    !!process.env.NUDGE_OAUTH_REFRESH_TOKEN,
    },
    resend: {
      configured: !!process.env.RESEND_API_KEY,
    }
  };
}

module.exports = {
  sendEmail,
  sendViaGmail,
  sendViaResend,
  pollForReplies,
  isUnsubscribeRequest,
  sendFounderAlert,
  getEmailStatus,
  isBrandGmailConfigured,
  getBrandCredentials,
};
