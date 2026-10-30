# Design system — Romantic Analog Stationery

มาตรฐานหน้าตาที่ใช้อยู่ของ LOVE PASS ทุกหน้าที่ผู้ใช้เห็นต้องอยู่ในโลกเดียวกันนี้ ประวัติงานที่ทำให้ได้ระบบนี้มาอยู่ใน [romantic-redesign/](romantic-redesign/README.md)

## Art direction

**Pastel Pink × Romantic Stationery × Illustrated Analog Objects × Tactile Digital Interaction**

- **Stylized realism** — วัตถุต้องจำได้ทันทีว่าเป็นตั๋ว แสตมป์ ซองจดหมาย ใบเสร็จ แต่เป็นภาพวาดดิจิทัล ไม่ใช่รูปถ่าย
- **Rich detail with restraint** — รายละเอียดเล็ก ๆ (รอยปรุ, เส้นพิมพ์, หมึกไม่เต็ม) ต้องมีเหตุผลทางกายภาพ ไม่ใส่ texture/เงา/ความไม่สมบูรณ์ทุกที่
- **Printed vs handwritten** — ข้อความที่ "พิมพ์" บนวัตถุใช้ Sarabun/mono ข้อความที่ "เขียนด้วยมือ" (โน้ต, ข้อความถึงแฟน) ใช้ Mali
- **ใช้แล้วยังสวย** — ตั๋วที่ใช้แล้วคือความทรงจำ ถูกประทับตรา ไม่ถูกทำให้ดูไร้ค่า
- **Admin** ใช้ tokens เดียวกันแต่เน้นความชัดเจน ไม่ใส่วัตถุ analog ที่ซับซ้อน

## Tokens

ทั้งหมดอยู่ใน [`globals.css`](../../frontend/src/app/globals.css) (`@theme` + `:root`) — ห้ามประกาศ palette ชุดใหม่ในไฟล์อื่น `pocket.css` มีได้แค่ geometry ของวัตถุและ alias `--pocket-*`

| กลุ่ม | Token | ความหมาย |
| --- | --- | --- |
| กระดาษ | `--color-canvas`, `--color-surface`, `--color-paper-edge`, `--paper-grain` | พื้นโต๊ะสีชมพูอ่อน, กระดาษครีม, ขอบกระดาษ, texture เส้นใย |
| หมึก | `--color-ink`, `--color-muted`, `--color-line` | หมึกอ่าน, หมึกรอง, เส้นพิมพ์ |
| ความรัก | `--color-love`, `--color-love-hover`, `--color-love-soft`, `--color-stamp`, `--color-tape` | action หลัก, พื้นชมพู, หมึกตรายาง, เทป |
| สถานะ | `--color-success-*`, `--color-pending-*`, `--color-danger*` | ใช้ได้, รอยืนยัน, ผิดพลาด |
| ความพิเศษ | `--color-rarity-{common,rare,epic,legendary,mythic}-{paper,ink}` | สีกระดาษ/หมึกตาม rarity (ชมพู, ฟ้า, ม่วง, ทอง, รุ้ง) — MYTHIC พิมพ์บนฟอยล์โฮโลแกรม: `--rarity-mythic-foil` ไล่สีพาสเทลจาก token ที่มีอยู่ 5 สี ใช้กับแถบหัวตั๋ว หางตั๋ว และป้าย (`.rarity-foil`) ส่วนหมึกใช้ `--color-ink` สีเดียวให้อ่านง่าย ไม่ใช่ palette ใหม่ |
| รูปทรง/เงา | `--radius-paper`, `--radius-control`, `--shadow-paper`, `--shadow-ticket`, `--shadow-ticket-lifted` | มุมกระดาษ, มุม control, เงากระดาษ, เงาที่ตามรอยตัดของตั๋ว |
| การเคลื่อนไหว | `--motion-press`, `--motion-soft`, `--ease-paper` | กด, hover/เปลี่ยนสถานะ, เส้นโค้งแบบกระดาษ |

## Typography

| ใช้กับ | Font |
| --- | --- |
| ฟอร์ม ปุ่ม เมนู เนื้อหา สถานะ ชื่อตั๋ว | Sarabun (`--font-sarabun`) |
| หัวข้อหน้า, โน้ตส่วนตัว, ข้อความถึงแฟน | Mali (`--font-mali`) — ใช้เฉพาะจุด ห้ามทั้งหน้า |
| เลขตั๋ว, ป้ายพิมพ์เล็ก, ข้อความบนตรายาง | `.pocket-mono` (ui-monospace) |

ข้อความภาษาไทยที่เปลี่ยนตามข้อมูลต้องเป็น HTML text เสมอ ห้าม rasterize เป็นรูป

## Materials

ไฟล์อยู่ใน [`frontend/public/materials/`](../../frontend/public/materials/) — ทั้งหมดเป็น SVG ที่เขียนเองหรือสร้างด้วยโปรแกรม

