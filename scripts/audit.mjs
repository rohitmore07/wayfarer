import { chromium } from 'playwright';
import fs from 'node:fs';

const BASE = 'http://localhost:3000';
const OUT = '/home/user/shots';
fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await ctx.newPage();
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(`[console] ${m.text()}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${e.message}`));

await page.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await page.fill('input[type=email]', 'demo@wayfarer.ai');
await page.fill('input[type=password]', 'demo1234');
await page.click('button[type=submit]');
await page.waitForTimeout(2500);
console.log('after login:', page.url().replace(BASE, ''));

const brokenImgs = async () =>
  page.evaluate(() =>
    [...document.images].filter((i) => i.complete && i.naturalWidth === 0).map((i) => i.currentSrc.slice(-70))
  );

const pages = ['/', '/login', '/plan', '/explore', '/explore/kyoto', '/flights', '/hotels', '/activities', '/trips', '/budget', '/profile'];
for (const path of pages) {
  const before = errors.length;
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(900);
  await page.screenshot({ path: `${OUT}/page-${path === '/' ? 'landing' : path.replace(/\//g, '-').replace(/^-/, '')}.png`, fullPage: true });
  const name = path === '/' ? 'landing' : path.replace(/\//g, '-').replace(/^-/, '');
  const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const broken = await brokenImgs();
  console.log(`${name.padEnd(16)} overflow=${over} brokenImgs=${broken.length} errors=${errors.length - before} ${broken.slice(0, 3).join(' | ')}`);
}

// Trip workspace: capture each tab
const trips = await page.evaluate(async () => (await (await fetch('/api/trips')).json()).trips);
const japan = trips.find((t) => t.title.includes('Tokyo')) ?? trips[0];
const tabs = ['Overview', 'Itinerary', 'Flights', 'Stays', 'Budget', 'Map', 'Prep & safety'];
await page.goto(`${BASE}/trips/${japan.id}`, { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);
console.log('trip overflow=', await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
for (const tab of tabs) {
  await page.getByRole('button', { name: tab, exact: true }).first().click().catch(async () => {
    await page.getByText(tab, { exact: true }).first().click();
  });
  await page.waitForTimeout(900);
  const slug = tab.toLowerCase().replace(/[^a-z]+/g, '-');
  await page.screenshot({ path: `${OUT}/trip-${slug}.png`, fullPage: true });
  console.log(`tab ${tab.padEnd(14)} broken=${(await brokenImgs()).length} h=${await page.evaluate(() => document.body.scrollHeight)}`);
}

// slideshow of mobile
const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2, storageState: await ctx.storageState() });
const mp = await mob.newPage();
for (const [name, path] of [['mobile-landing', '/'], ['mobile-plan', '/plan'], ['mobile-trips', '/trips'], ['mobile-trip', `/trips/${japan.id}`], ['mobile-flights', '/flights']]) {
  await mp.goto(BASE + path, { waitUntil: 'networkidle' });
  await mp.waitForTimeout(900);
  await mp.screenshot({ path: `${OUT}/${name}.png`, fullPage: true });
  console.log(name, 'overflow=', await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth));
}

console.log('\nERRORS:', errors.length ? '\n' + [...new Set(errors)].slice(0, 15).join('\n') : 'none');
await browser.close();
