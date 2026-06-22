/**
 * @module prospecting/signals
 * @description Rule-based "buying signal" detection — no AI/LLM dependency.
 *
 * This is the system's equivalent of what tools like Gojiberry call
 * "intent signals": indicators that a prospect's company is in a state
 * where they're more likely to need (and respond to) outreach right now.
 * Gojiberry tracks 15+ signals (funding, hiring, job changes, competitor
 * engagement, event RSVPs). This module covers the subset that's
 * detectable from data we already scrape — website text, LinkedIn
 * engagement metadata, and basic company info — using keyword and
 * pattern matching instead of an LLM call.
 *
 * Returns the same shape the old ai.extractIntentSignals() did
 * ({ signals, bonusScore }), so scoring.js doesn't need to change.
 */

'use strict';

// ─── Signal keyword banks ────────────────────────────────────────────────────

// Hiring / growth signals — found in website text (careers pages, about pages)
const HIRING_KEYWORDS = [
  "we're hiring", 'we are hiring', 'join our team', 'open positions',
  'careers page', 'now hiring', "we're growing", 'we are growing',
  'expanding our team', 'new hires', 'join us'
];

// Tech-stack / automation-readiness signals — relevant for OptimAI specifically
const AUTOMATION_READINESS_KEYWORDS = [
  'manual process', 'spreadsheet', 'excel', 'still using', 'switching from',
  'looking for a better way', 'inefficient', 'time-consuming', 'bottleneck',
  'scaling challenges', 'growing pains'
];

// Marketing/digital readiness signals — relevant for Nudge Digital
const MARKETING_READINESS_KEYWORDS = [
  'rebrand', 'website redesign', 'new website', 'launching soon',
  'coming soon', 'under construction', 'new product launch',
  'expanding into', 'new market', 'seo', 'google ads', 'paid ads'
];

// Funding / growth-stage signals — found in about/news pages
const FUNDING_KEYWORDS = [
  'series a', 'series b', 'seed round', 'raised funding', 'secured funding',
  'investment round', 'venture capital', 'backed by'
];

// Recent activity signals — found in LinkedIn profile/post scraping
const RECENT_ACTIVITY_KEYWORDS = [
  'excited to announce', 'thrilled to share', 'new role', 'just started',
  'proud to', 'happy to share'
];

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function normalise(str = '') {
  return str.toLowerCase();
}

function findMatches(text, keywords) {
  const t = normalise(text);
  return keywords.filter(k => t.includes(k));
}

// ─── Main detection function ──────────────────────────────────────────────────

/**
 * Detects rule-based intent signals from an enriched prospect record.
 * Mirrors the { signals, bonusScore } shape the old AI version returned
 * so modules/prospecting/scoring.js doesn't need any changes.
 *
 * @param {Object} prospect - Enriched prospect (from enrichment.enrichProspect)
 * @param {string} [prospect._websiteRawText] - Raw scraped website text, if available
 * @param {string} [prospect.engagement_signals] - Set if sourced via signal monitoring (post likes/comments)
 * @param {string} [prospect.notes] - May contain comment text from signal scraping
 * @returns {{ signals: string[], bonusScore: number }}
 */
function detectSignals(prospect) {
  const foundSignals = [];
  let bonusScore = 0;

  const websiteText = prospect._websiteRawText || '';
  const combinedText = [websiteText, prospect.notes || '', prospect.tech_stack || ''].join(' ');

  // ── Hiring signals (strong positive — growing company, more budget likely) ──
  const hiringMatches = findMatches(combinedText, HIRING_KEYWORDS);
  if (hiringMatches.length > 0) {
    foundSignals.push(`Hiring activity detected (${hiringMatches[0]})`);
    bonusScore += 4;
  }

  // ── Automation readiness (OptimAI-relevant) ──────────────────────────────────
  const automationMatches = findMatches(combinedText, AUTOMATION_READINESS_KEYWORDS);
  if (automationMatches.length > 0) {
    foundSignals.push(`Automation readiness signal (${automationMatches[0]})`);
    bonusScore += 3;
  }

  // ── Marketing readiness (Nudge-relevant) ──────────────────────────────────────
  const marketingMatches = findMatches(combinedText, MARKETING_READINESS_KEYWORDS);
  if (marketingMatches.length > 0) {
    foundSignals.push(`Marketing/digital activity signal (${marketingMatches[0]})`);
    bonusScore += 3;
  }

  // ── Funding signals (strong positive — budget likely available) ──────────────
  const fundingMatches = findMatches(combinedText, FUNDING_KEYWORDS);
  if (fundingMatches.length > 0) {
    foundSignals.push(`Funding/growth-stage signal (${fundingMatches[0]})`);
    bonusScore += 5;
  }

  // ── Recent LinkedIn activity (job change, announcement) ───────────────────────
  const activityMatches = findMatches(combinedText, RECENT_ACTIVITY_KEYWORDS);
  if (activityMatches.length > 0) {
    foundSignals.push(`Recent activity/announcement (${activityMatches[0]})`);
    bonusScore += 2;
  }

  // ── Direct engagement signal — lead came from post like/comment monitoring ───
  // This is the strongest signal of all: they actively engaged with relevant
  // content, which is exactly the Gojiberry-style "already paying attention
  // to your market" trigger.
  if (prospect.engagement_signals) {
    const score = parseInt(prospect.engagement_signals) || 0;
    if (score > 0) {
      foundSignals.push('Sourced via LinkedIn post engagement — active in-market signal');
      bonusScore += Math.min(5, score);
    }
  }

  return {
    signals: foundSignals,
    bonusScore: Math.min(15, bonusScore)
  };
}

module.exports = { detectSignals };
