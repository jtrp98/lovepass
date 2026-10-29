# A little coupon book for two

Reference: the supplied screenshot of My Coupons. Its repeated white panels, tiny rarity strips and full-width buttons obscure the character of a gift between partners.

Direction: a personal paper coupon book. Keep the cream/rose palette and locally hosted Sarabun/Mali fonts. Coupon faces now use cream paper, printed inset borders, rose titles, a short handwritten rarity label and a pastel detachable stub with the real available/pending quantity. Perforations run vertically, with die-cut notches above and below the stub. Emoji appear only inside the details dialog. The original SVG drawing of two little characters holding hands remains in the page introduction.

The primary action remains requesting a coupon; confirmation and server success still control redemption. Catalog selection still adds to the existing gift cart. Preserve loading, empty, error, retry and disabled states.

Compact cards: show title, short rarity, quantity on the stub and expiry. Catalog stubs carry a small handwritten dedication instead of a fictional quantity. Limit long titles to two lines; the dialog always shows the full title. The entire ticket is a native button target using a stretched button pseudo-element, with a visible keyboard focus outline. Descriptions, terms, exact counts and request messages remain inside the existing modal. Opening or closing it has no side effects. Pending-only coupons still open for reading, with requesting disabled. Catalog details open before explicitly adding a coupon to the gift cart.

Motion: stagger ticket entry, sway the drawing and float its heart for two cycles, gently turn the detachable stub on hover, press the ticket on touch/click, and animate dialogs and successful feedback. Ticket faces have no action text or arrow: a native button covers the whole ticket, keeps its descriptive accessible name, and shows a full-ticket keyboard focus ring. All motion stops under `prefers-reduced-motion`.

Research references: [Canva love coupon catalogue](https://www.canva.com/coupons/templates/love/), [Pattern Paste's split-stub voucher](https://patternpaste.com/pattern/gift-voucher-ticket.html), and [VectorStock's pink love coupons](https://www.vectorstock.com/royalty-free-vector/pink-love-coupons-with-hearts-vector-61775982). The useful shared ideas are a physical ticket silhouette, strong type, limited printed colors and a separate stub. Apply those principles in our own layout; do not copy supplied art. Avoid a floating emoji row and a full-width filled button inside every coupon.

Voucher styles live in `frontend/src/app/vouchers.css`, imported after the global Tailwind sheet. During preview the Tailwind/Turbopack loader served stale transformed global styles despite component refreshes; the plain CSS file renders current changes without that transform. Browser checks now assert the actual grid styling and side-by-side stub geometry, not only the presence of elements.

Responsive: one ticket column on phones, two from 768px on My Coupons; retain the catalog's one/two/three columns. Stack the note illustration below the text on small phones. Keep fixed gift actions above bottom navigation. Avoid gradients, constant confetti, heavy shadows, and new animation dependencies.

Verification: six flow unit tests passed, TypeScript passed, and ESLint reported no errors (13 existing hook warnings). The browser suite passed its request/retry, keyboard, responsive geometry, contrast, empty/error and reduced-motion checks. A final visual pass covered 320/390/768/1024/1440px, the compact mobile header, decorative SVG motion and keyboard dialog use; screenshots and results are saved here. Browser API responses use fixtures.

The paper-ticket pass also verifies actual cream background and grid styles, no emoji on ticket faces, and tapping the far-right stub at 320/390/768/1024/1440px opens the dialog without creating a redemption. Catalog reflow passes at 320/768/1440px. See `paper-verification.json` and the `paper-*` screenshots. The compact cropped mobile ticket is `screenshots/paper-ticket-mobile.png`.

Build limitation: `next build` failed in Turbopack while starting the CSS loader worker (`node process exited before we could connect`, exit code 0). The failure persisted outside the sandbox and with the bundled Node runtime. Production compilation remains unverified; no deployment was attempted.
