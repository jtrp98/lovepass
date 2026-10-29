# Love Pass — Pocket Love Ticket

Design date: 30 October 2026. Working preview: `/design/love-pass`. Product integration: `/my-coupons` and `/catalog`.

## 1. Critique of the current design

The supplied attachment contains the brief only, with no separate images. This audit refers to the existing implementation and `screenshots/paper-coupons-1440.png`, not an unseen attachment. The working tree already contained an earlier ticket redesign; this change builds on that work without replacing unrelated pages.

| Area | Observation | Decision |
| --- | --- | --- |
| Hierarchy | The oversized “2” dominates the pastel stub. The promise has less visual weight. | Make the Thai title the largest text; put quantity in a sentence on the lower stub. |
| Thai typography | Mali lends warmth but repeating it across headings, quantity and rarity makes all information sound handwritten. Metadata at 10–12px competes poorly. | Use local Sarabun 600 for titles, Sarabun 400 for function, Mali only for the note. Metadata remains supplementary. |
| Composition | The vertical panel divides a small card into narrow compartments. The middle of the face is empty because the personal note is absent. | Replace it with a horizontal tear line and a coherent title/note/illustration face. |
| Color | Rose titles and bright rarity strips repeat the app chrome. All tickets share the same emotional voice. | Mint/ink green for warmth, lavender/plum for a wish, ivory for both. Rose is reserved for the memory stamp. |
| Emotional character | The warm message only appears after opening. The larger page mascot supplies most of the personality. | Put the message and a small original pen drawing on each ticket. |
| Tactility | Double rectangles, notches and a solid offset shadow read as a decorated component. | Fine border, low-opacity grain, short dashed perforation, restrained paper shadow. |
| Affordance | A transparent full-surface button has an accessible name but no visible action in the current source. | Keep full-card tapping, with an explicitly printed “เปิดใช้สิทธิ์ ↗” action and a whole-card focus outline. |
| Action | Users must discover that the face is interactive. | Give the action its own ink-filled 44px target in the stub. Keep reading and requesting separate. |
| Status and quantity | “2” with “ใบพร้อมใช้” can still imply two hugs; pending-only cards reuse the quantity panel. No archived states appear here. | Say “คูปองพร้อมใช้ 2 ใบ”. Show text + symbol for state. Explain coupon sheets versus the promise in detail. |
| Collectibility | Cards have no visible individual identifier or used-state memory treatment. | Add the real source ID, preserve notes in all states, and use a readable ink stamp after approval. |

Retain: Thai-first content, local fonts, familiar rarity colors, grouping only identical snapshots, expiry, API errors and partner confirmation. Remove from these cards: giant numerals, emoji stickers, invisible CTAs, split sidebars and clamped titles. Reconsider: the card is a small letter with a functional stub, rather than a data panel with a decorative border.

## 2. Three creative directions

The preview includes actual styled studies for all three directions, followed by a fully interactive A collection.

| Direction | Visual language and emotion | Strength | Weakness |
| --- | --- | --- | --- |
| A — Pocket Love Ticket | Ivory ticket, pen drawings, printed serial, handwritten note, horizontal perforation. Intimate and familiar. | Fast to scan, compact enough for a daily collection, easy to reuse across coupon types. | Grain and perforations must be restrained to avoid becoming a costume. |
| B — Love Receipt Machine | Narrow paper receipt, serrated edge, machine number, timestamp, monospaced ledger. Clever and surprising. | Memorable gifting moment and strong narrative for a reveal. | Tall receipts slow collection scanning; purchase language can feel transactional. |
| C — Digital Love Keepsake | Layered lavender paper, small foil accent, editorial typography. Precious and contemporary. | Strong for rare gifts and a collectible archive. | Layering and foil can distract or make ordinary use feel overly ceremonial. |

Recommendation: A for daily use, borrowing C's stationary 7px foil mark in the collection heading. No shimmering surfaces, moving light or 3D tilt. The perforation is horizontal to preserve Thai reading width. The stub contains sender, sheet count and action: meaningful reasons for it to exist.

## 3. High-fidelity components and states

`LoveTicket` is the shared responsive card; `TicketDetail` is its expanded paper interior; `TicketRequest` is the two-stage request form. Both coupons appear in available, used and expired tabs in the preview. An additional pending tab is populated by trying the request flow.

