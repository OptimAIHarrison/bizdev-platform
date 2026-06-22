/**
 * @module scoring
 * @description ICP scoring engine.
 * Scores prospects 0–100 based on role, industry, company size,
 * geography, intent signals, and engagement signals.
 * Only prospects scoring 60+ proceed to the outreach queue.
 */

'use strict';

const icpConfig = require('../../config/icp.json');

/**
 * Normalises a string for loose matching (lowercase, trim).
 * @param {string} str
 * @returns {string}
 */
function normalise(str = '') {
  return str.toLowerCase().trim();
}

/**
 * Checks if any of the target keywords appear in the source string.
 * @param {string} source
 * @param {string[]} keywords
 * @returns {boolean}
 */
function matchesAny(source, keywords) {
  const s = normalise(source);
  return keywords.some(k => s.includes(normalise(k)));
}

/**
 * Scores a prospect against the ICP for a given brand.
 *
 * Scoring breakdown (max 100):
 *   Role match:          0–25 pts
 *   Industry match:      0–20 pts
 *   Company size match:  0–15 pts
 *   Geography match:     0–15 pts
 *   Intent signals:      0–15 pts (from rule-based + AI bonus)
 *   Engagement signals:  0–10 pts
 *
 * @param {Object} prospect - Enriched prospect data
 * @param {string} brand - 'optimai' | 'nudge'
 * @param {Object} [detectedSignals] - Optional result from signals.detectSignals()
 * @returns {{ score: number, breakdown: Object, notes: string[] }}
 */
function scoreProspect(prospect, brand, detectedSignals = null) {
  const icp = icpConfig[brand]?.icp;
  if (!icp) throw new Error(`Unknown brand: ${brand}`);

  const notes = [];
  const breakdown = {
    role: 0,
    industry: 0,
    companySize: 0,
    geography: 0,
    intent: 0,
    engagement: 0
  };

  // ── Role match (0–25) ────────────────────────────────────────────────────
  const titleStr = `${prospect.title || ''} ${prospect.role || ''}`;
  const roleMatches = icp.targetRoles.filter(r => matchesAny(titleStr, [r]));

  if (roleMatches.length > 0) {
    // Primary roles (founder, CEO, director) score higher
    const isPrimary = matchesAny(titleStr, ['founder', 'ceo', 'chief executive', 'owner', 'managing director', 'director']);
    breakdown.role = isPrimary ? 25 : 18;
    notes.push(`Role match: ${roleMatches.join(', ')}`);
  } else if (matchesAny(titleStr, ['manager', 'head of', 'vp', 'vice president'])) {
    breakdown.role = 10;
    notes.push('Partial role match: senior manager-level');
  }

  // ── Industry match (0–20) ────────────────────────────────────────────────
  const industryStr = `${prospect.industry || ''} ${prospect.company || ''}`;
  const industryMatches = icp.industries.filter(i => matchesAny(industryStr, [i]));

  if (industryMatches.length > 0) {
    breakdown.industry = Math.min(20, industryMatches.length * 10);
    notes.push(`Industry match: ${industryMatches.join(', ')}`);
  }

  // ── Company size match (0–15) ─────────────────────────────────────────────
  const sizeRaw = parseInt(prospect.company_size) || 0;

  if (sizeRaw >= icp.companySizeMin && sizeRaw <= icp.companySizeMax) {
    // Perfect fit
    breakdown.companySize = 15;
    notes.push(`Company size ${sizeRaw} is in ideal range (${icp.companySizeMin}–${icp.companySizeMax})`);
  } else if (sizeRaw > 0) {
    // Outside range but close
    const closeLow = icp.companySizeMin * 0.5;
    const closeHigh = icp.companySizeMax * 1.5;
    if (sizeRaw >= closeLow && sizeRaw <= closeHigh) {
      breakdown.companySize = 7;
      notes.push(`Company size ${sizeRaw} is near ideal range`);
    }
  } else {
    // Unknown size — give partial credit (can't disqualify unknowns)
    breakdown.companySize = 7;
    notes.push('Company size unknown — partial credit');
  }

  // ── Geography match (0–15) ───────────────────────────────────────────────
  const locationStr = `${prospect.location || ''} ${prospect.company || ''}`;

  if (matchesAny(locationStr, icp.geographyPrimary)) {
    breakdown.geography = 15;
    notes.push(`Primary geography match: ${icp.geographyPrimary.join('/')}`);
  } else if (matchesAny(locationStr, icp.geographySecondary)) {
    breakdown.geography = 8;
    notes.push(`Secondary geography match`);
  }

  // ── Intent signals (0–15) ────────────────────────────────────────────────
  const intentSource = [
    prospect.tech_stack || '',
    prospect.notes || '',
    prospect.website || ''
  ].join(' ');

  const matchedSignals = icp.intentSignals.filter(s => matchesAny(intentSource, [s]));
  const ruleBasedIntentScore = Math.min(10, matchedSignals.length * 3);

  if (matchedSignals.length > 0) {
    notes.push(`Intent signals: ${matchedSignals.join(', ')}`);
  }

  // Add bonus score from rule-based signal detection (0–5 from the 0–15 intent
  // range, capped to avoid over-weighting one source)
  const signalBonusScore = detectedSignals?.bonusScore ? Math.min(5, Math.round(detectedSignals.bonusScore / 3)) : 0;
  if (detectedSignals?.signals?.length > 0) {
    notes.push(`Signals: ${detectedSignals.signals.slice(0, 3).join(', ')}`);
  }

  breakdown.intent = Math.min(15, ruleBasedIntentScore + signalBonusScore);

  // ── Engagement signals (0–10) ────────────────────────────────────────────
  // These are set externally if LinkedIn scraping found engagement
  if (prospect.engagement_signals) {
    breakdown.engagement = Math.min(10, parseInt(prospect.engagement_signals) || 0);
    notes.push(`Engagement signals score: ${breakdown.engagement}`);
  }

  // ── Total ────────────────────────────────────────────────────────────────
  const score = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return {
    score: Math.min(100, score),
    breakdown,
    notes
  };
}

/**
 * Determines whether a prospect should proceed to the outreach queue.
 * @param {number} score
 * @param {string} brand
 * @returns {boolean}
 */
function meetsThreshold(score, brand) {
  const threshold = icpConfig[brand]?.icp?.minIcpScore ?? 60;
  return score >= threshold;
}

module.exports = { scoreProspect, meetsThreshold };
