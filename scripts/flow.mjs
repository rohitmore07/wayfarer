import { chromium } from 'playwright';
const BASE = 'http://localhost:3000', OUT = '/home/user/shots';
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 1440, height: 1000 } });
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message));
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });

await p.goto(`${BASE}/login`, { waitUntil: 'networkidle' });
await p.fill('input[type=email]', 'demo@wayfarer.ai');
await p.fill('input[type=password]', 'demo1234');
await p.click('button[type=submit]');
await p.waitForTimeout(2000);

await p.goto(`${BASE}/plan`, { waitUntil: 'networkidle' });
await p.waitForTimeout(600);
const brief = 'Japan for 7 days in March with my partner, ₹1.5L per person — culture, food, anime and photography. Comfortable hotels. Tokyo, Kyoto and Osaka.';
await p.fill('textarea', brief);
await p.keyboard.press('Enter');
await p.waitForTimeout(2500);
await p.screenshot({ path: `${OUT}/flow-1-streaming.png` });

// wait for plan to render (day cards or plan tabs)
for (let i = 0; i < 40; i++) {
  const txt = await p.evaluate(() => document.body.innerText);
  if (/Day 1/i.test(txt) && /Total/i.test(txt)) break;
  await p.waitForTimeout(1000);
}
await p.waitForTimeout(1500);
await p.screenshot({ path: `${OUT}/flow-2-plan.png`, fullPage: false });
const story = await p.evaluate(() => document.body.innerText.slice(0, 1400));
console.log('--- plan pane text ---\n', story);

// refine
const ta = await p.$('textarea');
await ta.fill('make it cheaper');
await p.keyboard.press('Enter');
await p.waitForTimeout(6000);
await p.screenshot({ path: `${OUT}/flow-3-refined.png`, fullPage: false });
const after = await p.evaluate(() => document.body.innerText.slice(0, 1600));
console.log('--- after refine ---\n', after);

console.log('errors:', errs.slice(0, 6));
await b.close();
