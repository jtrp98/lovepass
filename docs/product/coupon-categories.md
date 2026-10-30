# Coupon categories and shared SVG illustrations

Category describes the promise and chooses the illustration. Rarity/tier describes how special the coupon is and chooses its ink/paper colors. They are independent: a wish may be COMMON or LEGENDARY and still use the same star SVG. Neither artwork nor category is inferred from the coupon title.

## Categories

| API value | Thai label | Shared asset |
| --- | --- | --- |
| `AFFECTION` | กอดและความรัก | `frontend/public/illustrations/coupons/affection.svg` — embracing figures |
| `TOGETHER` | เวลาด้วยกัน | `frontend/public/illustrations/coupons/together.svg` — clock and heart |
| `FOOD` | มื้ออร่อย | `frontend/public/illustrations/coupons/food.svg` — plate and cutlery |
| `CARE` | ดูแลกัน | `frontend/public/illustrations/coupons/care.svg` — warm cup |
| `WISH` | ขอพร | `frontend/public/illustrations/coupons/wish.svg` — folded wishing star |
| `ADVENTURE` | เที่ยวด้วยกัน | `frontend/public/illustrations/coupons/adventure.svg` — folded map |
| `GIFT` | ของขวัญและเงิน | `frontend/public/illustrations/coupons/gift.svg` — ribbon-tied box with a tag |
| `POWER` | พลังพิเศษ | `frontend/public/illustrations/coupons/power.svg` — perforated ticket with a replay arrow |
| `OTHER` | คำสัญญาอื่น ๆ | `frontend/public/illustrations/coupons/other.svg` — heart fallback |

`GIFT` holds money and gifts handed over. `POWER` holds coupons that act on other coupons; their behaviour comes from the template's `Effect`, never from the category. `OTHER` stays as the fallback for old snapshots.

All nine are original SVG sources with `viewBox="0 0 120 110"` and a shared `drawing` group. `TicketIllustration` references them with `<use href="/illustrations/coupons/wish.svg#drawing">`, inheriting `currentColor` and `--pocket-accent` from the ticket. Replacing one file updates the illustration for the entire category; there are no per-coupon images to regenerate. API values are mapped through a local allowlist, never treated as asset paths or injected SVG markup.

`frontend/src/lib/coupon-categories.ts` owns the Thai labels and asset paths. `CouponCategory.cs` owns the backend enum. Add a new value to both when extending the fixed catalogue. These are a small fixed list; a new category-management database table or SVG upload system is unnecessary for this feature.

## Product behavior

- The admin create/edit form selects category separately from rarity and shows a live illustration preview.
- Ticket faces show the category and tier together; expanded details show category explicitly.
- Catalog and received-coupon DTOs carry category through to the shared ticket component.
- Snapshot grouping includes category so distinct issued promises cannot silently merge.
- A coupon's category is saved in its gift-time snapshot; editing the template category later changes future gifts only.
- Existing templates default to OTHER. Old snapshots without category also read as OTHER, with the heart fallback. No title-based reclassification or historical snapshot rewriting occurs. Administrators can classify existing templates deliberately.
- New demo templates have explicit categories. The seeder does not rewrite an existing installation's templates.

## API contract

Admin POST and PUT coupon-template requests accept an additive `category` property, for example:

```json
{ "name": "ตั๋วขอพร 1 ข้อ", "description": "เราจะตั้งใจฟังเลย", "terms": "หนึ่งใบต่อหนึ่งข้อ", "rarity": "EPIC", "category": "WISH", "emoji": null, "imageUrl": null, "isActive": true }
```

Named values are accepted case-insensitively and responses use uppercase. Unknown names, numeric enum strings, combinations and paths are rejected with a Thai validation error. Omitted category on creation defaults to OTHER. Omitted/null category on update preserves the existing category, so older clients cannot accidentally erase a classification. Existing admin authorization remains in place.

Category is returned by the catalog list/detail, admin list/mutations and received-coupon list. It is also serialized in newly issued coupon snapshots. Swagger continues to derive the schema from the command/DTO definitions.

## Migration and rollout

`20261029202714_AddCouponCategory` adds only a non-null `CouponTemplates.Category` varchar(20) column with the database default `Other`. Old code remains valid against the expanded schema. The generated model snapshot matches this column; the migration has a Down method that removes it.

Apply the additive migration before running the new API against an existing database. The application already migrates on startup, so starting the updated API also performs this step. A restart was deliberately not performed during this change: the running development API and its configured database were left untouched. The SQL scripts for forward/rollback were generated and inspected offline; an actual database apply/rollback has not been tested. Rolling schema back removes category classifications; roll application code back first while retaining the additive column when possible.

## Preview and checks

Open `/design/love-pass#categories` for the SVG gallery, change tier to compare the same artwork in different ink, or download each standalone SVG.

Verified: seven frontend unit checks; 24 backend unit tests (including legacy snapshot defaults, immutable category snapshots, accepted named values and invalid inputs); backend Release build; TypeScript; category browser checks for SVG rendering, tier independence, four viewport widths and mocked admin create/edit persistence. The existing focused coupon browser checks also pass after moving illustrations out of the component. Browser evidence is in `docs/ui-implementation/category-verification.json`; gallery screenshots are `screenshots/category-icons-mint.png` and `screenshots/category-icons-plum.png`. Browser requests use fixtures; no live coupon mutations or database migrations were performed.
