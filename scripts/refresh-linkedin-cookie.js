/**
 * @file scripts/refresh-linkedin-cookie.js
 * @description Helper to extract a fresh LinkedIn li_at session cookie.
 *
 * Run with: node scripts/refresh-linkedin-cookie.js
 *
 * This script opens a visible Chromium window where you can log in to LinkedIn
 * manually. Once you're logged in, it extracts the li_at cookie and prints it
 * for you to copy into your .env and Railway secrets.
 *
 * Li_at cookies typically last 1-2 years. Refresh when LinkedIn actions start
 * failing with session errors.
 */

'use strict';

require('dotenv').config();
const { chromium } = require('playwright');

async function extractCookie() {
  console.log('\n══════════════════════════════════════════════════════');
  console.log('  LinkedIn Cookie Extractor');
  console.log('══════════════════════════════════════════════════════\n');
  console.log('  Opening a browser window. Log in to LinkedIn manually.');
  console.log('  Once logged in, press ENTER in this terminal.\n');

  const browser = await chromium.launch({ headless: false }); // Visible window
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto('https://www.linkedin.com/login');

  // Wait for user to log in manually
  const readline = require('readline');
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  await new Promise(resolve => rl.question('  Press ENTER after you have logged in to LinkedIn... ', () => { rl.close(); resolve(); }));

  // Extract cookies
  const cookies = await context.cookies('https://www.linkedin.com');
  const liAt = cookies.find(c => c.name === 'li_at');

  await browser.close();

  if (!liAt) {
    console.log('\n  ✗ Could not find li_at cookie. Make sure you are logged in.\n');
    process.exit(1);
  }

  console.log('\n══════════════════════════════════════════════════════');
  console.log('  SUCCESS — add this to your .env and Railway secrets:');
  console.log('══════════════════════════════════════════════════════\n');
  console.log(`LINKEDIN_SESSION_COOKIE=${liAt.value}`);
  console.log('\n  Cookie expires:', new Date(liAt.expires * 1000).toLocaleDateString('en-AU'));
  console.log('══════════════════════════════════════════════════════\n');
}

extractCookie().catch(err => {
  console.error('\n  Error:', err.message);
  process.exit(1);
});
