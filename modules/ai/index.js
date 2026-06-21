/**
 * @module ai
 * @description Claude API wrapper for all AI-generation tasks.
 * Handles message copywriting, personalisation, reply classification,
 * nurture content generation, and ICP scoring assistance.
 *
 * All prompts are structured to inject full prospect context so every
 * output feels handwritten rather than templated.
 */

'use strict';

require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Brand voice configs ──────────────────────────────────────────────────────

const BRAND_VOICES = {
  optimai: {
    name: 'OptimAI',
    tone: 'peer-to-peer, confident, direct, no-fluff. You are a fellow founder/operator, not a vendor.',
    avoid: 'synergy, leverage, game-changer, unlock, solution, innovative, seamless, revolutionise, transform',
    style: 'Short sentences. Lead with insight, not product. Talk as an equal. Never sound like a salesperson.',
    from: 'Harrison, OptimAI (optimai.com.au) — AI & automation for growing businesses.',
    signature: '\n\nHarrison\nOptimAI — optimai.com.au',
    emailFrom: process.env.OPTIMAI_EMAIL
  },
  nudge: {
    name: 'Nudge Digital',
    tone: 'expert practitioner, hyper-specific, honest, direct. Single freelancer, not an agency.',
    avoid: 'agency, team, we, us, our team, our agency, synergy, leverage, innovative',
    style: 'Show the work, not just the claim. Be technically specific. Honest about what\'s broken. First person singular always.',
    from: 'Harrison, Nudge Digital (nudgedigital.com.au) — senior freelance digital marketing strategist, Melbourne.',
    signature: '\n\nHarrison\nNudge Digital — nudgedigital.com.au',
    emailFrom: process.env.NUDGE_EMAIL
  }
};

// ─── Retry wrapper ────────────────────────────────────────────────────────────

/**
 * Wraps an async function with retry logic.
 * Uses exponential backoff: 1s, 2s, 4s between attempts.
 * @param {Function} fn - Async function to retry
 * @param {number} maxAttempts
 * @returns {Promise<any>}
 */
