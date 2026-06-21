/**
 * @file scripts/get-oauth-token.js
 * @description One-time script to generate your Google OAuth refresh token.
 *
 * Run with: node scripts/get-oauth-token.js
 *
 * Prerequisites:
 *   1. Create a project at https://console.cloud.google.com
 *   2. Enable: Gmail API + Google Sheets API
 *   3. Create OAuth 2.0 credentials (Desktop app type)
 *   4. Set GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET in .env
 *   5. Run this script, open the URL, authorise, paste the code back
 *   6. Copy the refresh_token into your .env and Railway env vars
 */

'use strict';

require('dotenv').config();
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/spreadsheets'
];

const auth = new google.auth.OAuth2(
  process.env.GOOGLE_OAUTH_CLIENT_ID,
  process.env.GOOGLE_OAUTH_CLIENT_SECRET,
  'urn:ietf:wg:oauth:2.0:oob' // Out-of-band — no redirect needed
);

const url = auth.generateAuthUrl({ access_type: 'offline', scope: SCOPES, prompt: 'consent' });

console.log('\n══════════════════════════════════════════════════════');
console.log('  Google OAuth Token Generator');
console.log('══════════════════════════════════════════════════════\n');
console.log('1. Open this URL in your browser:\n');
console.log('   ' + url);
console.log('\n2. Authorise with the Google account you want to send from.');
console.log('3. Copy the authorisation code shown and paste it below.\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the authorisation code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await auth.getToken(code.trim());
    console.log('\n══════════════════════════════════════════════════════');
    console.log('  SUCCESS — add these to your .env and Railway secrets:');
    console.log('══════════════════════════════════════════════════════\n');
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN=${tokens.refresh_token}`);
    console.log('\n  (The access_token expires — only the refresh_token is needed)');
    console.log('══════════════════════════════════════════════════════\n');
  } catch (err) {
    console.error('\n  Error getting token:', err.message);
    console.log('  Make sure CLIENT_ID and CLIENT_SECRET are set in .env');
    process.exit(1);
  }
});