| ไฟล์ | วิธีสร้าง | ใช้ที่ |
| --- | --- | --- |
| `paper/paper-fiber.svg` | เขียนเอง (feTurbulence) | `--paper-grain` ทุกพื้นกระดาษ |
| `paper/washi-tape.svg` | เขียนเอง | entry ใน history |
| `illustrations/wax-seal.svg` | เขียนเอง | `Card variant="letter"`, `WaxSeal`, ฝาซอง |
| `tickets/guilloche.svg`, `tickets/corner-*.svg` | [`scripts/materials.mjs`](../../frontend/scripts/materials.mjs) | ลายพิมพ์กันปลอมบน stub, มุมกรอบตั๋ว |
| `stamps/postage-heart.svg`, `stamps/postmark-waves.svg` | `scripts/materials.mjs` | โปสการ์ดของขวัญที่ส่ง |
| `illustrations/coupons/*.svg` | เขียนเอง | ภาพประจำหมวดคูปอง (`TicketIllustration`) รวม `gift.svg` กล่องผูกโบ และ `power.svg` ตั๋วรอยปรุกับลูกศรเล่นซ้ำ ที่เพิ่มพร้อมหมวด GIFT / POWER |

Filter ที่ใช้ร่วมกันอยู่ใน [`material-defs.tsx`](../../frontend/src/components/material-defs.tsx) (render ครั้งเดียวที่ root layout): `lp-stamp-ink` หมึกตรายาง, `lp-print` หมึกพิมพ์, `lp-torn` ขอบกระดาษฉีก

## Components

| Component | ไฟล์ | ใช้เมื่อ |
| --- | --- | --- |
| `Button`, `LinkButton`, `Field`, `Input`, `Select`, `Textarea`, `PasswordInput` | `ui.tsx` | control ทุกตัว — ห้าม override สี/hover ของปุ่มจากหน้า |
| `Card` (`paper`, `letter`, `booklet`, `journal`) | `ui.tsx` | พื้นกระดาษ: ทั่วไป/admin, จดหมาย+ตราครั่ง, สมุดเย็บสัน, สมุดบันทึก+ริบบิ้น |
| `Dialog`, `PageTitle`, `EmptyState`, `ErrorState`, `ErrorText`, `Notice`, `Skeleton`, `RarityBadge`, `StatusBadge` | `ui.tsx` | โครงหน้าและสถานะ |
| `LoveTicket`, `TicketFinePrint`, `RarityPips`, `PaperClip` | `love-ticket.tsx` | คูปองทุกใบใน catalog / my-coupons / ตัวอย่าง — แตะแล้วกางออกในที่ (`open`) แทน modal |
| `CouponRequestCard` | `coupon-request-card.tsx` | ใบคำขอใช้ |
| `TicketRequest` | `ticket-request.tsx` | ฉีกหางตั๋วตามรอยปรุเพื่อส่งคำขอ พร้อมโน้ตบนหางตั๋ว |
| `RubberStamp` | `rubber-stamp.tsx` | ตราประทับ "ใช้แล้ว" |
| `RedemptionReceipt` | `redemption-receipt.tsx` | ใบรับความทรงจำหลังยืนยัน |
| `SentGiftCard` | `sent-gift-card.tsx` | โปสการ์ดของขวัญที่ส่ง |
| `DashboardPreview` | `dashboard-preview.tsx` | ภาพนิ่งของหน้าบ้านของเราหลังเข้าสู่ระบบ ติดป้าย "ตัวอย่าง" ไม่มีข้อมูลจริงหรือปุ่มที่กดได้ (ใช้ `.mini-ticket`) |
| `TicketDemo` | `ticket-demo.tsx` | ตั๋วตัวอย่างให้ผู้เยี่ยมชมลองทั้งวงจรบนหน้าแรก ไม่ส่งข้อมูลจริง |
| `Envelope`, `WaxSeal`, `StationeryIcon` | `stationery.tsx` | ซองเปิดหลังส่งสำเร็จ, ตราครั่ง, ไอคอนลายเส้น (แทน emoji) |
| `PackComposer`, `GiftPack` | `pack-composer.tsx`, `gift-pack.tsx` | จัดซอง / เปิดซอง / เลือกหรือสุ่มโดยบันทึกสิทธิ์จริง ใช้ Envelope เดิมกับสถานะปิด/เปิดและ LoveTicket เดิม |
| `TierEnvelope` | `tier-envelope.tsx` | ซองของขวัญสีตาม rarity แยกจากซองส่งการ์ด แสดงจำนวนคงเหลือและเปิดแต่ละ tier ก่อนเลือก/สุ่มครั้งละหลายใบ |
| `TicketIllustration`, `LoveDoodle` | `ticket-illustration.tsx`, `love-doodle.tsx` | ภาพประจำหมวด, ภาพคู่รักใน journal |

## วัตถุประจำหน้า

