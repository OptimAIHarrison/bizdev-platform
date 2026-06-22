/**
 * @module replies/classifier
 * @description Rule-based reply classification — no AI/LLM dependency.
 * Uses keyword and pattern matching against the reply text to determine
 * sentiment and intent, mirroring the categories the system already
 * acts on in modules/replies/index.js.
 *
 * This trades some nuance for being fully deterministic, free, and
 * instant — no API calls, no rate limits, no external dependency.
 * If/when an AI classifier is reintroduced, it can sit alongside this
 * as a secondary pass without changing the calling code's shape:
 * classifyReply() returns the same { sentiment, intent, summary,
 * suggestedAction, suggestedReply } shape either way.
 */

'use strict';

// ─── Keyword banks ──────────────────────────────────────────────────────────────
// Order matters: checked top to bottom, first match wins for intent.
// Keep phrases lowercase; matching is done against a lowercased reply body.

const PATTERNS = {
  // Hard opt-out — checked separately upstream via emailModule.isUnsubscribeRequest,
  // but kept here too in case classifyReply() is called directly.
  unsubscribe: [
    'unsubscribe', 'stop emailing', 'remove me', 'take me off', 'opt out', 'opt-out'
  ],

  // Out of office auto-replies
  outOfOffice: [
    'out of office', 'out of the office', 'ooo', 'on leave', 'annual leave',
    'currently away', 'on vacation', 'on holidays', 'back in office',
    'return to the office', 'auto-reply', 'automatic reply', 'i am currently out'
  ],

  // Clear positive interest / wants to talk
  positive: [
    'sounds good', 'sounds great', 'interested', "let's chat", 'lets chat',
    "let's talk", 'lets talk', "let's book", 'book a time', 'book a call',
    'happy to chat', 'happy to talk', 'keen to chat', 'keen to learn more',
    'tell me more', 'sounds interesting', 'works for me', "i'm in",
    'send me a link', 'send me the link', 'calendly', 'schedule a call',
    'available this week', 'free this week', 'yes please', 'sure, let',
    'would love to', "let's set up", 'lets set up', 'when works for you',
    'what times work'
  ],

  // Explicit hard no / negative
  negative: [
    'not interested', 'no thank you', 'no thanks', 'please remove',
    'not a fit', 'not relevant', 'we are all set', "we're all set",
    'already have a solution', 'already working with', 'not looking',
    "don't contact", 'do not contact', 'stop reaching out', 'please stop'
  ],

  // Soft no / not right now — keep nurturing
  notNow: [
    'not right now', 'not at the moment', 'maybe later', 'down the track',
    'circle back', 'touch base later', 'revisit this', 'not the right time',
    'too busy right now', 'check back in', 'follow up in', 'reach out again in',
    'next quarter', 'next year', 'in a few months', 'budget is tight',
    'no budget', "can't right now"
  ],

  // Referral signal — "not me, but try X"
  referral: [
    "not the right person", "i'm not the right person", 'wrong person',
    'better person to speak to', 'better contact', 'speak to', 'reach out to',
    'cc\'ing', 'cc-ing', 'looping in', 'introduce you to', 'forward this to',
    'try ', 'contact instead'
  ],

  // Question / objection — wants more info before deciding
  question: [
    '?', 'how much', 'what does it cost', 'pricing', 'how does it work',
    'can you explain', 'what is the process', 'how long does', 'what would',
    'curious about', 'wondering if', 'can you tell me'
  ]
};

// ─── Sentiment word banks ───────────────────────────────────────────────────────

const POSITIVE_WORDS = ['great', 'good', 'thanks', 'thank you', 'appreciate', 'love', 'awesome', 'perfect', 'happy', 'keen', 'interested'];
const NEGATIVE_WORDS = ['no', 'not', "don't", 'stop', 'annoyed', 'frustrated', 'unsubscribe', 'remove', 'never', 'angry'];

// ─── Helpers ─────────────────────────────────────────────────────────────────────

function containsAny(text, phrases) {
  return phrases.some(p => text.includes(p));
}

function countMatches(text, phrases) {
  return phrases.filter(p => text.includes(p)).length;
}

/**
 * Extracts an OOO return date if mentioned, using simple date patterns.
 * Best-effort only — returns null if nothing recognisable is found.
 * @param {string} text
 * @returns {string|null}
 */
