import { asiaCities } from '../lib/data/cities/asia';
import { europeCities } from '../lib/data/cities/europe';
import { japanCities } from '../lib/data/cities/japan';
import { restCities } from '../lib/data/cities/rest';
import fs from 'node:fs/promises';
import path from 'node:path';

/**
 * Resolves real photographs for every destination + POI using the MediaWiki
 * pageimages API (batched, no API key), writing URLs to lib/data/images.json.
 * Run once: npx tsx scripts/fetch-images.ts
 */
const seeds = [...japanCities, ...asiaCities, ...europeCities, ...restCities];
const target = path.join(process.cwd(), 'lib/data/images.json');

async function queryBatch(titles: string[]): Promise<Record<string, string>> {
  const url =
    'https://en.wikipedia.org/w/api.php?action=query&format=json&formatversion=2&redirects=1' +
    '&prop=pageimages&piprop=thumbnail&pithumbsize=1400&titles=' +
    encodeURIComponent(titles.join('|'));
  const res = await fetch(url, { headers: { 'User-Agent': 'WayfarerAI/1.0 (travel demo; contact demo@example.com)' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const json: any = await res.json();
  const pages = json?.query?.pages ?? [];
  const out: Record<string, string> = {};
  for (const p of pages) {
    if (p.thumbnail?.source) out[p.title] = p.thumbnail.source;
  }
  return out;
}

async function main() {
  let existing: Record<string, string> = {};
  try {
    existing = JSON.parse(await fs.readFile(target, 'utf8'));
  } catch {}

  const wanted: { key: string; title: string }[] = [];
  for (const c of seeds) {
    wanted.push({ key: c.id, title: c.name.replace('Kerala Backwaters', 'Kerala') });
    for (const p of c.pois) wanted.push({ key: p.id, title: p.wiki });
  }
  const todo = wanted.filter((w) => !existing[w.key]);
  const out = { ...existing };
  const batches: { key: string; title: string }[][] = [];
  for (let i = 0; i < todo.length; i += 40) batches.push(todo.slice(i, i + 40));

  for (const batch of batches) {
    try {
      const res = await queryBatch(batch.map((b) => b.title));
      for (const w of batch) {
        const normalised = w.title.replace(/_/g, ' ');
        const hit =
          res[normalised] ||
          Object.entries(res).find(([t]) => t.toLowerCase() === normalised.toLowerCase())?.[1];
        if (hit) out[w.key] = hit;
        else console.log('MISS', w.key, '->', w.title);
      }
    } catch (e) {
      console.log('batch failed', (e as Error).message);
    }
    await new Promise((r) => setTimeout(r, 900));
  }
  await fs.writeFile(target, JSON.stringify(out, null, 2));
  console.log('total images:', Object.keys(out).length, '/ wanted', wanted.length);
}
main();
