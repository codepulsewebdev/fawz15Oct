import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read=name=>readFile(new URL(`../${name}`,import.meta.url),'utf8');
test('catalogue contains a large unique product set',async()=>{const products=JSON.parse(await read('product-catalog.json'));assert.ok(products.length>=850);assert.equal(new Set(products.map(x=>x.id)).size,products.length)});
test('customer UI does not reveal pricing groups',async()=>{const site=await read('fawz-site.js'),protection=await read('fawz-content-protection.js');assert.doesNotMatch(site,/Signed in as[^']*Tier/i);assert.doesNotMatch(protection,/TIER \$\{/)});
test('customer session payload omits the private pricing group',async()=>{const shared=await read('netlify/functions/_shared.mjs');const publicShape=shared.match(/export const clientUser[\s\S]*?\);/)?.[0]||'';assert.ok(publicShape);assert.doesNotMatch(publicShape,/tier/i)});
test('orders are sanitized server-side without prices',async()=>{const order=await read('netlify/functions/order.mjs');assert.match(order,/const cleanItem/);assert.doesNotMatch(order,/unitPrice|unit_price|grandTotal/)});
test('admin dashboard uses manual pricing and includes customer delivery fields',async()=>{const admin=await read('admin.html');assert.match(admin,/Products &amp; prices/);assert.match(admin,/name="address"/);assert.match(admin,/name="phone"/);assert.doesNotMatch(admin,/type="file"|Import pricing tiers/)});
test('full manifest contains products, variants and categories',async()=>{const manifest=JSON.parse(await read('product-manifest.json'));assert.ok(manifest.products.length>=1500);assert.equal(new Set(manifest.products.map(x=>x.product_id)).size,manifest.products.length);assert.ok(new Set(manifest.products.map(x=>x.category)).size>=30)});
test('price visibility is enforced server-side and hidden blocks cannot render',async()=>{const prices=await read('netlify/functions/prices.mjs'),secure=await read('fawz-secure-pricing.js');assert.match(prices,/showPrices/);assert.match(secure,/\[hidden\].*display:none!important/)});
test('admin supports Firebase catalogue backups and website catalogue search',async()=>{const api=await read('netlify/functions/admin.mjs'),search=await read('fawz-catalogue-search.js');assert.match(api,/backup-catalogue/);assert.match(api,/catalogue_backups/);assert.match(search,/product-manifest\.json/);assert.match(search,/All categories/)});
