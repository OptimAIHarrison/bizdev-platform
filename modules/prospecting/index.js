/**
 * @module prospecting
 * @description Prospect discovery, enrichment, and qualification pipeline.
 * Sources: LinkedIn search scraper, Google Maps (local businesses), manual input.
 *
 * Pipeline per prospect:
 *   Raw Lead → Dedup Check → Website Scrape → Email Discovery
 *   → AI Intent Signal Extraction → ICP Scoring → CRM Insert
 *
 * Only prospects scoring 60+ are added to the outreach queue.
 */

'use strict';

require('dotenv').config();
const { chromium } = require('playwright');
const crm = require('../crm');
const ai = require('../ai');
const enrichment = require('./enrichment');
const { scoreProspect, meetsThreshold } = require('./scoring');

// ─── LinkedIn search scraper ──────────────────────────────────────────────────

/**
 * Scrapes LinkedIn People search results for a given search URL.
 * Returns raw prospect data before enrichment.
 *
 * @param {string} searchUrl - LinkedIn people search URL (e.g. /search/results/people/?keywords=...)
 * @param {number} [maxResults=50] - Max profiles to extract
 * @returns {Promise<Array<{ firstName, lastName, title, company, linkedinUrl, location }>>}
 */
async function scrapeLinkedInSearch(searchUrl, maxResults = 50) {
  const liAt = process.env.LINKEDIN_SESSION_COOKIE;
  if (!liAt) throw new Error('LINKEDIN_SESSION_COOKIE not set');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-AU'
  });

  await context.addCookies([{
    name: 'li_at', value: liAt, domain: '.linkedin.com', path: '/', httpOnly: true, secure: true
  }]);

  const page = await context.newPage();
  const results = [];

  try {
    // Ensure it's a full URL
    const url = searchUrl.startsWith('http') ? searchUrl : `https://www.linkedin.com${searchUrl}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(2000 + Math.random() * 2000);

    // Check session
    if (page.url().includes('/login') || page.url().includes('/checkpoint')) {
      throw new Error('LinkedIn session invalid — cannot scrape search results');
    }

    let pageNum = 1;
    while (results.length < maxResults) {
      console.log(`[Prospecting] Scraping page ${pageNum}...`);

      // Extract profiles from current page
      const profiles = await page.$$eval('.entity-result__item, .search-result__info', items =>
        items.map(item => {
          const nameEl = item.querySelector('.entity-result__title-text a span[aria-hidden="true"], .actor-name');
          const titleEl = item.querySelector('.entity-result__primary-subtitle, .search-result__truncate');
          const companyEl = item.querySelector('.entity-result__secondary-subtitle');
          const linkEl = item.querySelector('.entity-result__title-text a, .search-result__result-link');
          const locationEl = item.querySelector('.entity-result__tertiary-subtitle');

          const fullName = nameEl?.textContent?.trim() || '';
          const [firstName, ...rest] = fullName.split(' ');

          return {
            firstName: firstName || '',
            lastName: rest.join(' ') || '',
            title: titleEl?.textContent?.trim() || '',
            company: companyEl?.textContent?.trim() || '',
            linkedinUrl: linkEl?.href?.split('?')[0] || '',
            location: locationEl?.textContent?.trim() || ''
          };
        }).filter(p => p.firstName && p.linkedinUrl)
      );

      results.push(...profiles);

      // Check for next page
      const nextBtn = await page.$('button[aria-label="Next"]');
      if (!nextBtn || results.length >= maxResults) break;

      await nextBtn.click();
      await page.waitForTimeout(3000 + Math.random() * 2000);
      pageNum++;
    }
  } finally {
    await browser.close();
  }

  return results.slice(0, maxResults);
}

/**
 * Scrapes a LinkedIn profile page for additional context.
 * Used to get summary text and recent activity for AI signal extraction.
 *
 * @param {string} linkedinUrl
 * @returns {Promise<{ summary: string, recentPost: string, connectionCount: string }>}
 */
async function scrapeLinkedInProfile(linkedinUrl) {
  const liAt = process.env.LINKEDIN_SESSION_COOKIE;
  if (!liAt) return { summary: '', recentPost: '', connectionCount: '' };

  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ locale: 'en-AU' });
  await context.addCookies([{
    name: 'li_at', value: liAt, domain: '.linkedin.com', path: '/', httpOnly: true, secure: true
  }]);

  const page = await context.newPage();
  let result = { summary: '', recentPost: '', connectionCount: '' };

  try {
    await page.goto(linkedinUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(2000);

    result.summary = await page.$eval('.pv-about-section, .text-body-medium', el => el.textContent.trim())
      .catch(() => '');
    result.recentPost = await page.$eval('.profile-creator-shared-media-feed-item, .pv-recent-activity-card', el => el.textContent.trim().substring(0, 300))
      .catch(() => '');
  } catch (err) {
    console.warn(`[Prospecting] Profile scrape error for ${linkedinUrl}:`, err.message);
  } finally {
    await browser.close();
  }

  return result;
}

// ─── Google Maps scraper (for Nudge Digital local prospects) ──────────────────

/**
 * Searches Google Maps for local businesses matching a query.
 * Useful for finding Melbourne-based SMBs for Nudge Digital.
 *
 * @param {string} query - e.g. 'ecommerce store Melbourne'
 * @param {number} [maxResults=20]
 * @returns {Promise<Array<{ company, website, phone, location, category }>>}
 */
async function scrapeGoogleMaps(query, maxResults = 20) {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const results = [];

  try {
    const searchUrl = `https://www.google.com/maps/search/${encodeURIComponent(query)}`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 20000 });
    await page.waitForTimeout(3000);

    // Scroll to load more results
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('End');
      await page.waitForTimeout(1500);
    }

    const listings = await page.$$eval('[role="article"]', items =>
      items.map(item => ({
        company: item.querySelector('.fontHeadlineSmall')?.textContent?.trim() || '',
        category: item.querySelector('.fontBodyMedium span:first-child')?.textContent?.trim() || '',
        location: item.querySelector('[data-item-id="address"]')?.textContent?.trim() || '',
        phone: item.querySelector('[data-item-id^="phone"]')?.textContent?.trim() || '',
        website: item.querySelector('a[data-item-id="authority"]')?.href || ''
      })).filter(r => r.company)
    );

    results.push(...listings.slice(0, maxResults));
  } catch (err) {
    console.warn('[Prospecting] Google Maps scrape error:', err.message);
  } finally {
    await browser.close();
  }

  return results;
}

