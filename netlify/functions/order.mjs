import { notifyOrder } from './_order-email.mjs';
import { orderDetails } from './_order-details.mjs';
import { cleanProductId, cleanText, currentUser, db, FieldValue, handle, json, parseBody, requireCsrf } from './_shared.mjs';
const cleanItem = (item) => ({ productId: cleanProductId(item.productId||item.id), name: cleanText(item.product || item.name || item.title || 'Product', 180), category: cleanText(item.category, 100), details: cleanText([item.gsm, item.size, item.color||item.colour, item.variant, item.material, item.pack, item.packaging].filter(Boolean).join(' · '), 240), quantity: Math.min(Math.max(parseInt(item.qty || item.quantity || 1, 10) || 1, 1), 9999) });
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  requireCsrf(event);
  const user = await currentUser(event);
  const body = parseBody(event);
  if(Object.hasOwn(body,'cartOwnerId')&&body.cartOwnerId!==user.id)return json(409,{error:'Your account session changed. Reload the page before submitting an order.'});
  if(Array.isArray(body.items)&&body.items.length>250)return json(400,{error:'This order has more than 250 line items. Split it into separate orders so every item is included.'});
  const items = (Array.isArray(body.items) ? body.items : []).map(cleanItem).filter(i => i.productId || i.name);
  if (!items.length) return json(400, { error: 'Your cart is empty.' });
  const details=orderDetails(user,body,cleanText);
  const ref = db.collection('orders').doc();
  const order = { id: ref.id, orderNumber: `FAWZ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${ref.id.slice(0, 6).toUpperCase()}`, userId: user.id, ...details, items, status: 'submitted', placedAtISO:new Date().toISOString(), createdAt: FieldValue.serverTimestamp() };
  await ref.set(order);
  const notification=await notifyOrder(order);
  try{await ref.update({notification:{...notification,attemptedAt:FieldValue.serverTimestamp()}})}catch{console.error('Order saved; notification status could not be recorded.')}
  return json(201, { ok: true, orderId:ref.id, orderNumber: order.orderNumber, emailed:notification.status==='accepted', notificationStatus:notification.status, notificationError:notification.status==='failed'?notification.error:undefined });
});
