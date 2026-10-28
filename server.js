const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const FILE = path.join(DATA_DIR, 'state.json');
const PASS = process.env.APP_PASSWORD || '';

fs.mkdirSync(DATA_DIR, { recursive: true });
app.disable('x-powered-by');

// Health check for Railway (no auth)
app.get('/healthz', (req, res) => res.type('text').send('ok'));

// Optional single-user password (HTTP Basic auth). Username can be anything.
if (PASS) {
  const h = (s) => crypto.createHash('sha256').update(String(s)).digest();
  const want = h(PASS);
  app.use((req, res, next) => {
    const hdr = req.headers.authorization || '';
    if (hdr.startsWith('Basic ')) {
      const decoded = Buffer.from(hdr.slice(6), 'base64').toString();
      const given = decoded.slice(decoded.indexOf(':') + 1);
      if (crypto.timingSafeEqual(h(given), want)) return next();
    }
    res.set('WWW-Authenticate', 'Basic realm="Infinity Outreach", charset="UTF-8"');
    res.status(401).send('Password required');
  });
} else {
  console.warn('WARNING: APP_PASSWORD is not set. Anyone with the URL can read and edit your data.');
}

app.use(express.json({ limit: '5mb' }));

app.get('/api/state', (req, res) => {
  res.set('Cache-Control', 'no-store');
  try {
    res.type('json').send(fs.readFileSync(FILE, 'utf8'));
  } catch (e) {
    res.json({});
  }
});

app.put('/api/state', (req, res) => {
  const b = req.body;
  if (!b || typeof b !== 'object' || Array.isArray(b) || !Array.isArray(b.prospects)) {
    return res.status(400).json({ error: 'Invalid state' });
  }
  try {
    const tmp = FILE + '.tmp';
    if (fs.existsSync(FILE)) fs.copyFileSync(FILE, path.join(DATA_DIR, 'state.bak.json'));
    fs.writeFileSync(tmp, JSON.stringify(b));
    fs.renameSync(tmp, FILE);
    res.json({ ok: true, updatedAt: b.updatedAt || 0 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Could not save' });
  }
});

app.use(express.static(path.join(__dirname, 'public'), { maxAge: 0, etag: true }));

app.listen(PORT, '0.0.0.0', () => console.log(`Infinity Outreach listening on ${PORT}, data in ${DATA_DIR}`));
