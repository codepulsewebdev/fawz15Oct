import { auth, clearCookies, currentUser, db, firebasePasswordLogin, handle, json, parseBody, requireCsrf } from './_shared.mjs';
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  requireCsrf(event); const user = await currentUser(event); const body = parseBody(event);
  await firebasePasswordLogin(user.email, String(body.currentPassword || ''));
  if (String(body.newPassword || '').length < 12) throw new Error('The new password must contain at least 12 characters.');
  await auth.updateUser(user.id, { password: body.newPassword });
  await db.collection('users').doc(user.id).set({ mustChangePassword: false }, { merge: true });
  await auth.revokeRefreshTokens(user.id);
  return json(200, { ok: true }, { 'set-cookie': clearCookies() });
});
