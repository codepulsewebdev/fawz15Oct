# FAWZ catalogue and staff ordering update

Base: the most recently supplied fawz15Oct-main(1).zip.

## Included

- Updated pin packing quantities, including tubs/cards per box and gold/silver safety-pin quantities. Loose gold blanket pins use 144 pieces for both sizes; loose silver uses 100 pieces.
- Admin catalogue rebuilt with 5,259 unique entries. Every entry is reachable through pagination; search includes names, variants, packing and IDs. Product details show packing and link to the catalogue page.
- Preserved existing catalogue IDs and pricing records. Added missing selectable products and variants; restored the ribbon page and missing broach/hook-and-loop pages from the first supplied archive.
- A small cart confirmation at the top of the screen automatically disappears after 3.2 seconds. Repeated additions reuse the same notice. Machine and eyelet confirmations also dismiss without clicking X.
- Staff can enter a different customer name, email, telephone and delivery address for each order. The server records the authenticated staff member separately. Customer fields clear after successful submission; failed submissions keep the cart and entered details.
- Removed the requested selections-persist instruction from checkout. Fixed empty-cart rendering and made cart item text safe to display.
- Admin order lists and downloads identify who placed the order.

## Activate the seven internal staff accounts

After deploying this ZIP to the existing Firebase-connected site:

1. Log in to the administrator account.
2. Open Customers.
3. Click "Set up the 7 staff accounts" and confirm the administrator password.

This creates Ismail, Yusuf, Anisa, Tasneem, Raeesah, Zaeed and Huzaifah using the exact email addresses and shared password supplied for this task. The shared password is kept in server-only provisioning code, never in browser JavaScript. FAWZ_STAFF_PASSWORD can override it on the server. Existing account passwords and administrator roles are preserved; existing matching accounts are given internal staff access.

Live accounts have not been created from this workspace: Firebase credentials were unavailable. No deployment was performed.

## Verification

All 13 automated checks pass, including all admin pages, product search/selection, customer separation, failed/successful checkout and repeatable staff setup. JavaScript syntax and ZIP integrity were checked. The browser preview stopped before interactive testing completed, so live browser and Firebase integration still require verification after deployment.

## Source limitations

The supplied archives contain no product image directory. Keep the existing images directory when applying this update to the live site.
Calabash assorted was not present in either supplied catalogue. Its requested 12-cards-per-box packing remains pending until that product is added; no unverified product or image was invented.

To rebuild the admin catalogue after future product changes: npm run build-catalogue.
