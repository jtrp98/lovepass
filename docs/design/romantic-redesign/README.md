# Romantic analog redesign

Implemented 30 October 2026. The existing Next.js 16.4.3, React 19.3, Tailwind CSS v4, local Sarabun/Mali fonts, API contracts, and approval workflow are retained. No dependencies were added.

## Audit and design contract

The source confirmed the earlier audit: Pocket declared a separate green palette, page selectors replaced shared button colors and hover states, ticket holes painted a fixed canvas color, and an unused voucher stylesheet was imported globally. The existing ticket's printed serial number, category artwork, perforation, and separate stub were worth retaining. Its used watermark was too faint to explain a meaningful memory.

The design contract is cream stationery on a blush canvas, rose-brown reading ink, dusty rose stamp ink, and restrained blue/lilac/gold rarity accents. Sarabun carries controls and detailed content; Mali is reserved for headings and personal notes. Existing layouts and primary actions remain recognizable. Mobile layouts stack content, preserve 44px or larger actions, and allow Thai text to wrap.

The central palette and material tokens live in `frontend/src/app/globals.css`. Pocket names now alias those tokens. `pocket.css` supplies object geometry, not a second theme. Existing Tailwind spacing is retained alongside shared paper spacing, radius, shadow, grain, and motion tokens. Status and rarity tokens give colors product meanings.

## Components and interaction

- `Card` now has paper, letter, booklet, and journal materials. Operational/admin cards use the plain paper default.
- `Button` variants own normal, hover, active, focus, disabled, and small-size behavior. Page selectors no longer replace their appearance. Invalid fields gain an explicit error border/surface.
- `LoveTicket` retains its printed face and tear-off stub. A masked perforation reveals whatever background is actually underneath. Used tickets retain their rarity ink and artwork.
- `RubberStamp` is the only new component. Its rotated double border and uneven ink treatment mark confirmed use. It displays an actual timestamp when supplied; it never substitutes expiry or today's date for an unknown redemption date.
- Approval animation is enabled after a successful approval request and rendered only when refreshed data is `APPROVED`. A failed approval shows an error and no stamp. Switching request direction clears the recent animation marker.
- Pending tickets use a separate annotation and accessible status. The used stamp is decorative; adjacent text still communicates state.
- The receipt includes the actual redemption date when available. History stamps use the event timestamp. Production API fields and coupon ownership/grouping are unchanged.
- The landing example now reuses the actual ticket/detail components. It is explicitly labeled as an example, and opening it does not send a request.
- Reduced motion disables animations/transitions and ticket lift. The press response belongs to the ticket container so its full-card button overlay remains clickable.

## Routes

| Area | Treatment |
| --- | --- |
| `/catalog`, `/my-coupons`, `/design/love-pass` | Shared collectible tickets, semantic rarity colors, real notches, clear pending/used states |
| `/requests` | Printed request slips, personal notes, confirmed dated stamp |
| `/dashboard` | Journal margin, existing couple drawing, paper summaries |
| `/sets`, `/gifts/new` | Layered coupon booklets, letter-style message form, post-success feedback |
| `/sent-gifts` | Postcard surface, postage detail, preserved gift contents |
| `/history` | Taped keepsakes in existing chronological order; dated used stamps |
| `/couple`, `/couple/accept`, `/more` | Shared journal and invitation stationery |
| `/`, `/login`, `/register`, `/forgot-password`, `/reset-password`, `/privacy` | Unified palette, readable Thai forms, shared paper materials and controls |
| `/admin/dashboard`, `/admin/coupons`, `/admin/sets`, `/admin/users`, `/admin/overview` | Same tokens and controls; compact tables/forms retain operational clarity |

My Coupons continues to show the available/reserved data its existing API supplies. Confirmed use is represented in Requests and History. No artificial used-coupon records or new workflow were introduced.

## Changed files

Paths below are relative to the repository root.

| Files | Purpose |
| --- | --- |
| `frontend/src/app/globals.css`, `frontend/src/app/pocket.css` | Central tokens, material geometry, control states, stamp motion, responsive/reduced-motion behavior |
| `frontend/src/app/layout.tsx` | Remove legacy voucher import |
| `frontend/src/app/vouchers.css` (deleted) | No remaining source consumers; remove obsolete parallel ticket styling |
| `frontend/src/components/ui.tsx` | Material variants and shared control/rarity/status styles; remove superseded landing-only CouponCard |
| `frontend/src/components/rubber-stamp.tsx` (new) | Reusable dated used stamp |
| `frontend/src/components/love-ticket.tsx`, `frontend/src/components/coupon-request-card.tsx`, `frontend/src/components/redemption-receipt.tsx` | Shared stamp integration and actual-date presentation |
| `frontend/src/app/page.tsx`, `frontend/src/app/design/love-pass/page.tsx` | Shared landing ticket; explicit demo redemption timestamps |
| `frontend/src/app/(auth)/layout.tsx` | Letter material across authentication forms |
| `frontend/src/app/(user)/dashboard/page.tsx`, `frontend/src/app/(user)/couple/page.tsx`, `frontend/src/app/(user)/couple/accept/page.tsx`, `frontend/src/app/(user)/more/page.tsx` | Journal/invitation materials and existing illustration |
| `frontend/src/app/(user)/sets/page.tsx`, `frontend/src/app/(user)/gifts/new/page.tsx`, `frontend/src/app/(user)/history/page.tsx`, `frontend/src/app/(user)/requests/page.tsx` | Booklets, gift stationery, scrapbook, success-gated stamp feedback |
| `frontend/src/app/admin/coupons/page.tsx`, `frontend/src/app/admin/users/page.tsx` | Replace hardcoded white surfaces with the central surface token |
| `frontend/tests/pocket-ui.mjs`, `frontend/tests/ui.mjs` | Stamp/date assertions, failed-approval regression, disabled-hover checks, current token contrast |

