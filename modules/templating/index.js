/**
 * @module templating
 * @description Template engine for all outreach copy.
 * Replaces AI generation with editable templates from config/templates.json.
 *
 * Variables use {{double_curly}} syntax. Available in all templates:
 *   {{first_name}}, {{last_name}}, {{company}}, {{title}},
 *   {{industry}}, {{location}}, {{website}},
 *   {{sender_name}}, {{sender_company}}, {{sender_website}}, {{calendly_url}}
 *
 * To edit templates: open config/templates.json or use the dashboard Template Editor.
 * Changes take effect immediately — no restart needed.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const TEMPLATES_PATH = path.join(__dirname, '../../config/templates.json');

// ─── Load templates ───────────────────────────────────────────────────────────

/**
 * Loads templates fresh from disk on every call so edits take effect immediately.
 * @returns {Object}
 */
function loadTemplates() {
  try {
    const raw = fs.readFileSync(TEMPLATES_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`Could not load templates.json: ${err.message}`);
  }
}

/**
 * Saves updated templates back to disk.
 * Called from the dashboard template editor API.
 * @param {Object} templates
 */
function saveTemplates(templates) {
  fs.writeFileSync(TEMPLATES_PATH, JSON.stringify(templates, null, 2), 'utf-8');
}

// ─── Variable substitution ────────────────────────────────────────────────────

/**
 * Substitutes {{variable}} placeholders in a template string.
 * Leaves unmatched placeholders as-is so you can see what's missing.
 *
 * @param {string} template - Template string with {{variable}} placeholders
 * @param {Object} vars - Key-value pairs to substitute
 * @returns {string}
 */
function render(template, vars) {
  if (!template) return '';
  return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return vars[key] !== undefined ? vars[key] : match; // Leave unresolved vars visible
  });
}

/**
 * Builds the standard variable map for a prospect + brand combination.
 * Merges prospect fields with brand config and system settings.
 *
 * @param {Object} prospect - CRM prospect record
 * @param {string} brand - 'optimai' | 'nudge'
 * @param {Object} [settings] - Settings from CRM (for calendly_url etc)
 * @returns {Object} Variable map
 */
function buildVars(prospect, brand, settings = {}) {
  const templates = loadTemplates();
  const brandConfig = templates[brand] || {};

  return {
    first_name: prospect.first_name || '',
    last_name: prospect.last_name || '',
    company: prospect.company || '',
    title: prospect.title || '',
    industry: prospect.industry || '',
    location: prospect.location || '',
    website: prospect.website || '',
    sender_name: brandConfig.sender_name || 'Harrison',
    sender_company: brandConfig.brand_name || brand,
    sender_website: brandConfig.sender_website || '',
    calendly_url: settings.CALENDLY_URL || process.env.CALENDLY_URL || '[calendly link]'
  };
}

// ─── Email rendering ──────────────────────────────────────────────────────────

/**
 * Renders an outreach email for a given sequence step and prospect.
 * Returns both A and B subject variants — caller picks one based on A/B logic.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {number} params.stepNumber
 * @param {string} [params.abVariant] - 'A' or 'B'
 * @param {Object} [params.settings]
 * @returns {{ subject: string, body: string, stepConfig: Object } | null}
 */
function renderEmailStep(params) {
  const { prospect, brand, stepNumber, abVariant = 'A', settings = {} } = params;
  const templates = loadTemplates();
  const brandTemplates = templates[brand];
  if (!brandTemplates) return null;

  const step = brandTemplates.email_sequences?.find(s => s.step_number === stepNumber);
  if (!step) return null;

  const vars = buildVars(prospect, brand, settings);

  // Pick subject variant
  const subjects = Array.isArray(step.subject) ? step.subject : [step.subject];
  const subject = render(abVariant === 'B' && subjects[1] ? subjects[1] : subjects[0], vars);
  const body = render(step.body, vars);

  return { subject, body, stepConfig: step };
}

/**
 * Renders a nurture email for a given track.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {string} params.track - 'not_now' | 'warm' | 'reactivation' | 'breakup'
 * @param {Object} [params.settings]
 * @returns {{ subject: string, body: string } | null}
 */
function renderNurtureEmail(params) {
  const { prospect, brand, track, settings = {} } = params;
  const templates = loadTemplates();
  const nurtureTemplates = templates[brand]?.nurture_emails;
  if (!nurtureTemplates?.[track]) return null;

  const vars = buildVars(prospect, brand, settings);
  return {
    subject: render(nurtureTemplates[track].subject, vars),
    body: render(nurtureTemplates[track].body, vars)
  };
}