- **Unlimited hugs:** mint/green, two embracing figures, “เหนื่อยเมื่อไหร่ ก็มากอดกันนะ ♡”. One coupon sheet; its explicit sample terms promise unlimited hugs until expiry. The sheet count never becomes a hug count.
- **One special wish:** lavender/plum, a folded wishing star, “ขอมาได้หนึ่งอย่าง เราจะตั้งใจฟังเลย”. Two sheets initially; each sheet permits one wish. Requesting one preserves the other sheet.
- **Available:** named status + dot, full-strength paper, visible primary action.
- **Pending:** named status + clock symbol, outlined detail action. No additional redemption of the reserved sheet.
- **Used:** named status + check, a diagonal monospaced “REDEEMED ♡” watermark at 10% opacity behind the content. The original note and drawing remain readable. The detail action remains enabled; redemption is unavailable. In the preview, opening a used coupon shows a small receipt keepsake with its note, sender/recipient and real ticket ID.
- **Expired:** named status + crossed-circle symbol, dashed perimeter, neutral ink. The detail remains readable and openable, with a disabled redemption control.
- **Expanded:** large note and illustration, sender/recipient when known, status, quantity, expiry and exact terms. Native modal dialog provides background inertness, Escape, focus trapping, scroll lock and focus return.

## 4. Design system

### Color tokens

| Token | Value | Role |
| --- | --- | --- |
| `--pocket-paper` | `#FFF9F0` | Printed card and sheet |
| `--pocket-canvas` | `#F5F2EA` | Preview desk background |
| `--pocket-ink` | `#30473F` | Primary text/action |
| `--pocket-muted` | `#62675E` | Metadata |
| `--pocket-line` | `#D8D8CB` | Decorative dividers, never required to identify the action |
| `--pocket-mint` | `#DCEFE5` | Hug accents |
| `--pocket-plum` | `#5A4077` | Wish ink/action |
| `--pocket-lavender` | `#E9E1F7` | Wish accents |
| `--pocket-rose` | `#A84458` | Decorative used watermark, rendered at 10% opacity |
| `--pocket-butter` | `#F5E8B8` | Legendary paper accent |

The brief's `#D9657A` rose is darkened for small ink text. Existing app tokens and branding outside the ticket components are retained. Color always accompanies words or symbols.

### Type, rhythm and surfaces

- Fonts: existing locally hosted Sarabun 400/600 and Mali 600; no new font dependency or runtime font network request. Sarabun prioritizes familiar readable Thai; Mali is a personal annotation, never a functional body face. System monospace is restricted to Latin IDs and edition numbers.
- Scale: collection heading 28–40px (preview 32–48), card title 24–30px at 1.5 line height, sheet title 24px, body 16px, note 13–16px at 1.9, information 12–14px, Latin serial 10px. All content that determines redemption also appears at 14px in detail.
- Spacing: 4px base; 8, 12, 16, 20, 24, 32, 40px intervals. Card horizontal padding 24px desktop/20px mobile; collection gutter 24px. The 7px foil and 12px punch details are optical exceptions.
- Card: fluid width, no fixed height; about 484px wide in the 1040px preview at desktop and 288px at a 320px viewport. Height grows with real Thai text and text-spacing overrides. No text clamp or line truncation.
- Grid: one column below 768px, two from 768px. Narrow cards can wrap their lower stub into two rows. At 320px the action retains its 44px minimum height. No horizontal scrolling.
- Border: 1px ink at 25% mixed with ivory, radius 8px. Perforation: 3px dash / 5px gap centered in a 16px strip; 12px edge punch impressions. They are decorative and do not imply a drag requirement.
- Grain: inline SVG fractal noise, three octaves, base frequency .8, 3.5% opacity. It contributes no content and has no network dependency. No raster screenshots are used as UI.
- Shadow: `0 2px 2px #30473f06, 0 8px 20px -12px #30473f35`; hover `0 8px 18px -10px #30473f45`.
- Illustration: original SVG in one ink, 1.7-unit round strokes on a 120×110 viewBox; 60–88px on cards and 88px in detail. Small irregularities, no emoji or stock clip art. SVG is hidden from assistive technology because adjacent copy provides meaning.
- Touch/focus: actions minimum 44px, form controls 48px, clear 3px focus ring. The visible action's pseudo-element makes the rest of the ticket clickable without adding another tab stop or nesting buttons.

