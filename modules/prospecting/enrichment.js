/**
 * @module enrichment
 * @description Prospect enrichment pipeline.
 * Given a raw lead, enriches it with website data, tech stack signals,
 * job listings (as intent), and email discovery via Hunter.io / Apollo.
 *
 * Each function handles failures gracefully — partial enrichment is
 * better than blocking the whole pipeline.
 */

'use strict';

require('dotenv').config();
const axios = require('axios');
const cheerio = require('cheerio');

// ─── Retry helper ─────────────────────────────────────────────────────────────

async function withRetry(fn, attempts = 3, baseDelayMs = 1000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      if (i === attempts) throw err;
      await new Promise(r => setTimeout(r, baseDelayMs * Math.pow(2, i - 1)));
    }
  }
}

// ─── Website scraper ──────────────────────────────────────────────────────────

/**
 * Scrapes a company website to extract:
 * - Meta description and title
 * - About page text (intent signals, messaging)
 * - Detectable tech stack from response headers and scripts
 * - Job listings (as hiring intent signal)
 *
 * @param {string} websiteUrl
 * @returns {Promise<{ metaDescription: string, aboutText: string, techStack: string[], jobSignals: string[], rawText: string }>}
 */
async function scrapeWebsite(websiteUrl) {
  const result = {
    metaDescription: '',
    aboutText: '',
    techStack: [],
    jobSignals: [],
    rawText: ''
  };

  if (!websiteUrl) return result;

  // Normalise URL
  const url = websiteUrl.startsWith('http') ? websiteUrl : `https://${websiteUrl}`;

  try {
    const response = await withRetry(() => axios.get(url, {
      timeout: 10000,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; research-bot/1.0)' },
      maxRedirects: 3
    }));

    const $ = cheerio.load(response.data);

    // Meta description
    result.metaDescription = $('meta[name="description"]').attr('content') || '';

    // Page title
    const title = $('title').text().trim();
    result.rawText = `${title} ${result.metaDescription}`;

    // Grab main body text (first 2000 chars)
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 2000);
    result.rawText += ' ' + bodyText;

    // Tech stack detection via script sources and headers
    const scripts = [];
    $('script[src]').each((_, el) => scripts.push($(el).attr('src') || ''));
    const headers = response.headers;

    const techSignals = {
      'Shopify': ['shopify.com', 'cdn.shopify'],
      'WooCommerce': ['woocommerce', 'wc-'],
      'HubSpot': ['hubspot', 'hs-scripts'],
      'Salesforce': ['salesforce', 'pardot'],
      'WordPress': ['wp-content', 'wp-includes'],
      'Klaviyo': ['klaviyo'],
      'Google Analytics': ['gtag', 'analytics.js', 'gtm.js'],
      'Intercom': ['intercom'],
      'Zendesk': ['zendesk'],
      'ActiveCampaign': ['activecampaign'],
      'Mailchimp': ['mailchimp', 'mc.js'],
      'Next.js': ['_next/'],
      'React': ['react'],
      'Webflow': ['webflow.com'],
      'Squarespace': ['squarespace']
    };

    const scriptStr = scripts.join(' ') + ' ' + (response.data || '').substring(0, 5000);
    for (const [tech, patterns] of Object.entries(techSignals)) {
      if (patterns.some(p => scriptStr.toLowerCase().includes(p.toLowerCase()))) {
        result.techStack.push(tech);
      }
    }

    // X-Powered-By header
    if (headers['x-powered-by']) result.techStack.push(headers['x-powered-by']);

    // Job listings detection (intent signal)
    const jobKeywords = ['we are hiring', 'careers', 'join our team', 'open positions', 'job openings', 'work with us'];
    const pageTextLower = bodyText.toLowerCase();
    if (jobKeywords.some(k => pageTextLower.includes(k))) {
      result.jobSignals.push('hiring intent detected on website');
    }

    // Try to get /careers or /jobs page
    try {
      const careersUrl = new URL('/careers', url).href;
      const careersRes = await axios.get(careersUrl, { timeout: 5000 });
      const $c = cheerio.load(careersRes.data);
      const careersText = $c('body').text().replace(/\s+/g, ' ').trim().substring(0, 1000);
      if (careersText.length > 100) {
        result.jobSignals.push(`careers page found: ${careersText.substring(0, 200)}`);
      }
    } catch {
      // No careers page — not an error
    }

  } catch (err) {
    console.warn(`[Enrichment] Website scrape failed for ${websiteUrl}: ${err.message}`);
  }

  return result;
}

