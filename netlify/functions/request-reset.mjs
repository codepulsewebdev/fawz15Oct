import { handle, json, parseBody } from './_shared.mjs';
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  const email = String(parseBody(event).email || '').trim().toLowerCase();
  if (email && process.env.FIREBASE_WEB_API_KEY) await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:sendOobCode?key=${encodeURIComponent(process.env.FIREBASE_WEB_API_KEY)}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ requestType: 'PASSWORD_RESET', email }) }).catch(() => {});
  return json(200, { message: 'If the account exists, a password-reset email has been sent.' });
});
