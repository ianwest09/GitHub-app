#!/usr/bin/env node
// Zero-dependency, OPTIONAL LAN sync service for the Christmas Lunch app.
// Nothing in the app contacts this unless the user enters its URL and taps Sync.
// No account, no API key, no database, no price lookups, no guessed prices.

import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
const HOST = process.env.HOST || '0.0.0.0';
const DATA_DIR = process.env.DATA_DIR || path.join(HERE, 'data');
const BACKUP_FILE = path.join(DATA_DIR, 'backup.json');
const PRICES_FILE = path.join(DATA_DIR, 'prices.json');

let backup = null;
let prices = [];

await fs.mkdir(DATA_DIR, { recursive: true });
try { backup = JSON.parse(await fs.readFile(BACKUP_FILE, 'utf8')); } catch { /* first run */ }
try {
  const p = JSON.parse(await fs.readFile(PRICES_FILE, 'utf8'));
  if (Array.isArray(p)) prices = p;
} catch { /* first run */ }

const send = (res, status, body) => {
  const text = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(text),
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(text);
};

const readJson = (req) => new Promise((resolve, reject) => {
  let raw = '';
  req.on('data', (chunk) => {
    raw += chunk;
    if (raw.length > 2_000_000) reject(new Error('Request body too large'));
  });
  req.on('end', () => {
    try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error('Body is not valid JSON')); }
  });
  req.on('error', reject);
});

const validPriceSources = new Set([
  'CATALOGUE', 'STORE_LISTING', 'MANUAL', 'RECEIPT', 'PHOTO_CONFIRMED', 'API',
]);
const validPriceEntry = (e) => e && typeof e === 'object'
  && Number.isInteger(e.priceInCents) && e.priceInCents >= 0
  && typeof e.capturedAt === 'string' && e.capturedAt
  && validPriceSources.has(e.source)
  && (e.store === 'pnp' || e.store === 'woolworths' || e.store === 'spar');

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

  try {
    if (req.method === 'GET' && url.pathname === '/v1/health') {
      return send(res, 200, { ok: true, service: 'christmas-lunch-sync', version: 1, pricesStored: prices.length });
    }

    if (req.method === 'GET' && url.pathname === '/v1/backup') {
      if (!backup) return send(res, 404, { error: 'No backup stored yet' });
      return send(res, 200, backup);
    }

    if (req.method === 'PUT' && url.pathname === '/v1/backup') {
      const body = await readJson(req);
      if (body.version !== 1 || !body.state || body.state.version !== 1 || !Array.isArray(body.state.lines)) {
        return send(res, 400, { error: 'Expected {version:1, state:{version:1, lines:[...]}, updatedAt, deviceId}' });
      }
      backup = {
        version: 1,
        deviceId: String(body.deviceId || 'unknown'),
        updatedAt: String(body.updatedAt || new Date().toISOString()),
        receivedAt: new Date().toISOString(),
        state: body.state,
      };
      await fs.writeFile(BACKUP_FILE, JSON.stringify(backup, null, 2));
      return send(res, 200, { ok: true, updatedAt: backup.updatedAt, receivedAt: backup.receivedAt });
    }

    if (req.method === 'GET' && url.pathname === '/v1/prices') {
      return send(res, 200, { version: 1, entries: prices });
    }

    if (req.method === 'POST' && url.pathname === '/v1/prices') {
      const body = await readJson(req);
      if (!Array.isArray(body.entries) || !body.entries.every(validPriceEntry)) {
        return send(res, 400, { error: 'entries must be source-linked PriceEntry records with integer priceInCents' });
      }
      const stamped = body.entries.map((e) => ({ ...e, receivedAt: new Date().toISOString(), deviceId: String(body.deviceId || 'unknown') }));
      const seen = new Set(prices.map((e) => e.id));
      const added = stamped.filter((e) => !seen.has(e.id));
      prices = [...prices, ...added]; // append-only history; never overwrite silently
      await fs.writeFile(PRICES_FILE, JSON.stringify(prices, null, 2));
      return send(res, 200, { ok: true, accepted: added.length, duplicatesSkipped: stamped.length - added.length, total: prices.length });
    }

    return send(res, 404, { error: 'Not found' });
  } catch (err) {
    return send(res, 400, { error: err.message || 'Bad request' });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Christmas Lunch optional sync service on http://${HOST}:${PORT}`);
  console.log(`Data directory: ${DATA_DIR}`);
  console.log('No account, no API key, no automatic network access. Stop with Ctrl+C.');
});
