# FAWZ Secure Firebase Catalogue

## September admin and ordering update

- Public visitors can browse the catalogue without an account.
- Approved customers can add products to a cart and submit orders.
- Pricing groups are private and never named in the customer interface.
- A price appears only when an administrator has entered a price for the customer's assigned group.
- Administrators add customers with an email, chosen password, delivery address, phone number and private pricing group.
- CSV imports were replaced by a searchable manual pricing sheet containing every product ID detected in the catalogue and pricing template.
- Submitted orders are stored in Firestore without prices and can be downloaded from the admin portal.
- Order email notifications are optional through `SENDGRID_API_KEY`, `ORDER_NOTIFICATION_EMAIL`, and optionally `ORDER_FROM_EMAIL`.

Public visitors can browse product names, images and specifications. Prices, cart controls and ordering are available only to approved Firebase Authentication users. Every price request is resolved server-side using the user's Firestore tier profile.

## Included

- Firebase Authentication email/password login
- Admin-created accounts only; no public registration
- Firestore user approval, disable, role and Tier A–E controls
- Server-protected tier pricing
- HTTP-only, Secure, SameSite session cookies
- CSRF protection for administrator actions
- Forced temporary-password change
- Firebase password-reset email flow
- Administrator CSV price import and audit log
- Deny-by-default browser Firestore rules

## Deployment

1. Create the Firebase Firestore database in Production mode.
2. Enable Authentication > Email/Password.
3. Deploy "firestore.rules" with the Firebase CLI or paste it into Firestore > Rules.
4. In Firebase project settings, create a service account for the Netlify server. Never place its private key in browser code or commit it.
5. Set these Netlify environment variables:
   - FIREBASE_PROJECT_ID=fawzhabby-1d025
   - FIREBASE_WEB_API_KEY from the Firebase web config
   - FIREBASE_CLIENT_EMAIL from the service-account JSON
   - FIREBASE_PRIVATE_KEY from the service-account JSON
   - ALLOWED_ORIGINS=https://YOUR-SITE.netlify.app,https://YOUR-CUSTOM-DOMAIN
   - SESSION_MAX_HOURS=8
   - LOG_HASH_SALT to a long random value
   - FAWZ_ADMIN_TEMP_PASSWORD to a strong temporary password
   - CODEPULSE_TEMP_PASSWORD to a different strong temporary password
6. Install dependencies with "npm install".
7. Run "npm run init-firebase" once from a trusted local/admin environment.
8. Remove the two temporary-password environment variables after initialization.
9. Deploy to Netlify and sign in at "login.html".
10. Use "admin.html" to manage accounts and import "pricing-template.csv".

The initialization script prepares:
- UncleIsmail / fawzadmin@gmail.com — administrator, Tier A.
- CodePulse Web Dev / codepulsewebdev@gmail.com — approved customer, Tier A.

No passwords or private service-account credentials are included in this ZIP.
