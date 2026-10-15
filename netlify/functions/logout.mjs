import { clearCookies, handle, json } from './_shared.mjs';
export const handler = handle(async () => json(200, { ok: true }, { 'set-cookie': clearCookies() }));
