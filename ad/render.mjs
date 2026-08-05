/* Offline frame renderer.
 *
 * Serves ad/ over localhost (so @font-face and images load with a normal
 * origin), opens scene.html at exactly 1080x1920, then steps the timeline one
 * frame at a time and screenshots each one. Nothing is real-time: `__render(t)`
 * is a pure function of time, so the output is identical on every run.
 *
 *   node render.mjs                 # full 60fps render to frames/
 *   node render.mjs --fps 30        # cheaper pass
 *   node render.mjs --preview       # 20-frame contact sheet only
 *   node render.mjs --at 1.2,8.6    # specific times, for checking a beat
 */

import { chromium } from 'playwright';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, 'frames');

const MIME = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.woff2': 'font/woff2',
};

function arg(name, fallback = null) {
  const i = process.argv.indexOf('--' + name);
  if (i === -1) return fallback;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : true;
}

function serve() {
  const server = http.createServer((req, res) => {
    const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'scene.html';
    const file = path.join(HERE, rel);
    if (!file.startsWith(HERE) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.writeHead(404).end('not found');
      return;
    }
    res.writeHead(200, {
      'Content-Type': MIME[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    fs.createReadStream(file).pipe(res);
  });
  return new Promise((r) => server.listen(0, '127.0.0.1', () => r(server)));
}

const server = await serve();
const port = server.address().port;

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: [
    '--no-sandbox',
    '--force-color-profile=srgb',
    '--font-render-hinting=none',
    '--disable-font-subpixel-positioning',
    '--hide-scrollbars',
    '--disable-lcd-text',
  ],
});

const page = await browser.newPage({
  viewport: { width: 1080, height: 1920 },
  deviceScaleFactor: 1,
  reducedMotion: 'no-preference',
});

const errors = [];
const ignore = (u) => u.includes('favicon.ico');
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error' && !ignore(m.location().url)) errors.push(m.text()); });
page.on('requestfailed', (r) => { if (!ignore(r.url())) errors.push(`request failed: ${r.url()}`); });
page.on('response', (r) => { if (r.status() >= 400 && !ignore(r.url())) errors.push(`${r.status()} ${r.url()}`); });

await page.goto(`http://127.0.0.1:${port}/scene.html`, { waitUntil: 'load' });
await page.evaluate(() => window.__ready);

if (errors.length) {
  console.error('page errors:\n  ' + errors.join('\n  '));
  await browser.close();
  server.close();
  process.exit(1);
}

const duration = await page.evaluate(() => window.__DURATION);
const stage = page.locator('#stage');

async function shoot(t, file, quality = 96) {
  await page.evaluate((time) => window.__render(time), t);
  await stage.screenshot({ path: file, type: 'jpeg', quality });
}

if (arg('preview') || arg('at')) {
  const times = arg('at')
    ? String(arg('at')).split(',').map(Number)
    : Array.from({ length: 20 }, (_, i) => (i + 0.5) * (duration / 20));
  fs.mkdirSync(path.join(HERE, 'preview'), { recursive: true });
  for (const [i, t] of times.entries()) {
    const f = path.join(HERE, 'preview', `p${String(i).padStart(2, '0')}.jpg`);
    await shoot(t, f, 90);
    console.log(`preview ${t.toFixed(2)}s -> ${path.basename(f)}`);
  }
} else {
  const fps = Number(arg('fps', 60));
  const total = Math.round(duration * fps);
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  const started = Date.now();
  for (let i = 0; i < total; i++) {
    await shoot(i / fps, path.join(OUT, `f${String(i).padStart(5, '0')}.jpg`));
    if (i % 60 === 0 || i === total - 1) {
      const done = i + 1;
      const rate = done / ((Date.now() - started) / 1000);
      const eta = Math.round((total - done) / rate);
      process.stdout.write(
        `\rframe ${done}/${total}  ${rate.toFixed(1)} fps  eta ${eta}s   `
      );
    }
  }
  process.stdout.write(`\ndone in ${Math.round((Date.now() - started) / 1000)}s\n`);
}

if (errors.length) console.error('page errors:\n  ' + errors.join('\n  '));
await browser.close();
server.close();
