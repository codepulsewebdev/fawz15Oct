import { provisionStaff } from './_staff.mjs';
import { auth, cleanPrice, cleanProductId, productKey, cleanText, currentUser, db, FieldValue, firebasePasswordLogin, handle, json, parseBody, requireCsrf, validTier } from './_shared.mjs';

const serializeDate = (value) => value?.toDate?.().toISOString() || value || null;
async function confirmPassword(admin, password) {
  if (!password) throw new Error('Confirm your administrator password.');
  await firebasePasswordLogin(admin.email, password);
}
async function listData() {
  const [usersSnap, ordersSnap, pricesSnap, settingsSnap] = await Promise.all([
    db.collection('users').get(),
    db.collection('orders').orderBy('createdAt', 'desc').limit(1000).get(),
    db.collection('product_prices').get(),
    db.collection('settings').doc('storefront').get()
  ]);
  return {
    users: usersSnap.docs.map(doc => { const d = doc.data(); return { id: doc.id, display_name: d.displayName || d.display_name || '', email: d.email || '', address: d.address || '', phone: d.phone || '', price_tier: d.tier || d.price_tier || 'A', role: d.role || 'approved_user', admin_approved: d.approved ?? d.admin_approved ?? false, disabled_at: d.disabled ? true : d.disabled_at || null }; }).sort((a,b)=>a.display_name.localeCompare(b.display_name)),
    orders: ordersSnap.docs.map(doc => { const d = doc.data(); return { ...d, id: doc.id, createdAt: serializeDate(d.createdAt) }; }),
    prices: Object.fromEntries(pricesSnap.docs.map(doc => [doc.data().productId||decodeURIComponent(doc.id), doc.data().tiers || {}])),
    settings: { showPrices: settingsSnap.exists ? settingsSnap.data().showPrices === true : true }
  };
}

export const handler = handle(async (event) => {
  const admin = await currentUser(event, { admin: true });
  if (event.httpMethod === 'GET') return json(200, await listData());
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  requireCsrf(event);
  const body = parseBody(event);
  const action = body.action;
  if (action === 'save-price') {
    const productId = cleanProductId(body.productId);
    if (!productId || !validTier(body.tier)) throw new Error('Invalid product or pricing group.');
    const price = cleanPrice(body.price);
    const ref = db.collection('product_prices').doc(productKey(productId));
    if (price == null) { if ((await ref.get()).exists) await ref.update({ [`tiers.${body.tier}`]: FieldValue.delete(), updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.id }); }
    else await ref.set({ productId, tiers:{[body.tier]:price}, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.id }, { merge: true });
    return json(200, { ok: true, price });
  }
  if (action === 'set-price-visibility') {
    const showPrices = body.showPrices === true;
    await db.collection('settings').doc('storefront').set({ showPrices, updatedAt: FieldValue.serverTimestamp(), updatedBy: admin.id }, { merge: true });
    return json(200, { ok: true, showPrices });
  }
  if (action === 'backup-catalogue') {
    if (!Array.isArray(body.catalogue) || !body.catalogue.length || body.catalogue.length > 20000) throw new Error('Invalid catalogue backup.');
    const catalogue = body.catalogue.map(item => ({ id: cleanProductId(item.id), name: cleanText(item.name, 240), category: cleanText(item.category, 160), page: cleanText(item.page, 180) })).filter(item => item.id);
    const pricesSnap = await db.collection('product_prices').get();
    const backupRef = db.collection('catalogue_backups').doc();
    const chunks = [];
    for (let index = 0; index < catalogue.length; index += 400) chunks.push(catalogue.slice(index, index + 400));
    const batch = db.batch();
    batch.set(backupRef, { createdAt: FieldValue.serverTimestamp(), createdBy: admin.id, productCount: catalogue.length, priceCount: pricesSnap.size, chunkCount: chunks.length, status: 'complete' });
    chunks.forEach((products, index) => batch.set(backupRef.collection('catalogue').doc(String(index).padStart(3, '0')), { products }));
    for (let index = 0; index < pricesSnap.docs.length; index += 300) {
      const prices = pricesSnap.docs.slice(index, index + 300).map(doc => ({ id: doc.id, tiers: doc.data().tiers || {} }));
      batch.set(backupRef.collection('prices').doc(String(index / 300).padStart(3, '0')), { prices });
    }
    batch.set(db.collection('settings').doc('latestBackup'), { backupId: backupRef.id, createdAt: FieldValue.serverTimestamp(), productCount: catalogue.length, priceCount: pricesSnap.size });
    await batch.commit();
    return json(201, { ok: true, backupId: backupRef.id, createdAt: new Date().toISOString(), productCount: catalogue.length, priceCount: pricesSnap.size });
  }
  await confirmPassword(admin, body.adminPassword);
  if(action==='provision-internal-staff')return json(200,{ok:true,results:await provisionStaff({auth,db,FieldValue,createdBy:admin.id})});
  if (action === 'create-user') {
    const email = cleanText(body.email, 200).toLowerCase();
    const password = String(body.password || '');
    const displayName = cleanText(body.displayName, 160), address = cleanText(body.address, 500), phone = cleanText(body.phone, 50), tier = body.tier;
    const role=body.role==='staff'?'staff':'approved_user';
    if (!email || !displayName || (role!=='staff'&&(!address||!phone)) || !validTier(tier)) throw new Error('Complete every customer field.');
    if(password.length<(role==='staff'?8:12))throw new Error('The password is too short for this account type.');
    const record = await auth.createUser({ email, password, displayName, disabled: false });
    await db.collection('users').doc(record.uid).set({ email, displayName, address, phone, tier, role, internalStaff:role==='staff', approved: true, disabled: false, mustChangePassword: false, createdAt: FieldValue.serverTimestamp(), createdBy: admin.id });
    return json(201, { ok: true });
  }
  const userId = cleanText(body.userId, 160);
  if (!userId) throw new Error('Invalid customer.');
  const ref = db.collection('users').doc(userId);
  if (action === 'set-tier') { if (!validTier(body.tier)) throw new Error('Invalid pricing group.'); await ref.set({ tier: body.tier, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); }
  else if (action === 'set-approved') await ref.set({ approved: Boolean(body.approved), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  else if (action === 'set-disabled') { await auth.updateUser(userId, { disabled: Boolean(body.disabled) }); await ref.set({ disabled: Boolean(body.disabled), updatedAt: FieldValue.serverTimestamp() }, { merge: true }); }
  else if (action === 'set-role') { if (!['admin', 'approved_user', 'staff'].includes(body.role)) throw new Error('Invalid role.'); await ref.set({ role: body.role, updatedAt: FieldValue.serverTimestamp() }, { merge: true }); }
  else if (action === 'update-contact') await ref.set({ address: cleanText(body.address, 500), phone: cleanText(body.phone, 50), updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  else throw new Error('Unknown administrator action.');
  await auth.revokeRefreshTokens(userId);
  return json(200, { ok: true });
});