## Verification

- `npm run build`: passed; all application routes prerendered successfully.
- `npx tsc --noEmit`: passed.
- `npm test`: all 7 flow tests passed.
- `npm run lint`: no errors; 14 existing warnings about state in effects and the PostCSS default export. A final `npm run lint -- --quiet` passed.
- `npm run test:pocket`: passed. Covers 320/390/768/1024/1440 layouts, ticket states, whole-card taps, keyboard/dialog focus, reduced motion, text spacing, confirmation/retry, no duplicate requests, and the catalog cart action.
- `npm run test:ui` against the production build: passed. Covers authentication return paths, approval failure/retry, rejection/cancellation, gifts and quantity limits, stale response handling, 14 endpoint error/retry recoveries, 45 route/viewport geometry checks, 28 rendered contrast pairs, empty states, and session recovery.
- Additional browser checks: 28 route/viewport combinations for couple/history/sent gifts/more and landing/auth/privacy; actual history stamp date; landing sample open/Escape behavior; no page errors.
- Visually inspected desktop/mobile ticket states, dashboard, checkout, approved requests, couple journal, history, sent gifts, landing, and login screenshots. Full-page screenshots place fixed navigation at the original viewport edge; content remains scrollable beneath it.

Browser evidence is in [evidence.json](evidence.json), [pocket-verification.json](pocket-verification.json), [additional-checks.json](additional-checks.json), and [screenshots](screenshots/).

Representative views: [ticket collection](screenshots/pocket-cards-1440.png), [dashboard](screenshots/dashboard-1280.png), [history](screenshots/history-320.png), [sent gift](screenshots/sent-gifts-320.png), [landing](screenshots/landing-1440.png), [login](screenshots/login-320.png).

Browser integration checks use deterministic intercepted API responses, not live accounts or database writes. Live backend persistence, Google OAuth, email delivery, and non-Chromium browser engines were not exercised. No deployment was performed. The pre-existing theme audit (now `docs/archive/theme-audit.md`) was left untouched.

## Material layer (second pass)

No image-generation tool was available, so every material is authored or procedurally generated SVG in `frontend/public/materials/`. Geometric assets (guilloché, frame corners, postmark waves, postage stamp) are produced by `frontend/scripts/materials.mjs`; paper fibre, washi tape and wax seal are hand-authored. Text and state stay in HTML.

| Asset / component | Use |
| --- | --- |
| `paper/paper-fiber.svg` | `--paper-grain` for every paper surface: mottling, two fibre directions, grain, flecks |
| `tickets/guilloche.svg`, `tickets/corner-*.svg` | Security-print stub pattern; printed frame corners |
| `stamps/postage-heart.svg`, `stamps/postmark-waves.svg` | Sent-gift postcard stamp and cancellation |
| `illustrations/wax-seal.svg`, `paper/washi-tape.svg` | Letter material, envelope flap; scrapbook entries |
| `components/material-defs.tsx` | Root SVG filters: `lp-stamp-ink` (rubber edge, ink gaps, uneven pressure), `lp-print`, `lp-torn` |
| `components/rubber-stamp.tsx` | Round postmark through the ink filter; optional stamper press animation |
| `components/stationery.tsx` | `Envelope` (opens once; resting state open for reduced motion), `WaxSeal`, `StationeryIcon` (replaces emoji illustrations) |

The love ticket is now a die-cut silhouette: each paper part masks its own concave corners or notches and the parent drop-shadow traces the cut edge. The perforation is a row of punched holes, the face carries a double printed rule with corner ornaments, a numbering-machine serial, rarity pips and a halftone emblem; the stub carries guilloché. Used tickets are postmarked across the emblem; pending tickets are held by a paper clip; expired tickets age to warmer stock. The ticket action sits outside the masked stub (subgrid + grid-item `z-index`) so its overlay still makes the whole ticket tappable.

`animate` on `RubberStamp` is still only set after a successful approval; stored used tickets render the final impression without motion.
