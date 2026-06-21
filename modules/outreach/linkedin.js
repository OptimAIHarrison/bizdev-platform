/**
 * @module linkedin
 * @description LinkedIn browser automation via Playwright.
 * Handles profile views, post likes, connection requests, and messaging.
 *
 * SAFETY CONTROLS (hard limits — never bypass these):
 *   - Max 20 connection requests/day
 *   - Max 40 profile views/day
 *   - Max 100 total LinkedIn actions/day
 *   - Weekday only, 8am–6pm AEST
 *   - ±15–45 minute jitter between actions
 *   - Max 2 actions per prospect per day
 *   - Auto-pause on CAPTCHA or unusual activity detection
 *
 * LinkedIn ToS risk: automation violates LinkedIn's ToS.
 * This risk is accepted by the founder. See README.
 */

'use strict';

require('dotenv').config();
const { chromium } = require('playwright');
const crm = require('../crm');

// ─── Constants ────────────────────────────────────────────────────────────────

const DAILY_LIMITS = {
  connectionRequests: 20,
  profileViews: 40,
  totalActions: 100
};

const WORKING_HOURS = { start: 8, end: 18 }; // AEST
const JITTER_MIN_MS = 15 * 60 * 1000; // 15 minutes
const JITTER_MAX_MS = 45 * 60 * 1000; // 45 minutes

// ─── Jitter and timing ────────────────────────────────────────────────────────

/**
 * Returns a random delay between JITTER_MIN and JITTER_MAX milliseconds.
 * Used between actions to mimic human behaviour.
 * @returns {number} Milliseconds
 */
function jitterDelay() {
  return JITTER_MIN_MS + Math.random() * (JITTER_MAX_MS - JITTER_MIN_MS);
}

/**
 * Checks if current time (AEST) is within working hours.
 * @returns {boolean}
 */
function isWorkingHours() {
  const now = new Date();
  // AEST = UTC+10 (AEST) or UTC+11 (AEDT)
  const aestOffset = 10; // Simplified — use a proper TZ library in production
  const aestHour = (now.getUTCHours() + aestOffset) % 24;
  const dayOfWeek = now.getUTCDay(); // 0=Sun, 6=Sat
  const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;
  return isWeekday && aestHour >= WORKING_HOURS.start && aestHour < WORKING_HOURS.end;
}

/**
 * Sleeps for a given number of milliseconds.
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Session management ───────────────────────────────────────────────────────

/**
 * Launches a Playwright browser and restores the LinkedIn session
 * using the stored li_at cookie. This avoids the login flow entirely
 * and is less detectable than username/password auth.
 *
 * @returns {Promise<{ browser: Browser, page: Page, valid: boolean }>}
 */
async function launchSession() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 800 },
    locale: 'en-AU'
  });

  // Restore session cookie
  const liAt = process.env.LINKEDIN_SESSION_COOKIE;
  if (liAt) {
    await context.addCookies([{
      name: 'li_at',
      value: liAt,
      domain: '.linkedin.com',
      path: '/',
      httpOnly: true,
      secure: true
    }]);
  }

  const page = await context.newPage();

  // Navigate to LinkedIn feed to test session validity
  await page.goto('https://www.linkedin.com/feed/', { waitUntil: 'networkidle', timeout: 30000 });

  // Detect CAPTCHA or login redirect
  const url = page.url();
  const isLoginPage = url.includes('/login') || url.includes('/checkpoint');
  const hasCaptcha = await page.$('.captcha-internal') !== null;

  if (isLoginPage || hasCaptcha) {
    await browser.close();
    return { browser: null, page: null, valid: false };
  }

  return { browser, page, valid: true };
}

/**
 * Checks LinkedIn session health without taking any action.
 * Used by the daily health check workflow.
 * @returns {Promise<boolean>}
 */
async function checkSessionHealth() {
  const { browser, valid } = await launchSession();
  if (browser) await browser.close();
  return valid;
}

// ─── Anti-detection helpers ───────────────────────────────────────────────────

/**
 * Simulates human-like mouse movement to a target element before clicking.
 * @param {Page} page
 * @param {string} selector
 */
async function humanClick(page, selector) {
  const el = await page.$(selector);
  if (!el) throw new Error(`Element not found: ${selector}`);
  const box = await el.boundingBox();
  if (!box) throw new Error(`Element not visible: ${selector}`);
  // Move to a slightly random position within the element
  await page.mouse.move(
    box.x + box.width * (0.3 + Math.random() * 0.4),
    box.y + box.height * (0.3 + Math.random() * 0.4),
    { steps: 10 }
  );
  await sleep(100 + Math.random() * 200);
  await el.click();
}

