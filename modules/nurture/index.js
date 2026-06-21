/**
 * @module nurture
 * @description Nurture engine using editable templates (config/templates.json).
 * Tracks A (Not Now), B (Warm), C (Re-activation).
 * Run every Monday 9:15am AEST via GitHub Actions.
 */

'use strict';

require('dotenv').config();
const dayjs = require('dayjs');
const crm = require('../crm');
const templating = require('../templating');
const emailModule = require('../outreach/email');
const linkedinModule = require('../outreach/linkedin');

function getNurtureTrack(prospect) {
  const daysSince = dayjs().diff(dayjs(prospect.last_activity), 'day');
  if (daysSince >= 60 && prospect.status === 'active') return 'C';
  if (prospect.status === 'responded') return 'B';
  if (prospect.status === 'paused') return 'A';
  return null;
}

function isNurtureDue(prospect, track, touchpointType) {
  const daysSince = dayjs().diff(dayjs(prospect.last_activity), 'day');
  const cadence = {
    A: { email: 60, linkedin_like: 30 },
    B: { email: 30, linkedin_like: 7 },
    C: { email: 999, linkedin_like: 30 }
  };
  const required = cadence[track]?.[touchpointType];
  return required ? daysSince >= required : false;
}

async function sendNurtureEmail(prospect, track, settings) {
  const rendered = templating.renderNurtureEmail({ prospect, brand: prospect.brand, track, settings });
  if (!rendered) { console.warn(`[Nurture] No template for track ${track} (${prospect.brand})`); return; }

  const fromEmail = prospect.brand === 'optimai' ? process.env.OPTIMAI_EMAIL : process.env.NUDGE_EMAIL;
  await emailModule.sendEmail({ from: fromEmail, to: prospect.email, subject: rendered.subject, body: rendered.body });
  await crm.logMessage({ prospect_id: prospect.id, sequence_id: `nurture-${track}`, step: 1, channel: 'email', subject: rendered.subject, body: rendered.body, status: 'sent' });
  await crm.logActivity({ prospect_id: prospect.id, action: `nurture_email_${track}`, channel: 'email', outcome: 'success' });
}

async function processTrackA(prospect, settings) {
  if (isNurtureDue(prospect, 'A', 'linkedin_like') && prospect.linkedin_url) {
    await linkedinModule.executeLinkedInAction({ prospect, action: 'like' }).catch(e => console.warn('[Nurture] Like failed:', e.message));
  }
  if (isNurtureDue(prospect, 'A', 'email') && prospect.email) {
    await sendNurtureEmail(prospect, 'not_now', settings);
  }
  // Quarterly re-engagement
  const daysSince = dayjs().diff(dayjs(prospect.last_activity), 'day');
  if (daysSince >= 90 && prospect.email) {
    await sendNurtureEmail(prospect, 'reactivation', settings);
  }
}

async function processTrackB(prospect, settings) {
  if (isNurtureDue(prospect, 'B', 'linkedin_like') && prospect.linkedin_url) {
    await linkedinModule.executeLinkedInAction({ prospect, action: 'like' }).catch(e => console.warn('[Nurture] Like failed:', e.message));
  }
  if (isNurtureDue(prospect, 'B', 'email') && prospect.email) {
    await sendNurtureEmail(prospect, 'warm', settings);
  }
}

async function processTrackC(prospect, settings) {
  const messages = await crm.getMessagesForProspect(prospect.id);
  const sentBreakup = messages.some(m => m.sequence_id === 'nurture-C');

  if (!sentBreakup && prospect.email) {
    await sendNurtureEmail(prospect, 'breakup', settings);
    await crm.updateProspect(prospect.id, {
      status: 'paused',
      notes: `${prospect.notes || ''} | Break-up sent ${dayjs().format('YYYY-MM-DD')} — LinkedIn only`
    });
  }
  if (isNurtureDue(prospect, 'C', 'linkedin_like') && prospect.linkedin_url) {
    await linkedinModule.executeLinkedInAction({ prospect, action: 'like' }).catch(e => console.warn('[Nurture] Like failed:', e.message));
  }
}

async function runNurtureEngine() {
  console.log('[Nurture] Starting...');
  const settings = await crm.getSettings();
  const counts = { processed: 0, trackA: 0, trackB: 0, trackC: 0 };

  const prospects = await crm.getProspects({ status: ['paused', 'responded', 'active'] });

  for (const prospect of prospects) {
    const track = getNurtureTrack(prospect);
    if (!track) continue;
    counts.processed++;
    try {
      if (track === 'A') { await processTrackA(prospect, settings); counts.trackA++; }
      if (track === 'B') { await processTrackB(prospect, settings); counts.trackB++; }
      if (track === 'C') { await processTrackC(prospect, settings); counts.trackC++; }
    } catch (err) {
      console.error(`[Nurture] Error for ${prospect.id}:`, err.message);
      await crm.logActivity({ prospect_id: prospect.id, action: 'nurture_error', channel: 'system', outcome: 'failed', error: err.message });
    }
  }

  console.log('[Nurture] Done:', counts);
  return counts;
}

module.exports = { runNurtureEngine, getNurtureTrack };
