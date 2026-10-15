import { readdir, readFile, writeFile } from 'node:fs/promises';
import { basename } from 'node:path';

const files = (await readdir(new URL('../', import.meta.url)))
  .filter((name) => name.endsWith('.html') && !['admin.html', 'login.html', 'demo_cart.html', 'index.html', 'home.html'].includes(name));
const products = new Map();

const clean = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
const add = (id, name, page, category = '') => {
  id = clean(id);
  if (!/^[A-Za-z0-9._-]{1,180}$/.test(id)) return;
  name = clean(name) || id.replace(/[-_]+/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  const current = products.get(id);
  if (!current || current.name === current.id) products.set(id, { id, name, category: clean(category) || clean(basename(page, '.html')), page });
};

for (const page of files) {
  const html = await readFile(new URL(`../${page}`, import.meta.url), 'utf8');
  for (const match of html.matchAll(/<article[^>]*data-product-id=["']([^"']+)["'][^>]*data-category=["']([^"']*)["'][^>]*>([\s\S]*?)<\/article>/gi)) {
    const heading = match[3].match(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/i)?.[1];
    add(match[1], heading, page, match[2]);
  }
  for (const match of html.matchAll(/\{[^{}]{0,900}?productId\s*:\s*["']([^"']+)["'][^{}]{0,900}?\}/g)) {
    const block = match[0];
    const name = block.match(/name\s*:\s*["']([^"']+)["']/)?.[1] || block.match(/title\s*:\s*["']([^"']+)["']/)?.[1];
    const category = block.match(/category\s*:\s*["']([^"']+)["']/)?.[1];
    add(match[1], name, page, category);
  }
  for (const match of html.matchAll(/["']([^"']+)["']\s*:\s*\{([^{}]{0,900})\}/g)) {
    const block = match[2];
    const id = block.match(/productId\s*:\s*["']([^"']+)["']/)?.[1] || match[1];
    const name = block.match(/name\s*:\s*["']([^"']+)["']/)?.[1] || block.match(/title\s*:\s*["']([^"']+)["']/)?.[1];
    if (/productId\s*:/.test(block)) add(id, name, page, block.match(/category\s*:\s*["']([^"']+)["']/)?.[1]);
  }
}

const pricingTemplate = await readFile(new URL('../pricing-template.csv', import.meta.url), 'utf8');
for (const line of pricingTemplate.split(/\r?\n/).slice(1)) {
  const id = line.split(',')[0]?.trim();
  if (id) add(id, '', '');
}

const output = [...products.values()].sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
await writeFile(new URL('../product-catalog.json', import.meta.url), JSON.stringify(output, null, 2) + '\n');
console.log(`Wrote ${output.length} products.`);