## 5. Interaction specification

| Trigger | Behavior | Timing |
| --- | --- | --- |
| Pointer hover on ticket | Paper lifts 3px, shadow deepens; no rotation or stub tearing | 180ms ease |
| Press action | Inset ink shadow suggests pressure without moving the full-card hit target | 120ms ease |
| Tap card / Enter on action | Open native modal with the note on a quiet tinted paper insert | 280ms, existing `content-arrive` easing |
| Select “ขอใช้ใบนี้” | Replace the message form with a confirmation summary; focus confirmation heading | Immediate |
| Confirm | Submit once, disable actions while busy, keep errors in the sheet | Request-dependent |
| Successful real request | Announce success, close sheet, reload server-owned available/reserved quantities | No optimistic “used” stamp |
| Partner approval in preview | Explicit “จำลองแฟนยืนยัน” control produces a watermarked used sheet and a receipt keepsake with a serrated paper edge | Receipt 220ms ease-out, translateY(-6px) → 0 |
| Close / Escape | Restore focus to original action; use page heading if the action has disappeared | Immediate cleanup |
| Reduced motion | All transitions/entry/receipt animations disabled; hover/press displacement disabled | Immediate |

The tear line organizes a single object; it is not an extra gesture. A simulated request moves exactly one sheet to pending. Approval watermarks that sheet only and produces its receipt. The watermark is decorative, ignores pointer input, and is hidden from assistive technology; the explicit used status remains readable. Receipt barcodes are decorative and no purchase amounts or timestamps are invented. Rejection/cancellation remain handled by the existing requests page and backend. No decorative animation delays a usable action.

## 6. Implementation boundaries

Production requests still use the existing API, duplicate-submit lock, Thai error messages and server refresh. Catalog selection still updates the existing gift cart. No authentication or authorization logic changes. No dependencies added.

The current `GetMyCouponsQuery` excludes used/expired coupons. Their fully functional component designs are demonstrated with clearly labeled fixture data in the public `/design/love-pass` preview; this does not claim to add a persistent backend archive. Actual coupon descriptions supply the note in production because the coupon DTO does not expose the original gift message or sender display name. Generic sender copy is used when a name is unknown. The preview's เจ/recipient and notes are fictional examples.

The backend counts issued sheets. “Unlimited hugs” is the emotional promise printed on one sheet, not a new unbounded API redemption policy. Do not silently change that contract based on the title. A future archive or recurring entitlement feature needs an explicit data/API decision.

The preview resets on reload and its reset button; it never sends real redemptions. It remains available without signing in so the visual work is reviewable.

## Verification

The watermark and receipt update is captured in `receipt-refresh/pocket-verification.json` and `receipt-refresh/screenshots/`. It verifies decorative watermarks on used cards, reopening used coupons as receipts, confirmation receipts, hidden modal scrollbars and reduced-motion receipt rendering, alongside the existing coupon checks.

See `pocket-verification.json` and `screenshots/pocket-*` for browser assertions and visual evidence. Eight focused browser checks pass, including five viewport sizes, all coupon states, confirmation and sheet accounting, actual product request/retry behavior, gift cart, keyboard focus, text-spacing reflow and reduced motion. Eight specified paper/accent text pairs exceed 4.5:1. The existing application suite also passes all 37 reported checks, including 45 route/viewport geometry combinations and 28 existing palette contrast pairs. Tests use intercepted API fixtures, not live partner requests.

Six existing unit tests pass; `tsc --noEmit` passes; ESLint reports zero errors and 13 existing warnings. `npm run build` remains unverified: Turbopack's CSS worker exits before connecting, including outside the sandbox. The same failure was already recorded in `design-notes.md`. No deployment was attempted.

Run `npm run test:pocket` for focused browser checks and `npm run test:ui` for the existing regression suite. Both use the existing Playwright convention: set `PLAYWRIGHT_MODULE` to an available Playwright module directory and optionally `PLAYWRIGHT_CHROMIUM_EXECUTABLE` to the browser executable. `UI_TEST_URL=http://localhost:3000` selects the running local preview; `UI_TEST_OUT` gives the regression suite a separate output folder. Existing unrelated working-tree changes and original screenshot evidence are preserved.
