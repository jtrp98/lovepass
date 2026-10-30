# Sent gifts in the Pocket Love Ticket theme

The sent-gifts history now uses one ivory paper sheet per gift batch, with the real batch number, total sheet count, sent date and handwritten gift message. A horizontal perforation separates the note from the coupon list. Coupon rows use the existing category SVG files and tier ink, separated by fine dashed rules instead of nested boxes, emoji and rarity pills.

Each row explicitly retains original quantity, remaining quantity and expiry. Remaining quantity is not labeled available: reservations are not exposed by this endpoint. Multiple gifts and all coupons stay visible; longer Thai text wraps. The page keeps its existing API loader, loading, error/retry and empty states. It remains read-only.

`SentGiftCard` is the reusable batch sheet. The sent-gift coupon DTO adds optional-compatible category metadata from its original snapshot; both the user and admin query mappings are updated. Missing category uses the existing heart fallback. No database migration or live gift mutation is involved.

Verification: TypeScript and scoped ESLint pass; the Application project builds with its existing nullability warning. Browser fixture checks cover 320/390/768/1440px, 14 sheets across seven types, remaining quantity zero, legacy category fallback, text-spacing reflow, API error/retry and empty-state recovery. Screenshots and evidence are in `sent-gifts-refresh/`. No real gifts or database records were changed.
