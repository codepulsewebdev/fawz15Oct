import { auth, clientUser, cookie, csrfCookie, csrfToken, db, firebasePasswordLogin, handle, json, parseBody, profileData } from './_shared.mjs';
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const { email, password } = parseBody(event);
  const login = await firebasePasswordLogin(String(email || '').trim().toLowerCase(), String(password || ''));
  const snap = await db.collection('users').doc(login.localId).get();
  const user = profileData(login.localId, snap.data());
  if (!snap.exists || !user.approved || user.disabled) return json(403, { error: 'This account has not been approved.' });
  const hours = Math.min(Math.max(Number(process.env.SESSION_MAX_HOURS || 8), 1), 24);
  const maxAge = hours * 3600;
  const session = await auth.createSessionCookie(login.idToken, { expiresIn: maxAge * 1000 });
  const csrf = csrfToken();
  return json(200, { user: clientUser(user), csrfToken: csrf }, { 'set-cookie': [cookie('fawz_session', session, maxAge), csrfCookie(csrf, maxAge)] });
});
