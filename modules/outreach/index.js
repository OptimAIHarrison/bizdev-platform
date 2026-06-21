/**
 * @module outreach
 * @description Main outreach engine.
 * Processes the outreach queue, executing the correct next sequence step
 * for each prospect using editable templates (config/templates.json).
 *
 * Manual approval mode (default ON): messages saved as drafts for review.
 * Auto-send mode: set MANUAL_APPROVAL_MODE=false in Settings sheet.
 */

'use strict';

require('dotenv').config();
const crm = require('../crm');
const email = require('./email');
const linkedin = require('./linkedin');
const templating = require('../templating');
const sequences = require('../../config/sequences.json');
const dayjs = require('dayjs');

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isStepDue(prospect, step) {
  const startDate = dayjs(prospect.date_added);
  const dueDate = startDate.add(step.day_offset, 'day');
  return dayjs().isAfter(dueDate) || dayjs().isSame(dueDate, 'day');
}

function isSequencePaused(prospect) {
  return ['paused', 'responded', 'meeting_booked', 'won', 'unsubscribed', 'do_not_contact', 'lost']
    .includes(prospect.status);
}

// ─── Email step ───────────────────────────────────────────────────────────────

async function executeEmailStep(prospect, step, previousMessages, settings) {
  // A/B variant: alternate by prospect ID hash
  const abVariant = parseInt(prospect.id.replace(/[^0-9]/g, '').substring(0, 4) || '0') % 2 === 0 ? 'A' : 'B';

  const rendered = templating.renderEmailStep({
    prospect,
    brand: prospect.brand,
    stepNumber: step.step_number,
    abVariant,
    settings
  });

  if (!rendered) {
    console.warn(`[Outreach] No email template for step ${step.step_number} (${prospect.brand})`);
    return false;
  }

  const fromEmail = prospect.brand === 'optimai' ? process.env.OPTIMAI_EMAIL : process.env.NUDGE_EMAIL;
  const manualMode = settings.MANUAL_APPROVAL_MODE === 'true' || process.env.MANUAL_APPROVAL_MODE === 'true';

  if (manualMode) {
    await crm.logMessage({
      prospect_id: prospect.id,
      sequence_id: step.sequence_id,
      step: step.step_number,
      channel: 'email',
      subject: rendered.subject,
      body: rendered.body,
      status: 'draft',
      linkedin_action_type: `ab:${abVariant}`
    });
    console.log(`[Outreach] Draft saved (manual mode): "${rendered.subject}"`);
    return true;
  }

  const result = await email.sendEmail({ from: fromEmail, to: prospect.email, subject: rendered.subject, body: rendered.body });

  await crm.logMessage({
    prospect_id: prospect.id,
    sequence_id: step.sequence_id,
    step: step.step_number,
    channel: 'email',
    subject: rendered.subject,
    body: rendered.body,
    status: result.success ? 'sent' : 'failed',
    linkedin_action_type: `provider:${result.provider} | ab:${abVariant}`
  });

  await crm.logActivity({
    prospect_id: prospect.id,
    action: `email_step_${step.step_number}`,
    channel: 'email',
    outcome: result.success ? 'success' : 'failed',
    notes: `Subject: ${rendered.subject}`,
    error: result.error || ''
  });

  if (result.success) await crm.updateProspect(prospect.id, { status: 'active' });
  return result.success;
}

// ─── LinkedIn step ────────────────────────────────────────────────────────────

async function executeLinkedInStep(prospect, step, previousMessages, settings) {
  if (!prospect.linkedin_url) {
    console.warn(`[Outreach] No LinkedIn URL for ${prospect.first_name} — skipping`);
    return false;
  }

  let content = null;

  if (step.channel === 'linkedin_connect') {
    content = templating.renderLinkedInConnect({ prospect, brand: prospect.brand, settings });
  } else if (step.channel === 'linkedin_message') {
    const rendered = templating.renderLinkedInMessage({ prospect, brand: prospect.brand, stepNumber: step.step_number, settings });
    content = rendered?.body || null;
  }

  const actionMap = {
    'linkedin_view': 'view',
    'linkedin_like': 'like',
    'linkedin_connect': 'connect',
    'linkedin_message': 'message'
  };

  const manualMode = settings.MANUAL_APPROVAL_MODE === 'true' || process.env.MANUAL_APPROVAL_MODE === 'true';

  if (manualMode && content) {
    await crm.logMessage({
      prospect_id: prospect.id,
      sequence_id: step.sequence_id,
      step: step.step_number,
      channel: step.channel,
      body: content,
      status: 'draft',
      linkedin_action_type: step.channel
    });
    console.log(`[Outreach] LinkedIn draft saved: step ${step.step_number}`);
    return true;
  }

  const result = await linkedin.executeLinkedInAction({
    prospect,
    action: actionMap[step.channel] || step.channel,
    content
  });

  if (content) {
    await crm.logMessage({
      prospect_id: prospect.id,
      sequence_id: step.sequence_id,
      step: step.step_number,
      channel: step.channel,
      body: content,
      status: result.success ? 'sent' : 'failed',
      linkedin_action_type: step.channel
    });
  }

  return result.success;
}

// ─── Main runner ──────────────────────────────────────────────────────────────

async function runOutreachQueue(options = {}) {
  const settings = await crm.getSettings();
  const results = { processed: 0, sent: 0, failed: 0, skipped: 0 };

  const prospects = await crm.getProspects({ brand: options.brand, status: ['queued', 'active'] });
  const toProcess = options.maxProspects ? prospects.slice(0, options.maxProspects) : prospects;

  console.log(`[Outreach] Processing ${toProcess.length} prospects`);

  for (const prospect of toProcess) {
    if (isSequencePaused(prospect)) { results.skipped++; continue; }
    results.processed++;

    try {
      const previousMessages = await crm.getMessagesForProspect(prospect.id);
      const brandSequences = sequences[prospect.brand] || [];
      const sentStepKeys = new Set(previousMessages.map(m => `${m.channel}-${m.step}`));

      for (const step of brandSequences) {
        if (sentStepKeys.has(`${step.channel}-${step.step_number}`)) continue;
        if (!step.active) continue;
        if (!isStepDue(prospect, step)) continue;

        console.log(`[Outreach] ${prospect.first_name} ${prospect.last_name} → ${step.channel} step ${step.step_number}`);

        let success = false;
        if (step.channel === 'email') {
          if (!prospect.email) { console.warn(`[Outreach] No email — skipping`); results.skipped++; break; }
          success = await executeEmailStep(prospect, step, previousMessages, settings);
        } else if (step.channel.startsWith('linkedin')) {
          success = await executeLinkedInStep(prospect, step, previousMessages, settings);
        }

        if (success) results.sent++; else results.failed++;
        break; // One step per prospect per run
      }
    } catch (err) {
      console.error(`[Outreach] Error for ${prospect.id}:`, err.message);
      await crm.logActivity({ prospect_id: prospect.id, action: 'outreach_error', channel: 'system', outcome: 'failed', error: err.message });
      results.failed++;
    }
  }

  console.log('[Outreach] Done:', results);
  return results;
}

module.exports = { runOutreachQueue, executeEmailStep, executeLinkedInStep };
