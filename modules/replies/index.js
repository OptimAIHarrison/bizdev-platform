/**
 * @module replies
 * @description Reply detection and inbox management.
 * Monitors Gmail and LinkedIn for replies from known prospects,
 * classifies intent using rule-based keyword matching (no AI/LLM call),
 * and triggers appropriate next actions.
 *
 * Run every 30 minutes on weekdays via GitHub Actions.
 */

'use strict';

require('dotenv').config();
const crm = require('../crm');
const { classifyReply } = require('./classifier');
const emailModule = require('../outreach/email');
const linkedinModule = require('../outreach/linkedin');

// ─── Gmail reply processing ───────────────────────────────────────────────────

/**
 * Checks Gmail for new replies from known prospects.
 * Classifies each reply and takes the appropriate action.
 * @returns {Promise<number>} Number of replies processed
 */
async function processGmailReplies() {
  // Get all active prospects with email addresses
  const prospects = await crm.getProspects({ status: ['active', 'queued'] });
  const prospectsByEmail = {};
  for (const p of prospects) {
    if (p.email) prospectsByEmail[p.email.toLowerCase()] = p;
  }

  const knownEmails = Object.keys(prospectsByEmail);
  if (!knownEmails.length) return 0;

  const replies = await emailModule.pollForReplies(knownEmails);
  let processed = 0;

  for (const reply of replies) {
    const fromEmail = reply.from.toLowerCase();
    const prospect = prospectsByEmail[fromEmail];
    if (!prospect) continue;

    // Check for STOP/unsubscribe immediately before anything else
    if (emailModule.isUnsubscribeRequest(reply.body)) {
      console.log(`[Replies] Unsubscribe request from ${reply.from}`);
      await crm.updateProspect(prospect.id, { status: 'unsubscribed' });
      await crm.insertReply({
        prospect_id: prospect.id,
        channel: 'email',
        content: reply.body,
        sentiment: 'negative',
        intent: 'negative_hard_no',
        action_required: 'Unsubscribed — all sequences stopped',
        handled: 'true'
      });
      await crm.logActivity({
        prospect_id: prospect.id,
        action: 'unsubscribe',
        channel: 'email',
        outcome: 'success',
        notes: 'Prospect sent STOP — marked unsubscribed immediately'
      });
      processed++;
      continue;
    }

    // Get prior messages for context
    const thread = await crm.getMessagesForProspect(prospect.id);

    // Classify intent — rule-based, no AI call
    console.log(`[Replies] Classifying reply from ${reply.from}...`);
    const classification = classifyReply({
      replyContent: reply.body,
      prospect,
      thread
    });

    // Log to Replies_Inbox
    await crm.insertReply({
      prospect_id: prospect.id,
      channel: 'email',
      content: reply.body,
      sentiment: classification.sentiment,
      intent: classification.intent,
      action_required: classification.suggestedAction,
      handled: 'false'
    });

    // Log to activity log
    await crm.logActivity({
      prospect_id: prospect.id,
      action: 'reply_received',
      channel: 'email',
      outcome: 'success',
      notes: `Intent: ${classification.intent} | ${classification.summary}`
    });

    // Take action based on intent
    await handleIntent(prospect, classification, reply, 'email');
    processed++;
  }

  return processed;
}

// ─── LinkedIn reply processing ────────────────────────────────────────────────

/**
 * Scrapes LinkedIn inbox and processes any new messages from known prospects.
 * @returns {Promise<number>} Number of messages processed
 */
async function processLinkedInReplies() {
  const { chromium } = require('playwright');
  const linkedin = require('../outreach/linkedin');

  const { browser, page, valid } = await linkedin.launchSession?.() || {};
  // Note: launchSession is defined in linkedin.js, we import it here
  // If session invalid, alert and bail
  if (!valid) {
    console.error('[Replies] LinkedIn session invalid — skipping inbox check');
    await emailModule.sendFounderAlert({
      subject: '⚠️ LinkedIn session needs refresh',
      body: 'Your LinkedIn session cookie has expired. Please update LINKEDIN_SESSION_COOKIE in Railway environment variables.\n\nThe system will continue running email outreach but LinkedIn is paused until this is fixed.'
    });
    return 0;
  }

  const inboxMessages = await linkedinModule.scrapeInbox(page);
  await browser.close();

  const prospects = await crm.getProspects({ status: ['active', 'queued', 'responded'] });
  const prospectsByLinkedIn = {};
  for (const p of prospects) {
    if (p.linkedin_url) prospectsByLinkedIn[p.linkedin_url] = p;
  }

  let processed = 0;

  for (const msg of inboxMessages) {
    // Match by LinkedIn profile URL
    const prospect = prospectsByLinkedIn[msg.senderProfileUrl];
    if (!prospect) continue;

    const thread = await crm.getMessagesForProspect(prospect.id);

    const classification = classifyReply({
      replyContent: msg.message,
      prospect,
      thread
    });

    await crm.insertReply({
      prospect_id: prospect.id,
      channel: 'linkedin',
      content: msg.message,
      sentiment: classification.sentiment,
      intent: classification.intent,
      action_required: classification.suggestedAction,
      handled: 'false'
    });

    await crm.logActivity({
      prospect_id: prospect.id,
      action: 'linkedin_reply_received',
      channel: 'linkedin',
      outcome: 'success',
      notes: `Intent: ${classification.intent} | ${classification.summary}`
    });

    await handleIntent(prospect, classification, msg, 'linkedin');
    processed++;
  }

  return processed;
}

// ─── Intent action handler ────────────────────────────────────────────────────