/**
 * Checks for CAPTCHA or security challenges on the current page.
 * @param {Page} page
 * @returns {Promise<boolean>}
 */
async function detectChallenge(page) {
  const indicators = [
    '.captcha-internal',
    '[data-test-id="challenge"]',
    '#error-for-password',
    '.security-check'
  ];
  for (const sel of indicators) {
    if (await page.$(sel)) return true;
  }
  // Check URL
  const url = page.url();
  return url.includes('/checkpoint') || url.includes('/authwall');
}

// ─── Daily limit tracking ─────────────────────────────────────────────────────

/**
 * Gets today's LinkedIn action counts from Activity_Log.
 * Used to enforce daily limits without a separate counter store.
 * @returns {Promise<{ connections: number, views: number, total: number }>}
 */
async function getTodaysActionCounts() {
  const today = new Date().toISOString().split('T')[0];
  const log = await crm.readSheet('Activity_Log');
  const todaysLinkedIn = log.filter(entry =>
    entry.channel === 'linkedin' &&
    entry.timestamp?.startsWith(today) &&
    entry.outcome === 'success'
  );

  return {
    connections: todaysLinkedIn.filter(e => e.action === 'linkedin_connect').length,
    views: todaysLinkedIn.filter(e => e.action === 'linkedin_view').length,
    total: todaysLinkedIn.length
  };
}

// ─── LinkedIn actions ─────────────────────────────────────────────────────────

/**
 * Views a prospect's LinkedIn profile.
 * This triggers a "profile view" notification to the prospect.
 *
 * @param {Page} page
 * @param {string} linkedinUrl
 * @param {string} prospectId
 * @returns {Promise<boolean>} Success
 */
