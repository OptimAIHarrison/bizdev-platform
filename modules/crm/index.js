/**
 * @module crm
 * @description Google Sheets CRM abstraction layer.
 * All reads and writes to the master data layer go through this module.
 * Sheets are treated as relational-lite tables: Prospects, Sequences,
 * Messages, Activity_Log, Settings, Replies_Inbox.
 *
 * Writes are batched where possible to avoid rate limits (100 req/100s).
 */

'use strict';

require('dotenv').config();
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');
const dayjs = require('dayjs');

// ─── Auth ────────────────────────────────────────────────────────────────────

/**
 * Creates an authenticated Google Sheets client using OAuth2.
 * Refresh token is used so access tokens are auto-renewed.
 * @returns {import('googleapis').sheets_v4.Sheets}
 */
function getSheetsClient() {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_OAUTH_CLIENT_ID,
    process.env.GOOGLE_OAUTH_CLIENT_SECRET
  );
  auth.setCredentials({ refresh_token: process.env.GOOGLE_OAUTH_REFRESH_TOKEN });
  return google.sheets({ version: 'v4', auth });
}

const SPREADSHEET_ID = process.env.GOOGLE_SHEETS_ID;

// ─── Schema ───────────────────────────────────────────────────────────────────

/**
 * Column definitions for each sheet tab.
 * Order matters — these become the actual column headers on first run.
 */
const SCHEMA = {
  Prospects: [
    'id', 'brand', 'first_name', 'last_name', 'title', 'company',
    'industry', 'company_size', 'location', 'linkedin_url', 'email',
    'email_verified', 'website', 'tech_stack', 'iq_score', 'icp_score',
    'source', 'status', 'assigned_sequence', 'date_added', 'last_activity', 'notes'
  ],
  Sequences: [
    'sequence_id', 'brand', 'step_number', 'channel', 'day_offset',
    'subject_template', 'message_template', 'ab_variant', 'active'
  ],
  Messages: [
    'message_id', 'prospect_id', 'sequence_id', 'step', 'channel',
    'sent_at', 'subject', 'body', 'status', 'opened', 'clicked',
    'replied', 'reply_content', 'linkedin_action_type'
  ],
  Activity_Log: [
    'timestamp', 'prospect_id', 'action', 'channel', 'outcome', 'notes', 'error'
  ],
  Settings: ['key', 'value', 'description'],
  Replies_Inbox: [
    'reply_id', 'prospect_id', 'channel', 'received_at', 'content',
    'sentiment', 'intent', 'action_required', 'handled'
  ]
};

// ─── Low-level helpers ───────────────────────────────────────────────────────

/**
 * Reads all rows from a sheet tab, returning an array of plain objects.
 * Row 1 is treated as headers; subsequent rows become object keys.
 * @param {string} sheetName - Tab name, e.g. 'Prospects'
 * @returns {Promise<Object[]>}
 */
async function readSheet(sheetName) {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A:ZZ`;

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
    const rows = res.data.values || [];
    if (rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map(row =>
      Object.fromEntries(headers.map((h, i) => [h, row[i] ?? '']))
    );
  } catch (err) {
    console.error(`[CRM] readSheet(${sheetName}) error:`, err.message);
    throw err;
  }
}

/**
 * Appends one or more rows to a sheet tab.
 * Rows are arrays of values matching the sheet's column order.
 * @param {string} sheetName
 * @param {Array[]} rows - Array of value arrays
 */
async function appendRows(sheetName, rows) {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A1`;

  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows }
    });
  } catch (err) {
    console.error(`[CRM] appendRows(${sheetName}) error:`, err.message);
    throw err;
  }
}

/**
 * Updates a single cell in a sheet by finding the matching row by ID field.
 * Uses batchUpdate for efficiency when multiple columns are updated.
 * @param {string} sheetName
 * @param {string} idField - Column name used to locate the row (e.g. 'id')
 * @param {string} idValue - Value to match
 * @param {Object} updates - { columnName: newValue }
 */
