import crypto from 'node:crypto';
import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { FieldValue, getFirestore } from 'firebase-admin/firestore';

const credentials = process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY
  ? cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') })
  : applicationDefault();
const app = getApps()[0] || initializeApp({ credential: credentials, projectId: process.env.FIREBASE_PROJECT_ID });
export const auth = getAuth(app);
export const db = getFirestore(app);
export { FieldValue };

export const json = (statusCode, body, headers = {}) => {
  const normal = { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers };
  const multiple = Array.isArray(normal['set-cookie']) ? { 'set-cookie': normal['set-cookie'] } : undefined;
  if (multiple) delete normal['set-cookie'];
  return { statusCode, headers: normal, ...(multiple ? { multiValueHeaders: multiple } : {}), body: JSON.stringify(body) };
};
export const parseBody = (event) => {
  try { return JSON.parse(event.body || '{}'); } catch { throw new Error('Invalid request body.'); }
};
export const cookies = (event) => Object.fromEntries((event.headers.cookie || '').split(';').map(x => x.trim()).filter(Boolean).map(x => { const i = x.indexOf('='); return [x.slice(0, i), decodeURIComponent(x.slice(i + 1))]; }));
export const cookie = (name, value, maxAge) => `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
export const csrfCookie = (value, maxAge) => `fawz_csrf=${encodeURIComponent(value)}; Path=/; Secure; SameSite=Strict; Max-Age=${maxAge}`;
export const clearCookies = () => ['fawz_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0', 'fawz_csrf=; Path=/; Secure; SameSite=Strict; Max-Age=0'];
export const csrfToken = () => crypto.randomBytes(24).toString('base64url');
export const validTier = (tier) => ['A', 'B', 'C', 'D', 'E'].includes(tier);
export const cleanText = (value, max = 300) => String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);
export const cleanProductId = (value) => /^[A-Za-z0-9._-]{1,180}$/.test(String(value || '')) ? String(value) : '';
export const cleanPrice = (value) => {
  if (value === '' || value == null) return null;
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0 || price > 10_000_000) throw new Error('Enter a valid non-negative price.');
  return Math.round(price * 100) / 100;
};
export const profileData = (uid, data = {}) => ({
  id: uid,
  email: data.email || '',
  displayName: data.displayName || data.display_name || '',
  tier: data.tier || data.price_tier || 'A',
  role: data.role || 'approved_user',
  approved: data.approved ?? data.admin_approved ?? false,
  disabled: Boolean(data.disabled || data.disabled_at),
  mustChangePassword: Boolean(data.mustChangePassword ?? data.must_change_password),
  address: data.address || '',
  phone: data.phone || ''
});
export const clientUser = (user) => ({ id: user.id, email: user.email, displayName: user.displayName, role: user.role, mustChangePassword: user.mustChangePassword, address: user.address, phone: user.phone });
export async function currentUser(event, { admin = false, approved = true } = {}) {
  const token = cookies(event).fawz_session;
  if (!token) throw Object.assign(new Error('Please log in.'), { statusCode: 401 });
  let decoded;
  try { decoded = await auth.verifySessionCookie(token, true); } catch { throw Object.assign(new Error('Your session has expired.'), { statusCode: 401 }); }
  const snap = await db.collection('users').doc(decoded.uid).get();
  const profile = profileData(decoded.uid, snap.data());
  if (!snap.exists || profile.disabled || (approved && !profile.approved)) throw Object.assign(new Error('This account is not approved.'), { statusCode: 403 });
  if (admin && profile.role !== 'admin') throw Object.assign(new Error('Administrator access required.'), { statusCode: 403 });
  return profile;
}
export function requireCsrf(event) {
  const stored = cookies(event).fawz_csrf || '';
  const supplied = event.headers['x-csrf-token'] || '';
  if (!stored || !supplied || stored.length !== supplied.length || !crypto.timingSafeEqual(Buffer.from(stored), Buffer.from(supplied))) {
    throw Object.assign(new Error('Your security token expired. Refresh and try again.'), { statusCode: 403 });
  }
}
export async function firebasePasswordLogin(email, password) {
  const key = process.env.FIREBASE_WEB_API_KEY;
  if (!key) throw new Error('FIREBASE_WEB_API_KEY is not configured.');
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(key)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password, returnSecureToken: true }) });
  const data = await response.json();
  if (!response.ok) throw Object.assign(new Error('Invalid email or password.'), { statusCode: 401 });
  return data;
}
export const handle = (fn) => async (event, context) => {
  try { return await fn(event, context); }
  catch (error) { console.error(error); return json(error.statusCode || 400, { error: error.statusCode >= 500 ? 'Server error. Please try again.' : error.message }); }
};