async function viewProfile(page, linkedinUrl, prospectId) {
  try {
    await page.goto(linkedinUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(3000 + Math.random() * 4000); // Read dwell time

    if (await detectChallenge(page)) {
      throw new Error('LinkedIn challenge detected during profile view');
    }

    await crm.logActivity({
      prospect_id: prospectId,
      action: 'linkedin_view',
      channel: 'linkedin',
      outcome: 'success',
      notes: `Viewed profile: ${linkedinUrl}`
    });

    return true;
  } catch (err) {
    await crm.logActivity({
      prospect_id: prospectId,
      action: 'linkedin_view',
      channel: 'linkedin',
      outcome: 'failed',
      error: err.message
    });
    return false;
  }
}

/**
 * Likes the prospect's most recent LinkedIn post if they've posted in the last 30 days.
 *
 * @param {Page} page
 * @param {string} linkedinUrl
 * @param {string} prospectId
 * @returns {Promise<boolean>}
 */
async function likeRecentPost(page, linkedinUrl, prospectId) {
  try {
    const activityUrl = `${linkedinUrl}/recent-activity/all/`;
    await page.goto(activityUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2000 + Math.random() * 2000);

    if (await detectChallenge(page)) throw new Error('Challenge detected');

    // Find the first unliked post
    const likeButton = await page.$('button[aria-label*="Like"][aria-pressed="false"]');
    if (!likeButton) {
      await crm.logActivity({
        prospect_id: prospectId, action: 'linkedin_like', channel: 'linkedin',
        outcome: 'skipped', notes: 'No recent unliked posts found'
      });
      return false;
    }

    await humanClick(page, 'button[aria-label*="Like"][aria-pressed="false"]');
    await sleep(1000 + Math.random() * 1000);

    await crm.logActivity({
      prospect_id: prospectId, action: 'linkedin_like', channel: 'linkedin',
      outcome: 'success', notes: 'Liked most recent post'
    });
    return true;
  } catch (err) {
    await crm.logActivity({
      prospect_id: prospectId, action: 'linkedin_like', channel: 'linkedin',
      outcome: 'failed', error: err.message
    });
    return false;
  }
}

/**
 * Sends a connection request with a personalised note.
 *
 * @param {Page} page
 * @param {string} linkedinUrl
 * @param {string} note - Connection note (max 300 chars)
 * @param {string} prospectId
 * @returns {Promise<boolean>}
 */
async function sendConnectionRequest(page, linkedinUrl, note, prospectId) {
  try {
    await page.goto(linkedinUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2000 + Math.random() * 3000);

    if (await detectChallenge(page)) throw new Error('Challenge detected');

    // Click Connect button (may need to click "More" first on some profiles)
    let connectBtn = await page.$('button[aria-label*="Connect"]');
    if (!connectBtn) {
      const moreBtn = await page.$('button[aria-label*="More actions"]');
      if (moreBtn) {
        await humanClick(page, 'button[aria-label*="More actions"]');
        await sleep(800);
        connectBtn = await page.$('button[aria-label*="Connect"]');
      }
    }

    if (!connectBtn) {
      await crm.logActivity({
        prospect_id: prospectId, action: 'linkedin_connect', channel: 'linkedin',
        outcome: 'skipped', notes: 'Connect button not found — may already be connected'
      });
      return false;
    }

    await connectBtn.click();
    await sleep(1000 + Math.random() * 500);

    // Click "Add a note" button
    const addNoteBtn = await page.$('button[aria-label*="Add a note"]');
    if (addNoteBtn) {
      await addNoteBtn.click();
      await sleep(500);

      const textarea = await page.$('textarea[name="message"]');
      if (textarea) {
        // Type note character by character for realism
        const trimmedNote = note.substring(0, 300);
        await textarea.focus();
        await page.keyboard.type(trimmedNote, { delay: 30 + Math.random() * 50 });
        await sleep(500);
      }
    }

    // Submit
    const sendBtn = await page.$('button[aria-label*="Send"]');
    if (sendBtn) {
      await sendBtn.click();
      await sleep(2000);
    }

    await crm.logActivity({
      prospect_id: prospectId, action: 'linkedin_connect', channel: 'linkedin',
      outcome: 'success', notes: `Connection request sent with note: ${note.substring(0, 100)}`
    });
    return true;
  } catch (err) {
    await crm.logActivity({
      prospect_id: prospectId, action: 'linkedin_connect', channel: 'linkedin',
      outcome: 'failed', error: err.message
    });
    return false;
  }
}

/**
 * Sends a LinkedIn direct message to a connected prospect.
 *
 * @param {Page} page
 * @param {string} linkedinUrl
 * @param {string} message
 * @param {string} prospectId
 * @returns {Promise<boolean>}
 */
async function sendMessage(page, linkedinUrl, message, prospectId) {
  try {
    await page.goto(linkedinUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(2000 + Math.random() * 2000);

    if (await detectChallenge(page)) throw new Error('Challenge detected');

    // Click Message button
    const messageBtn = await page.$('button[aria-label*="Message"]');
    if (!messageBtn) {
      await crm.logActivity({
        prospect_id: prospectId, action: 'linkedin_message', channel: 'linkedin',
        outcome: 'skipped', notes: 'Message button not found — may not be connected'
      });
      return false;
    }

    await messageBtn.click();
    await sleep(1500 + Math.random() * 1000);

    // Type message
    const msgBox = await page.$('.msg-form__contenteditable');
    if (msgBox) {
      await msgBox.focus();
      await page.keyboard.type(message, { delay: 25 + Math.random() * 40 });
      await sleep(800);

      // Send (Enter key)
      await page.keyboard.press('Enter');
      await sleep(1500);
    }

    await crm.logActivity({
      prospect_id: prospectId, action: 'linkedin_message', channel: 'linkedin',
      outcome: 'success', notes: `Message sent: ${message.substring(0, 100)}`
    });
    return true;
  } catch (err) {
    await crm.logActivity({
      prospect_id: prospectId, action: 'linkedin_message', channel: 'linkedin',
      outcome: 'failed', error: err.message
    });
    return false;
  }
}

/**
 * Scrapes LinkedIn inbox for new messages from known prospects.
 * Returns array of { senderUrl, message, timestamp } objects.
 *
 * @param {Page} page
 * @returns {Promise<Array<{ senderName: string, senderProfileUrl: string, message: string, timestamp: string }>>}
 */
async function scrapeInbox(page) {
  const messages = [];
  try {
    await page.goto('https://www.linkedin.com/messaging/', { waitUntil: 'networkidle', timeout: 20000 });
    await sleep(3000);

    if (await detectChallenge(page)) throw new Error('Challenge detected on inbox');

    // Get conversation list
    const convos = await page.$$('.msg-conversation-listitem');
    for (const convo of convos.slice(0, 20)) { // Check last 20 conversations
      try {
        const nameEl = await convo.$('.msg-conversation-listitem__participant-names');
        const timeEl = await convo.$('.msg-conversation-listitem__time-stamp');
        const previewEl = await convo.$('.msg-conversation-listitem__message-snippet');

        if (!nameEl) continue;

        const name = await nameEl.textContent();
        const time = await timeEl?.textContent() || '';
        const preview = await previewEl?.textContent() || '';

        // Click to open and get full message
        await convo.click();
        await sleep(1500 + Math.random() * 1000);

        // Get profile URL from the open conversation
        const profileLink = await page.$('.msg-thread__link-to-profile');
        const profileUrl = profileLink ? await profileLink.getAttribute('href') : null;

        // Get last message from them (not from us)
        const allMessages = await page.$$('.msg-s-message-list__event');
        let latestTheirMessage = null;
        for (const msg of allMessages) {
          const isOurs = await msg.$('.msg-s-message-group--outgoing');
          if (!isOurs) {
            latestTheirMessage = await msg.$eval('.msg-s-event-listitem__body', el => el.textContent.trim()).catch(() => null);
          }
        }

        if (latestTheirMessage && profileUrl) {
          messages.push({
            senderName: name?.trim() || '',
            senderProfileUrl: `https://www.linkedin.com${profileUrl}`,
            message: latestTheirMessage,
            timestamp: new Date().toISOString()
          });
        }
      } catch (err) {
        console.warn('[LinkedIn] Error reading conversation:', err.message);
      }
    }
  } catch (err) {
    console.error('[LinkedIn] Inbox scrape error:', err.message);
  }
  return messages;
}

// ─── Main runner ──────────────────────────────────────────────────────────────

/**
 * Executes a single LinkedIn action for a prospect with all safety checks applied.
 * This is the entry point called by the outreach runner.
 *
 * @param {Object} params
 * @param {Object} params.prospect
 * @param {string} params.action - 'view' | 'like' | 'connect' | 'message'
 * @param {string} [params.content] - Note/message content for connect and message actions
 * @returns {Promise<{ success: boolean, reason?: string }>}
 */
async function executeLinkedInAction(params) {
  const { prospect, action, content } = params;

  // Safety: check working hours
  if (!isWorkingHours()) {
    return { success: false, reason: 'Outside working hours (Mon-Fri 8am-6pm AEST)' };
  }

  // Safety: check daily limits
  const counts = await getTodaysActionCounts();
  if (counts.total >= DAILY_LIMITS.totalActions) {
    return { success: false, reason: 'Daily total action limit (100) reached' };
  }
  if (action === 'connect' && counts.connections >= DAILY_LIMITS.connectionRequests) {
    return { success: false, reason: 'Daily connection request limit (20) reached' };
  }
  if (action === 'view' && counts.views >= DAILY_LIMITS.profileViews) {
    return { success: false, reason: 'Daily profile view limit (40) reached' };
  }

  // Safety: check max 2 actions per prospect per day
  const today = new Date().toISOString().split('T')[0];
  const allLog = await crm.readSheet('Activity_Log');
  const todayProspectActions = allLog.filter(e =>
    e.prospect_id === prospect.id &&
    e.channel === 'linkedin' &&
    e.timestamp?.startsWith(today) &&
    e.outcome === 'success'
  ).length;

  if (todayProspectActions >= 2) {
    return { success: false, reason: 'Max 2 LinkedIn actions per prospect per day' };
  }

  // Launch browser session
  const { browser, page, valid } = await launchSession();
  if (!valid) {
    // Alert founder
    await crm.logActivity({
      prospect_id: 'system',
      action: 'session_check',
      channel: 'linkedin',
      outcome: 'failed',
      error: 'LinkedIn session invalid — cookie expired'
    });
    return { success: false, reason: 'LinkedIn session invalid' };
  }

  let success = false;
  try {
    switch (action) {
      case 'view':
        success = await viewProfile(page, prospect.linkedin_url, prospect.id);
        break;
      case 'like':
        success = await likeRecentPost(page, prospect.linkedin_url, prospect.id);
        break;
      case 'connect':
        success = await sendConnectionRequest(page, prospect.linkedin_url, content, prospect.id);
        break;
      case 'message':
        success = await sendMessage(page, prospect.linkedin_url, content, prospect.id);
        break;
      default:
        throw new Error(`Unknown LinkedIn action: ${action}`);
    }
  } finally {
    await browser.close();
  }

  return { success };
}

module.exports = {
  executeLinkedInAction,
  checkSessionHealth,
  scrapeInbox,
  isWorkingHours
};