async function updateRow(sheetName, idField, idValue, updates) {
  const sheets = getSheetsClient();
  const range = `${sheetName}!A:ZZ`;

  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
    const rows = res.data.values || [];
    if (rows.length < 2) return;

    const headers = rows[0];
    const idColIndex = headers.indexOf(idField);
    if (idColIndex === -1) throw new Error(`Column "${idField}" not found in ${sheetName}`);

    const rowIndex = rows.findIndex((row, i) => i > 0 && row[idColIndex] === idValue);
    if (rowIndex === -1) return; // Row not found; skip silently

    // Build update requests for each changed column
    const data = Object.entries(updates).map(([col, val]) => {
      const colIndex = headers.indexOf(col);
      if (colIndex === -1) return null;
      // Sheets rows are 1-indexed, +1 for header row
      const cellRange = `${sheetName}!${columnLetter(colIndex + 1)}${rowIndex + 1}`;
      return { range: cellRange, values: [[val]] };
    }).filter(Boolean);

    if (data.length === 0) return;

    await sheets.spreadsheets.values.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: { valueInputOption: 'RAW', data }
    });
  } catch (err) {
    console.error(`[CRM] updateRow(${sheetName}) error:`, err.message);
    throw err;
  }
}

/**
 * Converts a 1-based column number to a spreadsheet letter (1=A, 27=AA, etc.)
 * @param {number} n
 * @returns {string}
 */
function columnLetter(n) {
  let result = '';
  while (n > 0) {
    const remainder = (n - 1) % 26;
    result = String.fromCharCode(65 + remainder) + result;
    n = Math.floor((n - 1) / 26);
  }
  return result;
}

// ─── Prospects ───────────────────────────────────────────────────────────────

/**
 * Inserts a new prospect into the Prospects sheet.
 * Assigns a UUID, sets status to 'new', records date_added.
 * @param {Object} data - Prospect fields
 * @returns {Promise<string>} The new prospect's id
 */
async function insertProspect(data) {
  const id = uuidv4();
  const now = dayjs().toISOString();
  const row = SCHEMA.Prospects.map(col => {
    if (col === 'id') return id;
    if (col === 'status') return data.status || 'new';
    if (col === 'date_added') return now;
    if (col === 'last_activity') return now;
    return data[col] ?? '';
  });
  await appendRows('Prospects', [row]);
  return id;
}

/**
 * Retrieves all prospects, optionally filtered by brand or status.
 * @param {{ brand?: string, status?: string|string[] }} filters
 * @returns {Promise<Object[]>}
 */
async function getProspects(filters = {}) {
  const all = await readSheet('Prospects');
  return all.filter(p => {
    if (filters.brand && p.brand !== filters.brand) return false;
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      if (!statuses.includes(p.status)) return false;
    }
    return true;
  });
}

/**
 * Gets a single prospect by id.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getProspectById(id) {
  const all = await readSheet('Prospects');
  return all.find(p => p.id === id) || null;
}

/**
 * Updates specific fields on a prospect record.
 * Also updates last_activity timestamp automatically.
 * @param {string} id
 * @param {Object} updates
 */
async function updateProspect(id, updates) {
  await updateRow('Prospects', 'id', id, {
    ...updates,
    last_activity: dayjs().toISOString()
  });
}

/**
 * Checks if a prospect already exists by LinkedIn URL or email.
 * Used for deduplication before insertion.
 * @param {string} linkedinUrl
 * @param {string} email
 * @returns {Promise<Object|null>} Existing record or null
 */
async function findDuplicate(linkedinUrl, email) {
  const all = await readSheet('Prospects');
  return all.find(p =>
    (linkedinUrl && p.linkedin_url === linkedinUrl) ||
    (email && p.email && p.email === email)
  ) || null;
}

// ─── Messages ────────────────────────────────────────────────────────────────

/**
 * Logs a sent message to the Messages sheet.
 * @param {Object} data - Message fields
 * @returns {Promise<string>} The new message_id
 */
async function logMessage(data) {
  const id = uuidv4();
  const row = SCHEMA.Messages.map(col => {
    if (col === 'message_id') return id;
    if (col === 'sent_at') return data.sent_at || dayjs().toISOString();
    if (col === 'status') return data.status || 'sent';
    if (col === 'opened') return data.opened || 'false';
    if (col === 'clicked') return data.clicked || 'false';
    if (col === 'replied') return data.replied || 'false';
    return data[col] ?? '';
  });
  await appendRows('Messages', [row]);
  return id;
}

/**
 * Gets all messages for a given prospect.
 * @param {string} prospectId
 * @returns {Promise<Object[]>}
 */
async function getMessagesForProspect(prospectId) {
  const all = await readSheet('Messages');
  return all.filter(m => m.prospect_id === prospectId);
}

// ─── Activity Log ─────────────────────────────────────────────────────────────