| Route | วัตถุ |
| --- | --- |
| `/dashboard`, `/couple` | สมุดบันทึก (journal) |
| `/catalog`, `/my-coupons`, `/design/love-pass` | ตั๋วสะสม (`LoveTicket`) |
| `/requests` | ใบคำขอ + โน้ตบนกระดาษมีเส้น |
| `/sent-gifts` | โปสการ์ด airmail |
| `/history` | สมุดภาพ (scrapbook) ติดเทป |
| `/sets` | สมุดคูปองเย็บสัน (booklet) |
| `/packs`, `/packs/new` | ซองตราครั่ง → กางคลังตัวเลือก → สับตั๋วระหว่างรอและพลิกผลหลัง API สำเร็จ ใช้ SVG วัสดุเดิม ไม่มี asset ใหม่ |
| `/gifts/new` | เตรียมของขวัญ → ซองจดหมายเปิดเมื่อส่งสำเร็จ |
| `/` | ตั๋วที่ลองเล่นได้ (`TicketDemo` — ฉีก, ยืนยันแทนแฟน, ประทับตรา โดยไม่ยิง API) และภาพตัวอย่างบ้านของเรา (`DashboardPreview`); ปุ่มเริ่มสมุดอยู่ที่หัวหน้าและหลังลองตั๋วจบ |
| auth, `/couple/accept` | จดหมาย (letter) |

## สถานะและการเคลื่อนไหว

- **เปิดตั๋ว = กางออกในที่ ไม่ใช่ modal** — ด้านหน้าแสดง fine print บนตั๋ว หางตั๋วกลายเป็นพื้นที่ action Escape หรือ "พับเก็บ" พับกลับและคืน focus
- **ขอใช้ = ฉีกหางตั๋ว** — ลากแถบ "ฉีก" ตามรอยปรุเกิน 70% แล้วปล่อย การแตะเฉย ๆ หรือลากสั้นจะแค่บอกวิธี keyboard/screen reader กดแถบครั้งเดียวคือฉีก หางตั๋วหลุดออกเมื่อ API สำเร็จเท่านั้น ถ้าล้มเหลวจะเด้งกลับพร้อมโน้ตเดิม
- สีของตั๋วมาจาก rarity: กระดาษถูกย้อมอ่อน ๆ แถบหัวตั๋วและหางตั๋วพิมพ์ด้วยสีนั้น
- ตั๋วมี 4 สถานะ: `available` (สะอาด, hover ยก), `pending` (คลิปหนีบ + ป้ายเส้นประ), `used` (ตราประทับทับภาพ), `expired` (กระดาษเก่า หมึกจาง ไม่มีตรา)
- **ห้ามแสดงผลสำเร็จก่อน API สำเร็จ** — `RubberStamp animate` และ `Envelope` ใช้หลัง response สำเร็จเท่านั้น ข้อมูลที่โหลดมาว่าใช้แล้วแสดงตราสุดท้ายโดยไม่เล่น animation
- ทุก animation ต้องมี resting state เป็นผลลัพธ์สุดท้าย เพราะ `prefers-reduced-motion` ปิด animation ทั้งหมด
- การเคลื่อนไหวสั้นและมีเหตุผลทางกายภาพ (ยก, กด, ประทับ, เปิดซอง) ห้ามเด้งหรือลอยวนต่อเนื่อง

## การเพิ่ม asset ใหม่

ถ้า asset ที่มีไม่พอ **สร้างใหม่ได้เลย** เมื่อเข้ากับ art direction และทำให้วัตถุดูจริงขึ้น ขั้นตอน:

1. ระบุวัตถุจริงที่อ้างอิง และลักษณะที่ทำให้จำได้ (เช่น ตั๋ว: รอยตัด, รอยปรุ, เลขพิมพ์, stub)
2. ดูใน `public/materials/` และ components ก่อนว่ามีอะไรใช้ซ้ำได้
3. สร้างด้วยวิธีที่เหมาะ: SVG เขียนเอง, SVG จากสคริปต์ (geometry ซ้ำ ๆ → เพิ่มใน `scripts/materials.mjs`), CSS mask/gradient, SVG filter หรือ image generation ถ้ามีเครื่องมือ (ต้องเป็นภาพวาด ไม่ใช่ภาพถ่าย, PNG/WebP โปร่งใส, ขนาดเล็กที่สุด)
4. เก็บที่ `public/materials/<paper|ink|stamps|tickets|envelopes|illustrations>/` แล้วใช้เป็น layer ของ component จริง — ข้อความ ตัวเลข วันที่ และปุ่มต้องเป็น HTML
5. ตรวจภาพจริงที่ 2× และที่กว้าง 390 กับ 1280 px ถ้ายังดู generic ให้แก้จนดูเป็นวัตถุจริง
6. บันทึก asset ใหม่ในตาราง Materials ด้านบน ถ้าไม่ได้ใช้เครื่องมือ generate จริง ห้ามเขียนว่า generate
