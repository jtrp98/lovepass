# Requests in the Pocket Love Ticket theme

The requests page now uses the same ivory paper, printed serials, horizontal perforations, Sarabun titles, small category SVGs and tier-specific ink as the coupon collection. Messages appear as handwritten notes on a lightly tinted paper insert. Approval uses solid ticket ink; rejection uses a restrained rose outline. Received and sent tabs share the collection's underline pattern.

`CouponRequestCard` reuses the existing ticket surface without a full-card click target: each approval, rejection or cancellation button keeps its own accessible target. Approved requests use the same decorative `REDEEMED ♡` watermark. Rejected and cancelled requests retain explicit text statuses. The approval review dialog uses the existing paper sheet, category drawing and message so the person can check the request before confirming.

The redemption list DTO adds `category` from the issued coupon snapshot, matching catalog/received-coupon behavior. This is additive and requires no new migration. Older responses that omit category use the existing heart fallback; no title-based inference is introduced.

Approval still opens a confirmation dialog, returns focus on close, and submits once. Reject/cancel actions, server refresh, disabled controls during a mutation, request errors, slow-response protection, loading and empty states are retained.

Browser evidence is in `requests-refresh/evidence.json` and `requests-refresh/screenshots/`. The existing UI suite also checks category artwork, approval/Escape/cancel behavior, rejection and sent-request cancellation. API requests are intercepted fixtures; live coupons and the database are not modified. TypeScript and scoped lint have no errors; the requests page retains its existing effect warning.
