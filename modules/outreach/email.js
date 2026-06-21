/**
 * @module email
 * @description Email outreach engine.
 * Sends via Gmail SMTP using OAuth2 (so emails come from Harrison's real address).
 * Falls back to Resend API if needed.
 *
 * Australian Spam Act 2003 compliance is built in:
 *   - All emails include sender identification and business name
 *   - Functional opt-out: "reply STOP" triggers immediate unsubscribe
 *   - Only B2B contacts with legitimate business reason
 */

'use strict';

require('dotenv').config();
const { google } = require('googleapis');
const { Resend } = require('resend');

// ─── Gmail OAuth client ───────────────────────────────────────────────────────

/**
 * Creates an authenticated Gmail API client.
 * @returns {import('googleapis').gmail_v1.Gmail}
 */
function getGmailClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
  return google.gmail({ version: 'v1', auth });
}

// ─── Retry wrapper ─────────────────────────────────────────────────────────────

async function withRetry(fn, attempts = 3) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise(r => setTimeout(r, Math.pow(2, i - 1) * 1000));
    }
  }
}

// ─── Email composition ────────────────────────────────────────────────────────

/**
 * Encodes an email as RFC 2822 base64url string for the Gmail API.
 * @param {Object} params
 * @param {string} params.from
 * @param {string} params.to
 * @param {string} params.subject
 * @param {string} params.body
 * @param {string} [params.replyTo]
 * @returns {string} Base64url encoded email
 */
function encodeEmail({ from, to, subject, body, replyTo }) {
  const headers = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `Content-Type: text/plain; charset=utf-8`,
    `MIME-Version: 1.0`,
    replyTo ? `Reply-To: ${replyTo}` : null
  ].filter(Boolean).join('\r\n');

  const raw = `${headers}\r\n\r\n${body}`;
  return Buffer.from(raw).toString('base64url');
}

// ─── Send via Gmail ───────────────────────────────────────────────────────────

/**
 * Sends an email via the Gmail API.
 * Email appears to come from Harrison's real Gmail/Google Workspace address.
 *
 * @param {Object} params
 * @param {string} params.from - Sender email address
 * @param {string} params.to - Recipient email
 * @param {string} params.subject
 * @param {string} params.body - Plain text body
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendViaGmail(params) {
  const gmail = getGmailClient();
  const raw = encodeEmail(params);

  try {
    const res = await withRetry(() => gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw }
    }));
    return { success: true, messageId: res.data.id };
  } catch (err) {
    console.error('[Email] Gmail send error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an email via Resend API (fallback).
 * @param {Object} params
 * @returns {Promise<{ success: boolean, messageId?: string, error?: string }>}
 */
async function sendViaResend(params) {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: 'Resend API key not configured' };
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  try {
    const data = await withRetry(() => resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.body
    }));
    return { success: true, messageId: data.id };
  } catch (err) {
    console.error('[Email] Resend fallback error:', err.message);
    return { success: false, error: err.message };
  }
}

/**
 * Sends an email, trying Gmail first with Resend as fallback.
 * @param {Object} params
 * @returns {Promise<{ success: boolean, messageId?: string, provider: string, error?: string }>}
 */
async function sendEmail(params) {
  const gmailResult = await sendViaGmail(params);
  if (gmailResult.success) return { ...gmailResult, provider: 'gmail' };

  console.warn('[Email] Gmail failed, trying Resend fallback...');
  const resendResult = await sendViaResend(params);
  return { ...resendResult, provider: 'resend' };
}

// ─── Unsubscribe handling ─────────────────────────────────────────────────────

/**
 * Checks if an email reply is a STOP/unsubscribe request.
 * Australian Spam Act: must honour within 5 business days (we do it immediately).
 * @param {string} content - Email reply content
 * @returns {boolean}
 */
function isUnsubscribeRequest(content = '') {
  const text = content.toLowerCase().trim();
  const stopPhrases = [
    'stop', 'unsubscribe', 'remove me', 'opt out', 'opt-out',
    'don\'t email', 'do not email', 'no more emails', 'take me off'
  ];
  return stopPhrases.some(phrase => text.includes(phrase));
}

// ─── Gmail inbox polling ──────────────────────────────────────────────────────

/**
 * Polls Gmail for new replies from known prospect email addresses.
 * Returns messages received in the last 30 minutes.
 *
 * @param {string[]} knownEmails - Email addresses of active prospects
 * @returns {Promise<Array<{ from: string, subject: string, body: string, timestamp: string, threadId: string }>>}
 */
async function pollForReplies(knownEmails) {
  if (!knownEmails?.length) return [];

  const gmail = getGmailClient();
  const replies = [];

  try {
    // Search for recent emails from any known prospect address
    const emailQuery = knownEmails.map(e => `from:${e}`).join(' OR ');
    const since = Math.floor((Date.now() - 30 * 60 * 1000) / 1000); // 30 min ago
    const query = `(${emailQuery}) after:${since}`;

    const listRes = await withRetry(() => gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults: 50
    }));

    const messageIds = listRes.data.messages || [];

    for (const { id } of messageIds) {
      try {
        const msgRes = await gmail.users.messages.get({ userId: 'me', id, format: 'full' });
        const headers = msgRes.data.payload?.headers || [];

        const getHeader = (name) => headers.find(h => h.name.toLowerCase() === name.toLowerCase())?.value || '';

        const from = getHeader('From');
        const subject = getHeader('Subject');
        const date = getHeader('Date');

        // Extract plain text body
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

        // Extract email address from "From" header
        const fromEmail = from.match(/<(.+)>/)?.[1] || from;

        replies.push({
          from: fromEmail,
          fromDisplay: from,
          subject,
          body: body.trim(),
          timestamp: new Date(date).toISOString(),
          threadId: msgRes.data.threadId,
          messageId: id
        });
      } catch (err) {
        console.warn(`[Email] Could not fetch message ${id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Email] Gmail poll error:', err.message);
  }

  return replies;
}

/**
 * Sends an alert email to the founder about an event requiring attention.
 * Used for positive reply alerts, session errors, and daily digests.
 *
 * @param {Object} params
 * @param {string} params.subject
 * @param {string} params.body
 */
async function sendFounderAlert(params) {
  const founderEmail = process.env.FOUNDER_EMAIL;
  if (!founderEmail) {
    console.warn('[Email] FOUNDER_EMAIL not set — cannot send alert');
    return;
  }

  await sendEmail({
    from: process.env.OPTIMAI_EMAIL || founderEmail,
    to: founderEmail,
    subject: params.subject,
    body: params.body
  });
}

module.exports = {
  sendEmail,
  sendViaGmail,
  sendViaResend,
  pollForReplies,
  isUnsubscribeRequest,
  sendFounderAlert
};