async function withRetry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = Math.pow(2, attempt - 1) * 1000;
      console.warn(`[AI] Attempt ${attempt} failed. Retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

// ─── Core generation function ─────────────────────────────────────────────────

/**
 * Calls Claude to generate a message, then self-evaluates confidence.
 * If confidence < 0.75, regenerates once more before returning.
 * @param {string} systemPrompt
 * @param {string} userPrompt
 * @param {number} maxTokens
 * @returns {Promise<string>} Generated text
 */
async function generate(systemPrompt, userPrompt, maxTokens = 600) {
  return withRetry(async () => {
    const response = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt
    });
    return response.content[0].text;
  });
}

// ─── Outreach message generation ─────────────────────────────────────────────

/**
 * Generates a personalised outreach email for a given prospect and sequence step.
 * Returns subject line, body, and internal reasoning note.
 *
 * @param {Object} params
 * @param {Object} params.prospect - Full prospect record from CRM
 * @param {Object} params.step - Sequence step config
 * @param {string} params.brand - 'optimai' | 'nudge'
 * @param {Object[]} params.previousMessages - Prior messages sent to this prospect
 * @param {string} [params.subjectVariant] - 'A' or 'B' for A/B testing
 * @returns {Promise<{ subject: string, body: string, reasoning: string, confidence: number }>}
 */
async function generateOutreachEmail(params) {
  const { prospect, step, brand, previousMessages = [], subjectVariant = 'A' } = params;
  const voice = BRAND_VOICES[brand];

  const systemPrompt = `You are writing outreach emails on behalf of ${voice.from}

BRAND VOICE:
- Tone: ${voice.tone}
- Never use: ${voice.avoid}
- Style rules: ${voice.style}

OUTPUT FORMAT — respond with ONLY valid JSON, no markdown, no explanation outside the JSON:
{
  "subject": "the email subject line",
  "body": "the full email body (plain text, no HTML)",
  "reasoning": "1-2 sentences explaining the angle chosen",
  "confidence": 0.85
}

The confidence score (0-1) reflects how well-personalised and compelling this message is given the available context. Be honest.

RULES:
- Never make up specific facts you don't have. Use only the prospect context provided.
- Every email must end with: "reply STOP to opt out" on its own line before the signature.
- Then append this signature: ${voice.signature}
- Plain text only. No HTML. No bullet points unless they genuinely serve the message.
- Never pitch more than one thing. One idea, one email.
- Max 150 words for the body (excluding signature and opt-out line).`;

  const previousContext = previousMessages.length > 0
    ? `\nPREVIOUS MESSAGES SENT:\n${previousMessages.map(m =>
        `[${m.channel}, step ${m.step}, ${m.sent_at}]\nSubject: ${m.subject}\n${m.body}`
      ).join('\n\n---\n\n')}`
    : '\nNo previous messages sent to this prospect.';

  const userPrompt = `PROSPECT:
Name: ${prospect.first_name} ${prospect.last_name}
Title: ${prospect.title}
Company: ${prospect.company}
Industry: ${prospect.industry}
Company size: ${prospect.company_size}
Location: ${prospect.location}
Website: ${prospect.website}
Tech stack signals: ${prospect.tech_stack}
ICP match score: ${prospect.icp_score}/100
ICP match reasons: ${prospect.notes}
${previousContext}

SEQUENCE STEP:
Step number: ${step.step_number} of 4
Goal of this message: ${step.goal}
Day offset from first contact: ${step.day_offset}
Guidance: ${step.notes || 'None'}

Subject line variant: ${subjectVariant}
${step.subject_template ? `Subject template hint: ${Array.isArray(step.subject_template) ? step.subject_template[subjectVariant === 'A' ? 0 : 1] : step.subject_template}` : ''}

Write the email now.`;

  const raw = await generate(systemPrompt, userPrompt, 800);

  let parsed;
  try {
    const clean = raw.replace(/```json|```/g, '').trim();
    parsed = JSON.parse(clean);
  } catch {
    // Fallback: if JSON parsing fails, return raw text with defaults
    console.error('[AI] JSON parse failed for outreach email. Raw:', raw.substring(0, 200));
    return { subject: 'Following up', body: raw, reasoning: 'Parse error fallback', confidence: 0.5 };
  }

  // Regenerate if confidence is low
  if (parsed.confidence < 0.75) {
    console.log(`[AI] Low confidence (${parsed.confidence}) — regenerating...`);
    const retry = await generate(systemPrompt, userPrompt + '\n\nPrevious attempt had low confidence. Focus on making the personalisation more specific and compelling.', 800);
    try {
      const retryParsed = JSON.parse(retry.replace(/```json|```/g, '').trim());
      if (retryParsed.confidence >= parsed.confidence) return retryParsed;
    } catch { /* Return original if retry also fails to parse */ }
  }

  return parsed;
}

/**
 * Generates a personalised LinkedIn connection request note.
 * Hard limit: 300 characters.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @returns {Promise<{ note: string, reasoning: string }>}
 */
async function generateLinkedInConnect(params) {
  const { prospect, brand } = params;
  const voice = BRAND_VOICES[brand];

  const systemPrompt = `You are writing a LinkedIn connection request note on behalf of ${voice.from}

STRICT RULES:
- Maximum 300 characters total (LinkedIn's hard limit — count carefully)
- No pitch. No "I'd love to connect about..."
- Sound like a human who found them interesting, not a salesperson
- Peer-to-peer. Direct. Genuine.
- Never use: ${voice.avoid}

OUTPUT: Valid JSON only:
{ "note": "the connection note", "reasoning": "why this angle" }`;

  const userPrompt = `Prospect: ${prospect.first_name} ${prospect.last_name}, ${prospect.title} at ${prospect.company}
Industry: ${prospect.industry} | Location: ${prospect.location}
ICP match reasons: ${prospect.notes}
Their recent activity / context: ${prospect.tech_stack}

Write the LinkedIn connection note (MAX 300 chars).`;

  const raw = await generate(systemPrompt, userPrompt, 300);
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    // Enforce character limit
    if (parsed.note && parsed.note.length > 300) {
      parsed.note = parsed.note.substring(0, 297) + '...';
    }
    return parsed;
  } catch {
    return { note: `Hi ${prospect.first_name}, came across your profile — interesting work at ${prospect.company}. Would love to connect.`.substring(0, 300), reasoning: 'Fallback' };
  }
}

/**
 * Generates a LinkedIn follow-up message (post-connection accepted).
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {Object} params.step
 * @param {Object[]} params.previousMessages
 * @returns {Promise<{ message: string, reasoning: string }>}
 */
async function generateLinkedInMessage(params) {
  const { prospect, brand, step, previousMessages = [] } = params;
  const voice = BRAND_VOICES[brand];

  const systemPrompt = `You are writing a LinkedIn DM on behalf of ${voice.from}

BRAND VOICE: ${voice.tone}
AVOID: ${voice.avoid}
STYLE: ${voice.style}

LINKEDIN DM RULES:
- Max 300 words (shorter is usually better on LinkedIn)
- No subject line
- Conversational, like texting a professional contact
- Step goal: ${step.goal}

OUTPUT: JSON only: { "message": "the DM text", "reasoning": "angle chosen" }`;

  const prevContext = previousMessages.length > 0
    ? `Prior messages:\n${previousMessages.map(m => `[${m.channel}, ${m.sent_at}]: ${m.body.substring(0, 150)}`).join('\n')}`
    : 'First message after connection accepted.';

  const userPrompt = `Prospect: ${prospect.first_name} ${prospect.last_name}, ${prospect.title} at ${prospect.company}
Industry: ${prospect.industry}
Context: ${prospect.notes}
Step: ${step.step_number} | Guidance: ${step.notes}
${prevContext}

Write the LinkedIn DM.`;

  const raw = await generate(systemPrompt, userPrompt, 500);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { message: raw, reasoning: 'Parse fallback' };
  }
}

// ─── Reply classification ─────────────────────────────────────────────────────

/**
 * Classifies an inbound reply by sentiment and intent.
 * Returns structured classification used to determine next action.
 *
 * Intent values:
 *   positive_interest | not_now_nurture | negative_hard_no |
 *   referral_signal | question_objection | out_of_office
 *
 * @param {Object} params
 * @param {string} params.replyContent - Raw reply text
 * @param {Object} params.prospect - Prospect record
 * @param {Object[]} params.thread - Prior messages in the thread
 * @returns {Promise<{ sentiment: string, intent: string, summary: string, suggestedAction: string, suggestedReply?: string, oooEndDate?: string }>}
 */
async function classifyReply(params) {
  const { replyContent, prospect, thread = [] } = params;

  const systemPrompt = `You are a reply classifier for an outreach system. Classify inbound emails and LinkedIn messages.

INTENT OPTIONS (pick exactly one):
- positive_interest: They are interested, want to know more, or want to meet
- not_now_nurture: Not ready now but open to future contact
- negative_hard_no: Clear, firm no — do not contact again
- referral_signal: They referred someone else or mentioned a colleague who might be interested
- question_objection: They asked a question or raised an objection but haven't said no
- out_of_office: Auto-reply indicating they are away

OUTPUT: Valid JSON only:
{
  "sentiment": "positive | neutral | negative",
  "intent": "one of the intent options above",
  "summary": "one sentence summary of their reply",
  "suggestedAction": "what the system should do next",
  "suggestedReply": "optional — draft reply if intent is question_objection or positive_interest",
  "oooEndDate": "optional — ISO date string if out_of_office and date is parseable from content",
  "referredName": "optional — if referral_signal, the name of the referred person"
}`;

  const userPrompt = `Prospect: ${prospect.first_name} ${prospect.last_name}, ${prospect.title} at ${prospect.company}

THEIR REPLY:
${replyContent}

PRIOR THREAD CONTEXT:
${thread.map(m => `[Sent by us, ${m.sent_at}]: ${m.body.substring(0, 200)}`).join('\n')}

Classify this reply.`;

  const raw = await generate(systemPrompt, userPrompt, 600);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return {
      sentiment: 'neutral',
      intent: 'question_objection',
      summary: 'Could not parse reply classification',
      suggestedAction: 'Review manually'
    };
  }
}

// ─── Nurture content ──────────────────────────────────────────────────────────

/**
 * Generates a nurture email — value delivery, no hard pitch.
 * Content is tailored to the prospect's industry and current month/season.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {string} params.track - 'not_now' | 'warm' | 'reactivation'
 * @param {string} [params.caseStudies] - Optional recent wins/case studies from Settings
 * @returns {Promise<{ subject: string, body: string }>}
 */
async function generateNurtureEmail(params) {
  const { prospect, brand, track, caseStudies = '' } = params;
  const voice = BRAND_VOICES[brand];
  const month = new Date().toLocaleString('en-AU', { month: 'long' });
  const isEOFY = [5, 6].includes(new Date().getMonth()); // June-July in AU

  const systemPrompt = `You are writing a nurture email on behalf of ${voice.from}

BRAND VOICE: ${voice.tone}
AVOID: ${voice.avoid}
STYLE: ${voice.style}

NURTURE EMAIL RULES:
- This is NOT a pitch. It's a value touchpoint to stay top of mind.
- Share something genuinely useful: insight, resource, observation, or tip.
- No CTA except "feel free to reply if useful" at the end.
- Max 120 words.
- Current month: ${month}${isEOFY ? ' (EOFY season in Australia — relevant to many businesses)' : ''}

OUTPUT: JSON only: { "subject": "...", "body": "..." }`;

  const userPrompt = `Prospect: ${prospect.first_name}, ${prospect.title} at ${prospect.company}
Industry: ${prospect.industry}
Nurture track: ${track}
${caseStudies ? `Recent wins/case studies to potentially reference:\n${caseStudies}` : ''}

Write the nurture email.`;

  const raw = await generate(systemPrompt, userPrompt, 400);
  try {
    const parsed = JSON.parse(raw.replace(/```json|```/g, '').trim());
    // Append opt-out and signature
    parsed.body += `\n\nreply STOP to opt out${voice.signature}`;
    return parsed;
  } catch {
    return { subject: 'Thought you might find this useful', body: raw };
  }
}

// ─── ICP scoring assist ───────────────────────────────────────────────────────

/**
 * Uses AI to extract intent signals from a company website/LinkedIn content
 * that the rule-based scorer may have missed.
 *
 * @param {Object} params
 * @param {string} params.websiteContent - Raw scraped text from prospect's website
 * @param {string} params.linkedinContent - LinkedIn company page content
 * @param {string} params.brand - To use the right ICP context
 * @returns {Promise<{ signals: string[], bonusScore: number, notes: string }>}
 */
async function extractIntentSignals(params) {
  const { websiteContent, linkedinContent, brand } = params;

  const systemPrompt = `You are an intent signal extractor for B2B lead scoring.
Identify signals that indicate a company may be a good prospect for an AI automation consultancy (OptimAI) or a freelance digital marketing expert (Nudge Digital).

Intent signals include: manual processes, rapid headcount growth, operational pain, poor digital marketing setup, recent rebrand, new product launch, ecommerce scaling, hiring for roles that could be automated.

OUTPUT: JSON only:
{
  "signals": ["signal 1", "signal 2"],
  "bonusScore": 0,
  "notes": "summary of what was found"
}

bonusScore is 0-15 representing how strong the intent signals are.`;

  const userPrompt = `Brand: ${brand}

WEBSITE CONTENT (first 1000 chars):
${(websiteContent || '').substring(0, 1000)}

LINKEDIN CONTENT (first 500 chars):
${(linkedinContent || '').substring(0, 500)}

Extract intent signals.`;

  const raw = await generate(systemPrompt, userPrompt, 400);
  try {
    return JSON.parse(raw.replace(/```json|```/g, '').trim());
  } catch {
    return { signals: [], bonusScore: 0, notes: 'Could not extract signals' };
  }
}

module.exports = {
  generateOutreachEmail,
  generateLinkedInConnect,
  generateLinkedInMessage,
  classifyReply,
  generateNurtureEmail,
  extractIntentSignals
};