/**
 * Appends an entry to the Activity_Log sheet.
 * This is the audit trail for everything the system does.
 * @param {Object} entry
 * @param {string} entry.prospect_id
 * @param {string} entry.action - Human-readable description e.g. 'Sent email step 1'
 * @param {string} entry.channel - 'email' | 'linkedin' | 'system'
 * @param {string} [entry.outcome] - 'success' | 'failed' | 'skipped'
 * @param {string} [entry.notes]
 * @param {string} [entry.error]
 */
async function logActivity(entry) {
  const row = SCHEMA.Activity_Log.map(col => {
    if (col === 'timestamp') return dayjs().toISOString();
    return entry[col] ?? '';
  });
  // Fire-and-forget: don't let logging failures block main flow
  appendRows('Activity_Log', [row]).catch(err =>
    console.error('[CRM] logActivity error (non-fatal):', err.message)
  );
}

// ─── Replies ─────────────────────────────────────────────────────────────────

/**
 * Inserts a detected reply into the Replies_Inbox sheet.
 * @param {Object} data
 * @returns {Promise<string>} reply_id
 */
async function insertReply(data) {
  const id = uuidv4();
  const row = SCHEMA.Replies_Inbox.map(col => {
    if (col === 'reply_id') return id;
    if (col === 'received_at') return data.received_at || dayjs().toISOString();
    if (col === 'handled') return 'false';
    return data[col] ?? '';
  });
  await appendRows('Replies_Inbox', [row]);
  return id;
}

/**
 * Gets unhandled replies that require founder attention.
 * @returns {Promise<Object[]>}
 */
async function getUnhandledReplies() {
  const all = await readSheet('Replies_Inbox');
  return all.filter(r => r.handled !== 'true');
}

/**
 * Marks a reply as handled.
 * @param {string} replyId
 */
async function markReplyHandled(replyId) {
  await updateRow('Replies_Inbox', 'reply_id', replyId, { handled: 'true' });
}

// ─── Settings ────────────────────────────────────────────────────────────────

/**
 * Reads all settings into a plain key-value object.
 * @returns {Promise<Object>}
 */
async function getSettings() {
  const rows = await readSheet('Settings');
  return Object.fromEntries(rows.map(r => [r.key, r.value]));
}

/**
 * Updates (or inserts) a setting value.
 * Checks for existing key first to avoid duplicates.
 * @param {string} key
 * @param {string} value
 */
async function setSetting(key, value) {
  const sheets = getSheetsClient();
  const range = 'Settings!A:C';
  const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range });
  const rows = res.data.values || [];
  const headers = rows[0] || [];
  const keyIndex = headers.indexOf('key');

  const rowIndex = rows.findIndex((row, i) => i > 0 && row[keyIndex] === key);
  if (rowIndex > 0) {
    // Update existing row
    await updateRow('Settings', 'key', key, { value });
  } else {
    // Insert new row
    await appendRows('Settings', [[key, value, '']]);
  }
}

// ─── Setup ───────────────────────────────────────────────────────────────────

/**
 * Creates all required sheet tabs with correct headers if they don't exist.
 * Safe to run multiple times — won't overwrite existing data.
 * @returns {Promise<{ created: string[], skipped: string[] }>}
 */
async function initializeSheets() {
  const sheets = getSheetsClient();

  // Get existing sheet names
  const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const existingNames = meta.data.sheets.map(s => s.properties.title);

  const created = [];
  const skipped = [];

  for (const [sheetName, headers] of Object.entries(SCHEMA)) {
    if (existingNames.includes(sheetName)) {
      skipped.push(sheetName);
      continue;
    }

    // Add the sheet tab
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [{ addSheet: { properties: { title: sheetName } } }]
      }
    });

    // Write headers to row 1
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [headers] }
    });

    created.push(sheetName);
    console.log(`[CRM] Created sheet: ${sheetName}`);
  }

  return { created, skipped };
}

// ─── Exports ─────────────────────────────────────────────────────────────────

module.exports = {
  // Prospects
  insertProspect,
  getProspects,
  getProspectById,
  updateProspect,
  findDuplicate,
  // Messages
  logMessage,
  getMessagesForProspect,
  // Activity
  logActivity,
  // Replies
  insertReply,
  getUnhandledReplies,
  markReplyHandled,
  // Settings
  getSettings,
  setSetting,
  // Setup
  initializeSheets,
  // Low-level (for advanced use)
  readSheet,
  appendRows,
  updateRow
};
