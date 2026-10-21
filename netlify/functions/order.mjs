import { orderDetails } from './_order-details.mjs';
import { cleanProductId, cleanText, currentUser, db, FieldValue, handle, json, parseBody, requireCsrf } from './_shared.mjs';
const cleanItem = (item) => ({ productId: cleanProductId(item.productId||item.id), name: cleanText(item.product || item.name || item.title || 'Product', 180), category: cleanText(item.category, 100), details: cleanText([item.gsm, item.size, item.color||item.colour, item.variant, item.material, item.pack, item.packaging].filter(Boolean).join(' · '), 240), quantity: Math.min(Math.max(parseInt(item.qty || item.quantity || 1, 10) || 1, 1), 9999) });
async function notify(order) {
  if (!process.env.SENDGRID_API_KEY || !process.env.ORDER_NOTIFICATION_EMAIL) return false;
  const lines = order.items.map(i => `${i.quantity} × ${i.name}${i.details ? ` (${i.details})` : ''}${i.productId ? ` [${i.productId}]` : ''}`).join('\n');
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', { method: 'POST', headers: { authorization: `Bearer ${process.env.SENDGRID_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ personalizations: [{ to: [{ email: process.env.ORDER_NOTIFICATION_EMAIL }] }], from: { email: process.env.ORDER_FROM_EMAIL || process.env.ORDER_NOTIFICATION_EMAIL, name: 'FAWZ Orders' }, subject: `New FAWZ order ${order.orderNumber}`, content: [{ type: 'text/plain', value: `Placed by: ${order.submittedBy.name} (${order.submittedBy.email})\nCustomer: ${order.customerName}\nEmail: ${order.email}\nPhone: ${order.phone}\nAddress: ${order.address}\nCourier: ${order.courierCompany}\n\n${lines}` }] }) });
  return response.ok;
}
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  requireCsrf(event);
  const user = await currentUser(event);
  const body = parseBody(event);
  const items = (Array.isArray(body.items) ? body.items : []).slice(0, 250).map(cleanItem).filter(i => i.productId || i.name);
  if (!items.length) return json(400, { error: 'Your cart is empty.' });
  const details=orderDetails(user,body,cleanText);
  const ref = db.collection('orders').doc();
  const order = { id: ref.id, orderNumber: `FAWZ-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${ref.id.slice(0, 6).toUpperCase()}`, userId: user.id, ...details, items, status: 'submitted', createdAt: FieldValue.serverTimestamp() };
  await ref.set(order);
  let emailed = false; try { emailed = await notify(order); } catch (error) { console.error('Order email failed', error); }
  return json(201, { ok: true, orderNumber: order.orderNumber, emailed });
});