// ─── Email discovery ──────────────────────────────────────────────────────────

/**
 * Discovers a prospect's email via Hunter.io API (free tier: 25/month).
 * Falls back gracefully if the API limit is hit.
 *
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} domain - Company domain e.g. 'acme.com'
 * @returns {Promise<{ email: string|null, verified: boolean, source: string }>}
 */
async function discoverEmail(firstName, lastName, domain) {
  const apiKey = process.env.HUNTER_API_KEY;
  if (!apiKey || !domain) return { email: null, verified: false, source: 'none' };

  try {
    const response = await withRetry(() => axios.get('https://api.hunter.io/v2/email-finder', {
      params: { domain, first_name: firstName, last_name: lastName, api_key: apiKey },
      timeout: 8000
    }));

    const data = response.data?.data;
    if (data?.email) {
      return {
        email: data.email,
        verified: data.verification?.result === 'deliverable',
        source: 'hunter'
      };
    }
  } catch (err) {
    if (err.response?.status === 429) {
      console.warn('[Enrichment] Hunter.io rate limit hit — skipping email discovery');
    } else {
      console.warn(`[Enrichment] Hunter.io error: ${err.message}`);
    }
  }

  // Fallback: try Apollo.io
  return discoverEmailApollo(firstName, lastName, domain);
}

/**
 * Apollo.io email enrichment fallback.
 * @param {string} firstName
 * @param {string} lastName
 * @param {string} domain
 * @returns {Promise<{ email: string|null, verified: boolean, source: string }>}
 */
async function discoverEmailApollo(firstName, lastName, domain) {
  const apiKey = process.env.APOLLO_API_KEY;
  if (!apiKey) return { email: null, verified: false, source: 'none' };

  try {
    const response = await withRetry(() => axios.post(
      'https://api.apollo.io/v1/people/match',
      { first_name: firstName, last_name: lastName, domain },
      {
        headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json', 'X-Api-Key': apiKey },
        timeout: 8000
      }
    ));

    const person = response.data?.person;
    if (person?.email) {
      return { email: person.email, verified: person.email_status === 'verified', source: 'apollo' };
    }
  } catch (err) {
    console.warn(`[Enrichment] Apollo fallback error: ${err.message}`);
  }

  return { email: null, verified: false, source: 'none' };
}

/**
 * Extracts domain from a LinkedIn URL or website URL.
 * @param {string} url
 * @returns {string|null}
 */
function extractDomain(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return null;
  }
}

// ─── Full enrichment pipeline ─────────────────────────────────────────────────

/**
 * Runs the full enrichment pipeline for a single raw prospect.
 * Attaches enriched fields in-place and returns the updated object.
 *
 * Pipeline:
 *   1. Website scrape → meta, tech stack, job signals
 *   2. Email discovery via Hunter → Apollo fallback
 *   3. Returns all enriched data for scoring
 *
 * @param {Object} prospect - Raw prospect data
 * @returns {Promise<Object>} Enriched prospect
 */
async function enrichProspect(prospect) {
  const enriched = { ...prospect };

  // 1. Website enrichment
  if (prospect.website) {
    console.log(`[Enrichment] Scraping website: ${prospect.website}`);
    const web = await scrapeWebsite(prospect.website);
    enriched.tech_stack = web.techStack.join(', ');
    enriched.notes = [
      prospect.notes || '',
      web.metaDescription ? `Site: ${web.metaDescription.substring(0, 150)}` : '',
      web.jobSignals.join('; ')
    ].filter(Boolean).join(' | ');
    enriched._websiteRawText = web.rawText; // For rule-based signal detection (see signals.js)
  }

  // 2. Email discovery
  if (!prospect.email) {
    const domain = extractDomain(prospect.website) || extractDomain(prospect.linkedin_url);
    if (domain && prospect.first_name && prospect.last_name) {
      console.log(`[Enrichment] Discovering email for ${prospect.first_name} ${prospect.last_name} @ ${domain}`);
      const emailResult = await discoverEmail(prospect.first_name, prospect.last_name, domain);
      enriched.email = emailResult.email || '';
      enriched.email_verified = emailResult.verified ? 'true' : 'false';
    }
  }

  return enriched;
}

module.exports = { enrichProspect, scrapeWebsite, discoverEmail, extractDomain };