// ─── LinkedIn rendering ───────────────────────────────────────────────────────

/**
 * Renders a LinkedIn connection request note.
 * Hard-truncated to 300 chars (LinkedIn limit).
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {Object} [params.settings]
 * @returns {string}
 */
function renderLinkedInConnect(params) {
  const { prospect, brand, settings = {} } = params;
  const templates = loadTemplates();
  const note = templates[brand]?.linkedin_connect_note || 'Hi {{first_name}}, would love to connect.';
  const vars = buildVars(prospect, brand, settings);
  const rendered = render(note, vars);
  return rendered.length > 300 ? rendered.substring(0, 297) + '...' : rendered;
}

/**
 * Renders a LinkedIn DM for a given step number.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {number} params.stepNumber
 * @param {Object} [params.settings]
 * @returns {{ body: string, stepConfig: Object } | null}
 */
function renderLinkedInMessage(params) {
  const { prospect, brand, stepNumber, settings = {} } = params;
  const templates = loadTemplates();
  const msgs = templates[brand]?.linkedin_messages || [];
  const step = msgs.find(s => s.step_number === stepNumber);
  if (!step) return null;

  const vars = buildVars(prospect, brand, settings);
  return { body: render(step.body, vars), stepConfig: step };
}

/**
 * Renders a reply template.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.brand
 * @param {string} params.templateKey - e.g. 'positive_booking', 'question_generic'
 * @param {Object} [params.settings]
 * @returns {string | null}
 */
function renderReplyTemplate(params) {
  const { prospect, brand, templateKey, settings = {} } = params;
  const templates = loadTemplates();
  const replyTemplates = templates[brand]?.reply_templates || {};
  if (!replyTemplates[templateKey]) return null;

  const vars = buildVars(prospect, brand, settings);
  return render(replyTemplates[templateKey], vars);
}

// ─── Template editor helpers (used by dashboard API) ─────────────────────────

/**
 * Gets a flat list of all templates for the editor UI.
 * Returns them grouped by brand and type.
 *
 * @returns {Object}
 */
function getAllTemplates() {
  return loadTemplates();
}

/**
 * Updates a specific template path and saves.
 * path is dot-notation: e.g. 'optimai.email_sequences.0.body'
 *
 * @param {string} dotPath - e.g. 'optimai.email_sequences.0.body'
 * @param {string} value - New value
 */
function updateTemplate(dotPath, value) {
  const templates = loadTemplates();
  const parts = dotPath.split('.');
  let obj = templates;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = isNaN(parts[i]) ? parts[i] : parseInt(parts[i]);
    obj = obj[key];
    if (!obj) throw new Error(`Invalid template path: ${dotPath}`);
  }
  const lastKey = isNaN(parts[parts.length - 1]) ? parts[parts.length - 1] : parseInt(parts[parts.length - 1]);
  obj[lastKey] = value;
  saveTemplates(templates);
}

/**
 * Returns a preview of a rendered template with sample data.
 * Used by the dashboard preview button.
 *
 * @param {string} dotPath - Path to the template body/subject
 * @param {string} brand
 * @param {Object} [sampleProspect]
 * @returns {string}
 */
function previewTemplate(dotPath, brand, sampleProspect = {}) {
  const templates = loadTemplates();
  const parts = dotPath.split('.');
  let value = templates;
  for (const part of parts) {
    value = value[isNaN(part) ? part : parseInt(part)];
    if (value === undefined) return '[Template not found]';
  }

  const sample = {
    first_name: sampleProspect.first_name || 'Alex',
    last_name: sampleProspect.last_name || 'Chen',
    company: sampleProspect.company || 'Acme Co',
    title: sampleProspect.title || 'CEO',
    industry: sampleProspect.industry || 'SaaS',
    location: sampleProspect.location || 'Melbourne',
    website: sampleProspect.website || 'acme.com'
  };

  const vars = buildVars(sample, brand, { CALENDLY_URL: 'calendly.com/your-link' });
  const templateStr = Array.isArray(value) ? value[0] : value;
  return render(String(templateStr), vars);
}

module.exports = {
  render,
  buildVars,
  renderEmailStep,
  renderNurtureEmail,
  renderLinkedInConnect,
  renderLinkedInMessage,
  renderReplyTemplate,
  getAllTemplates,
  updateTemplate,
  previewTemplate,
  loadTemplates,
  saveTemplates
};