/**
 * Takes the appropriate system action based on the classified reply intent.
 *
 * @param {Object} prospect
 * @param {Object} classification - From classifier.classifyReply()
 * @param {Object} replyData - Raw reply object
 * @param {string} channel - 'email' | 'linkedin'
 */
async function handleIntent(prospect, classification, replyData, channel) {
  const settings = await crm.getSettings();
  const templating = require('../templating');

  switch (classification.intent) {
    case 'positive_interest':
      // Update status, alert founder
      await crm.updateProspect(prospect.id, { status: 'responded' });

      const suggestedBookingReply = templating.renderReplyTemplate({
        prospect, brand: prospect.brand, templateKey: 'positive_booking', settings
      });

      const alertBody = [
        `🔥 ${prospect.first_name} ${prospect.last_name} from ${prospect.company} replied with interest.`,
        ``,
        `Channel: ${channel}`,
        `Their message: ${replyData.body || replyData.message}`,
        ``,
        `Intent classification: ${classification.summary}`,
        ``,
        suggestedBookingReply ? `Suggested reply template:\n---\n${suggestedBookingReply}\n---` : '',
        ``,
        `View in dashboard: http://localhost:${process.env.PORT || 3000}/replies`
      ].filter(s => s !== null).join('\n');

      await emailModule.sendFounderAlert({
        subject: `🔥 ${prospect.first_name} from ${prospect.company} replied with interest`,
        body: alertBody
      });

      // Auto-respond with Calendly link if configured — uses the editable template
      if (settings.AUTO_RESPOND_POSITIVE === 'true' && channel === 'email' && suggestedBookingReply) {
        const fromEmail = prospect.brand === 'optimai' ? process.env.OPTIMAI_EMAIL : process.env.NUDGE_EMAIL;
        await emailModule.sendEmail({ from: fromEmail, to: prospect.email, subject: `Re: ${replyData.subject}`, body: suggestedBookingReply });
      }
      break;

    case 'not_now_nurture':
      // Move to nurture track
      await crm.updateProspect(prospect.id, {
        status: 'paused',
        notes: `${prospect.notes || ''} | Moved to nurture: ${classification.summary}`
      });
      await crm.logActivity({
        prospect_id: prospect.id,
        action: 'moved_to_nurture',
        channel,
        outcome: 'success',
        notes: 'Not now response — moved to long-term nurture track'
      });
      break;

    case 'negative_hard_no':
      await crm.updateProspect(prospect.id, { status: 'do_not_contact' });
      await crm.logActivity({
        prospect_id: prospect.id,
        action: 'marked_dnc',
        channel,
        outcome: 'success',
        notes: 'Hard no — marked do not contact'
      });
      break;

    case 'referral_signal':
      // Alert founder about the referral
      await emailModule.sendFounderAlert({
        subject: `💡 Referral signal from ${prospect.first_name} at ${prospect.company}`,
        body: `${prospect.first_name} ${prospect.last_name} mentioned a potential referral.\n\nMessage: ${replyData.body || replyData.message}\n\nReferred person: ${classification.referredName || 'Check message for details'}\n\nAction required: Add the referred person as a new prospect in the dashboard.`
      });
      await crm.updateProspect(prospect.id, { status: 'responded' });
      break;

    case 'question_objection':
      // Alert founder with a starting-point reply template
      await crm.updateProspect(prospect.id, { status: 'responded' });
      const suggestedQuestionReply = templating.renderReplyTemplate({
        prospect, brand: prospect.brand, templateKey: 'question_generic', settings
      });
      await emailModule.sendFounderAlert({
        subject: `💬 ${prospect.first_name} from ${prospect.company} has a question`,
        body: [
          `${prospect.first_name} ${prospect.last_name} responded with a question or objection.`,
          ``,
          `Their message: ${replyData.body || replyData.message}`,
          ``,
          `Reply template (edit before sending — fill in the [ANSWER] placeholder):`,
          `---`,
          suggestedQuestionReply || 'No reply template configured for this brand — add one in the Templates tab.',
          `---`,
          ``,
          `View in dashboard: http://localhost:${process.env.PORT || 3000}/replies`
        ].join('\n')
      });
      break;

    case 'out_of_office':
      // Pause sequence temporarily
      const resumeDate = classification.oooEndDate;
      await crm.updateProspect(prospect.id, {
        notes: `${prospect.notes || ''} | OOO until: ${resumeDate || 'unknown'}`
      });
      await crm.logActivity({
        prospect_id: prospect.id,
        action: 'ooo_detected',
        channel,
        outcome: 'skipped',
        notes: `Out of office. Resume: ${resumeDate || 'unknown'}`
      });
      break;

    default:
      console.warn(`[Replies] Unknown intent: ${classification.intent}`);
  }
}

// ─── Main runner ──────────────────────────────────────────────────────────────

/**
 * Runs the full reply monitoring cycle.
 * Checks both Gmail and LinkedIn, processes all new replies.
 * @returns {Promise<{ gmail: number, linkedin: number }>}
 */
async function runReplyMonitor() {
  console.log('[Replies] Starting reply monitor...');

  const [gmailCount, linkedinCount] = await Promise.allSettled([
    processGmailReplies(),
    processLinkedInReplies()
  ]);

  const results = {
    gmail: gmailCount.status === 'fulfilled' ? gmailCount.value : 0,
    linkedin: linkedinCount.status === 'fulfilled' ? linkedinCount.value : 0
  };

  console.log(`[Replies] Done. Gmail: ${results.gmail}, LinkedIn: ${results.linkedin}`);
  return results;
}

module.exports = { runReplyMonitor, processGmailReplies, processLinkedInReplies, handleIntent };
