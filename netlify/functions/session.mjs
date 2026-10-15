import { clientUser, cookies, csrfToken, csrfCookie, currentUser, handle, json } from './_shared.mjs';
export const handler = handle(async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method not allowed.' });
  try {
    const user = await currentUser(event);
    let csrf = cookies(event).fawz_csrf;
    const headers = {};
    if (!csrf) { csrf = csrfToken(); headers['set-cookie'] = csrfCookie(csrf, 28800); }
    return json(200, { authenticated: true, user: clientUser(user), csrfToken: csrf }, headers);
  } catch (error) {
    return json(200, { authenticated: false });
  }
});
