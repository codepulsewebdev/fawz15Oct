import { cleanProductId, currentUser, db, handle, json, parseBody } from './_shared.mjs';
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const user = await currentUser(event);
  const settings = await db.collection('settings').doc('storefront').get();
  if (settings.exists && settings.data().showPrices !== true) return json(200, { prices: {}, pricesVisible: false });
  const ids = [...new Set((parseBody(event).productIds || []).map(cleanProductId).filter(Boolean))].slice(0, 100);
  const refs = ids.map(id => db.collection('product_prices').doc(id));
  const snaps = refs.length ? await db.getAll(...refs) : [];
  const prices = {};
  snaps.forEach((snap, index) => { const value = snap.data()?.tiers?.[user.tier]; if (Number.isFinite(value)) prices[ids[index]] = value; });
  return json(200, { prices, pricesVisible: true });
});
