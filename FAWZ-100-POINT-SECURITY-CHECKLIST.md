# FAWZ six-page security review

Scope: `elastics.html`, `eyeletsAndPlier.html`, `horsehair.html`, `knittingAndCrochet.html`, `scissors.html`, `sewingNotions.html`.

Legend: **PASS** verified in this package; **HARDENED** improved in this package; **DEPLOYMENT** must be enforced by the host/server; **REVIEW** depends on files or services not included in this ZIP.

## Document and browser controls

1. PASS — HTML5 doctype present.
2. PASS — UTF-8 declared.
3. PASS — Mobile viewport declared.
4. HARDENED — Strict-origin referrer policy added to all pages.
5. HARDENED — Camera permission disabled.
6. HARDENED — Microphone permission disabled.
7. HARDENED — Geolocation permission disabled.
8. HARDENED — Browser payment capability disabled.
9. PASS — Page language declared.
10. PASS — No mixed-content HTTP URLs found in this package.
11. DEPLOYMENT — Force HTTPS.
12. DEPLOYMENT — Enable HSTS after HTTPS is confirmed everywhere.
13. DEPLOYMENT — Send `X-Content-Type-Options: nosniff`.
14. DEPLOYMENT — Send `X-Frame-Options: DENY` or CSP `frame-ancestors`.
15. DEPLOYMENT — Send a production Content-Security-Policy header.
16. DEPLOYMENT — Set a restrictive Cross-Origin-Opener-Policy.
17. DEPLOYMENT — Set an appropriate Cross-Origin-Resource-Policy.
18. DEPLOYMENT — Set an appropriate Cross-Origin-Embedder-Policy if compatible.
19. DEPLOYMENT — Remove server version headers.
20. DEPLOYMENT — Use correct MIME types for every asset.

## Links, navigation and external content

21. HARDENED — Unsafe link protocols are rejected at runtime.
22. HARDENED — New-tab links receive `noopener`.
23. HARDENED — New-tab links receive `noreferrer`.
24. HARDENED — Image URLs are restricted to safe protocols.
25. HARDENED — Images use a no-referrer policy.
26. HARDENED — Images default to lazy loading.
27. HARDENED — Images default to asynchronous decoding.
28. PASS — Local navigation uses relative links.
29. REVIEW — Confirm every destination page exists in the final site.
30. REVIEW — Confirm email links resolve to `sales@fawz.co.za` in the complete site.

## DOM and injection resistance

31. PASS — No `eval()` found.
32. PASS — No `document.write()` found.
33. PASS — Product titles are generally written through text properties.
34. REVIEW — Several trusted product templates still use `innerHTML`.
35. REVIEW — Keep product data static or sanitize it before inserting into templates.
36. REVIEW — Avoid inserting Firebase/user-controlled descriptions through `innerHTML`.
37. REVIEW — Replace inline `onclick` handlers during a future CSP refactor.
38. HARDENED — Dynamically added links and images are rechecked.
39. HARDENED — Dynamically added forms and fields are rechecked.
40. PASS — No JavaScript URL handlers found.
41. PASS — No iframe embedding found in the six pages.
42. PASS — No third-party analytics snippets found in the six pages.
43. REVIEW — Validate every image-bank key before production deployment.
44. REVIEW — Escape all future colour, size and variant labels before HTML insertion.
45. REVIEW — Never treat URL query values as trusted HTML.

## Forms and input handling

46. HARDENED — Unsafe form action protocols are removed.
47. HARDENED — Text inputs receive finite maximum lengths when absent.
48. HARDENED — Textareas receive finite maximum lengths when absent.
49. HARDENED — Spellcheck is explicitly configured.
50. REVIEW — Validate quantity as an integer within a sensible range.
51. REVIEW — Validate product IDs against the authoritative catalogue.
52. REVIEW — Validate variant IDs against their parent products.
53. REVIEW — Validate prices on the server, never only in the browser.
54. REVIEW — Reject negative, zero and non-finite quantities.
55. REVIEW — Normalize whitespace before server submission.
56. REVIEW — Rate-limit availability/contact submissions.
57. REVIEW — Add CSRF protection to state-changing server requests.
58. REVIEW — Add bot protection only where abuse warrants it.
59. REVIEW — Avoid exposing private customer data in form URLs.
60. REVIEW — Return generic errors without stack traces.

## Cart and local storage

61. HARDENED — Malformed cart JSON is caught safely.
62. HARDENED — Non-array cart data is rejected.
63. HARDENED — Non-object cart entries are rejected.
64. HARDENED — Cart length is capped at 250 entries.
65. HARDENED — Corrupt cart storage is cleared.
66. HARDENED — Cross-tab cart changes are revalidated.
67. REVIEW — Treat all localStorage values as untrusted on checkout.
68. REVIEW — Recalculate totals from server-side prices.
69. REVIEW — Prevent client-side price overrides.
70. REVIEW — Ensure stock is checked at order submission.
71. REVIEW — Use an idempotency key for order creation.
72. REVIEW — Do not store payment-card data locally.
73. REVIEW — Do not store authentication tokens in localStorage.
74. REVIEW — Clear abandoned sensitive checkout state.
75. REVIEW — Confirm `demo_cart.html` is production-ready before launch.

## Firebase, authentication and data

76. REVIEW — Firebase configuration files were not included in this ZIP.
77. REVIEW — Firebase Security Rules must deny unauthenticated writes by default.
78. REVIEW — Use least-privilege read rules for prices and products.
79. REVIEW — Restrict admin price writes by verified role claims.
80. REVIEW — Validate price schema in Firebase rules.
81. REVIEW — Validate product-ID schema in Firebase rules.
82. REVIEW — Enable Firebase App Check where supported.
83. REVIEW — Restrict authorised Firebase domains.
84. REVIEW — Do not ship service-account credentials to the browser.
85. REVIEW — Rotate any credential previously committed publicly.
86. REVIEW — Enable MFA for administrator accounts.
87. REVIEW — Enforce strong session expiry and revocation.
88. REVIEW — Log administrative price changes.
89. REVIEW — Back up pricing/product data and test restoration.
90. REVIEW — Keep development and production Firebase projects separate.

## Deployment and operations

91. DEPLOYMENT — Pin dependencies or use trusted versioned URLs.
92. DEPLOYMENT — Add Subresource Integrity to eligible third-party assets.
93. DEPLOYMENT — Scan deployed headers after every hosting change.
94. DEPLOYMENT — Disable directory listing.
95. DEPLOYMENT — Prevent source maps from exposing secrets or internal paths.
96. DEPLOYMENT — Configure safe 404 and error pages.
97. DEPLOYMENT — Monitor authentication and checkout failures.
98. DEPLOYMENT — Keep a tested incident-response and rollback procedure.
99. DEPLOYMENT — Run dependency and secret scanning in CI.
100. DEPLOYMENT — Repeat this review against the complete deployable site, not isolated pages.

## Result

All six supplied HTML files now load the same `fawz-security.js` layer and carry the same browser privacy controls. The package passes structural tag-balance checks and the shared JavaScript passes Node syntax validation. A final production security sign-off still requires the missing shared files, Firebase rules, cart/checkout code and hosting configuration.