function extractOoOReturnDate(text) {
  // Matches things like "back on Monday 6 July", "returning 12/07", "back 6th of July"
  const patterns = [
    /back (?:on|in|by)?\s*([a-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)/i,
    /return(?:ing)? (?:on|by)?\s*([a-z]+ \d{1,2}(?:st|nd|rd|th)?(?:,? \d{4})?)/i,
    /(\d{1,2}\/\d{1,2}\/\d{2,4})/
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Attempts to extract a referred person's name from a referral-type reply.
 * Best-effort regex — looks for capitalised name patterns near referral phrases.
 * @param {string} rawText - Original (non-lowercased) reply text
 * @returns {string|null}
 */
function extractReferredName(rawText) {
  // Look for patterns like "speak to John Smith" or "try Jane Doe instead"
  const patterns = [
    /(?:speak to|contact|reach out to|try|cc'?ing|cc-ing|looping in|introduce you to)\s+([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)/
  ];
  for (const pattern of patterns) {
    const match = rawText.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// ─── Main classifier ─────────────────────────────────────────────────────────────

/**
 * Classifies a reply using keyword/pattern matching — no AI call.
 * Mirrors the shape the old ai.classifyReply() returned so calling
 * code (modules/replies/index.js) doesn't need to change.
 *
 * @param {Object} params
 * @param {string} params.replyContent - Raw reply text
 * @param {Object} [params.prospect] - Prospect record (unused here, kept for API parity)
 * @param {Object[]} [params.thread] - Prior messages (unused here, kept for API parity)
 * @returns {{
 *   sentiment: 'positive'|'neutral'|'negative',
 *   intent: 'positive_interest'|'not_now_nurture'|'negative_hard_no'|'referral_signal'|'question_objection'|'out_of_office'|'unclassified',
 *   summary: string,
 *   suggestedAction: string,
 *   suggestedReply: string|null,
 *   oooEndDate: string|null,
 *   referredName: string|null
 * }}
 */
function classifyReply({ replyContent = '' }) {
  const text = replyContent.toLowerCase();
  const raw = replyContent;

  // Strip common quoted-thread markers so we're mostly classifying the new content
  const cleanText = text.split(/\non .* wrote:|\n>.*|\n-{2,}\s*original message/i)[0] || text;

  let intent = 'unclassified';
  let summary = '';
  let oooEndDate = null;
  let referredName = null;

  // 1. Out of office — usually has a very distinct signature, check first
  if (containsAny(cleanText, PATTERNS.outOfOffice)) {
    intent = 'out_of_office';
    oooEndDate = extractOoOReturnDate(raw);
    summary = oooEndDate
      ? `Automatic out-of-office reply — back ${oooEndDate}`
      : 'Automatic out-of-office reply';

  // 2. Unsubscribe — explicit opt-out
  } else if (containsAny(cleanText, PATTERNS.unsubscribe)) {
    intent = 'negative_hard_no';
    summary = 'Requested to unsubscribe / opt out';

  // 3. Hard no
  } else if (containsAny(cleanText, PATTERNS.negative)) {
    intent = 'negative_hard_no';
    summary = 'Clear negative response — not interested';

  // 4. Referral signal — wrong person, points elsewhere
  } else if (containsAny(cleanText, PATTERNS.referral)) {
    intent = 'referral_signal';
    referredName = extractReferredName(raw);
    summary = referredName
      ? `Referred to ${referredName} as a better contact`
      : 'Pointed to a different contact — check message for details';

  // 5. Positive interest — most actionable, weighted with a match-count check
  //    against "not now" to avoid misreading "interested but not right now"
  } else if (containsAny(cleanText, PATTERNS.positive) && !containsAny(cleanText, PATTERNS.notNow)) {
    intent = 'positive_interest';
    summary = 'Positive response — wants to talk further';

  // 6. Not now / soft no — nurture track
  } else if (containsAny(cleanText, PATTERNS.notNow)) {
    intent = 'not_now_nurture';
    summary = 'Not interested right now — candidate for nurture track';

  // 7. Question / objection — contains a question mark or question phrasing
  } else if (containsAny(cleanText, PATTERNS.question)) {
    intent = 'question_objection';
    summary = 'Asked a question or raised an objection';

  // 8. Fallback — couldn't confidently classify, route to founder for manual review
  } else {
    intent = 'question_objection';
    summary = 'Could not auto-classify — routed for manual review';
  }

  // ── Sentiment (independent of intent, word-count based) ───────────────────
  const posCount = countMatches(cleanText, POSITIVE_WORDS);
  const negCount = countMatches(cleanText, NEGATIVE_WORDS);
  let sentiment = 'neutral';
  if (posCount > negCount) sentiment = 'positive';
  else if (negCount > posCount) sentiment = 'negative';

  // Intent-based sentiment override for clearer signal
  if (intent === 'positive_interest') sentiment = 'positive';
  if (intent === 'negative_hard_no') sentiment = 'negative';

  // ── Suggested action / reply (mirrors what the AI version used to draft) ──
  const suggestedActionMap = {
    positive_interest: 'Send Calendly link to book a call',
    not_now_nurture: 'Move to nurture track — no immediate action needed',
    negative_hard_no: 'Mark as do-not-contact — no further outreach',
    referral_signal: 'Add referred contact to CRM and reach out separately',
    question_objection: 'Review their question and reply manually using a reply template',
    out_of_office: 'Wait for return date, then resume sequence',
    unclassified: 'Manual review required'
  };

  return {
    sentiment,
    intent,
    summary,
    suggestedAction: suggestedActionMap[intent] || 'Manual review required',
    suggestedReply: null, // Reply drafting now happens via the Templates editor, not auto-generated
    oooEndDate,
    referredName
  };
}

module.exports = { classifyReply };