// ─── Full pipeline ─────────────────────────────────────────────────────────────

/**
 * Runs the full prospecting pipeline for a batch of raw leads.
 * Dedup → Enrich → Score → Insert to CRM if qualified.
 *
 * @param {Object[]} rawLeads - Array of raw lead objects
 * @param {string} brand - 'optimai' | 'nudge'
 * @param {string} [source] - Source identifier e.g. 'linkedin_search', 'google_maps', 'manual'
 * @returns {Promise<{ added: number, skipped: number, rejected: number }>}
 */
async function runProspectingPipeline(rawLeads, brand, source = 'unknown') {
  const counts = { added: 0, skipped: 0, rejected: 0 };

  for (const lead of rawLeads) {
    try {
      // 1. Normalise fields
      const prospect = {
        brand,
        first_name: lead.firstName || lead.first_name || '',
        last_name: lead.lastName || lead.last_name || '',
        title: lead.title || '',
        company: lead.company || '',
        industry: lead.industry || '',
        company_size: lead.companySize || lead.company_size || '',
        location: lead.location || '',
        linkedin_url: lead.linkedinUrl || lead.linkedin_url || '',
        email: lead.email || '',
        website: lead.website || '',
        source,
        status: 'new'
      };

      if (!prospect.first_name && !prospect.company) {
        counts.skipped++;
        continue;
      }

      // 2. Deduplication check
      const duplicate = await crm.findDuplicate(prospect.linkedin_url, prospect.email);
      if (duplicate) {
        console.log(`[Prospecting] Duplicate: ${prospect.first_name} ${prospect.last_name} at ${prospect.company} — skipped`);
        counts.skipped++;
        continue;
      }

      // 3. Enrichment
      console.log(`[Prospecting] Enriching: ${prospect.first_name} ${prospect.last_name} @ ${prospect.company}`);
      const enriched = await enrichment.enrichProspect(prospect);

      // 4. AI intent signal extraction (optional — uses API credits)
      let aiSignals = null;
      if (enriched._websiteRawText) {
        aiSignals = await ai.extractIntentSignals({
          websiteContent: enriched._websiteRawText,
          linkedinContent: '',
          brand
        }).catch(() => null);
      }
      delete enriched._websiteRawText; // Don't persist raw scraped content

      // 5. ICP scoring
      const { score, breakdown, notes } = scoreProspect(enriched, brand, aiSignals);
      enriched.icp_score = score.toString();
      enriched.notes = [enriched.notes, notes.join('; ')].filter(Boolean).join(' | ');

      console.log(`[Prospecting] Score: ${score}/100 — ${meetsThreshold(score, brand) ? '✓ Qualified' : '✗ Rejected'}`);

      // 6. Insert if qualified
      if (meetsThreshold(score, brand)) {
        enriched.status = 'queued';
        const id = await crm.insertProspect(enriched);
        await crm.logActivity({
          prospect_id: id,
          action: 'prospect_added',
          channel: 'system',
          outcome: 'success',
          notes: `Score: ${score}/100 | Source: ${source}`
        });
        counts.added++;
      } else {
        counts.rejected++;
      }
    } catch (err) {
      console.error('[Prospecting] Pipeline error for lead:', err.message);
      counts.skipped++;
    }
  }

  console.log(`[Prospecting] Pipeline complete: ${JSON.stringify(counts)}`);
  return counts;
}

module.exports = {
  scrapeLinkedInSearch,
  scrapeLinkedInProfile,
  scrapeGoogleMaps,
  runProspectingPipeline
};
