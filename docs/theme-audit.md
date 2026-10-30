# รายงานตรวจสอบการใช้ Theme กลางทั้ง Project

วันที่ตรวจ: 30 ตุลาคม 2026  
วิธีตรวจ: วิเคราะห์ source code, ไล่ import และจุด render, ค้นหา token และค่าที่เขียนตายตัว และอ่าน CSS ที่ build ไว้เป็นหลักฐานเสริม

## สรุป: ใช้บางส่วน

มี theme กลางและ component กลางที่ใช้งานจริง แต่ยังเปลี่ยนจากส่วนกลางแล้วตามไปไม่ครบทั่ว project พบชุดสี Pocket ที่แยกจาก theme หลัก, CSS ทับรูปแบบและสถานะของปุ่มกลาง, ค่าที่ข้าม semantic token และ stylesheet รุ่นเก่าที่ยังถูกโหลด

ตรวจโค้ดหน้าเว็บที่เขียนเองครบ **23 หน้า** แบ่งเป็นหน้าผลิตภัณฑ์ 22 หน้าและหน้าตัวอย่าง 1 หน้า รวมถึง **layout 4 ไฟล์, template 1 ไฟล์, component 10 ไฟล์**, CSS, SVG, dependencies และ HTML อีเมลฝั่ง backend โดยไล่ import และจุด render ประกอบ ไม่ได้ตัดสินจากการพบไฟล์ theme เพียงอย่างเดียว

รอบตรวจเดิมไม่ได้แก้ไขไฟล์ และ `git status` หลังตรวจยังสะอาด ไฟล์รายงานนี้สร้างภายหลังตามคำขอ โดยไม่ได้แก้ไข source code ไม่ได้ประเมินเปอร์เซ็นต์ความครบถ้วน เพราะไม่มีวิธีนับที่ครอบคลุมทุก element และทุกสถานะอย่างชัดเจน

> เลขบรรทัดอ้างอิง source ณ เวลาตรวจ อาจเปลี่ยนเมื่อมีการแก้ไขภายหลัง ลิงก์ `#L...` ใช้ระบุตำแหน่งบนตัวดูโค้ดที่รองรับ

## 1. แหล่ง Theme และการเชื่อมต่อ

### Theme หลัก

[globals.css:1](../frontend/src/app/globals.css#L1) ใช้ Tailwind v4 ผ่าน `@import "tailwindcss"` และ `@theme` กำหนดสี เช่น `canvas`, `surface`, `ink`, `muted`, `love`, `danger`, `focus` และคู่สีสำหรับ rarity จึงใช้ได้ทั้ง utility เช่น `bg-surface` และ CSS เช่น `var(--color-surface)`

ไม่พบ Tailwind config แยกสำหรับกำหนด theme การตั้งค่าหลักอยู่ใน CSS ส่วน [postcss.config.mjs:1](../frontend/postcss.config.mjs#L1) เชื่อม Tailwind ผ่าน PostCSS

[layout.tsx:4](../frontend/src/app/layout.tsx#L4) โหลด stylesheet ตามลำดับ:

1. `globals.css`
2. `vouchers.css`
3. `pocket.css`

Root layout โหลด Sarabun 400/600 และ Mali 600 จากไฟล์ local แล้วผูกตัวแปร `--font-sarabun` และ `--font-mali` บน `<html>` ส่วน `@theme inline` เชื่อมกับ `--font-sans` และ `--font-display`

[globals.css:29](../frontend/src/app/globals.css#L29) กำหนดพื้นหลัง ตัวอักษร หัวข้อ placeholder และ focus กลาง ส่วน spacing, radius และ shadow ของ utility ส่วนใหญ่ใช้มาตราส่วนเริ่มต้นของ Tailwind

### Component กลาง

[ui.tsx:22](../frontend/src/components/ui.tsx#L22) รวม Button, Input, Select, Textarea, Card, Dialog, Badge, Skeleton, EmptyState, ErrorState และ Notice ซึ่งอ้างอิง token หลักจริง

`rarityStyles` ในไฟล์เดียวกันเชื่อม rarity กับชื่อ สี badge และตัวแปรสีตั๋ว ส่วน StatusBadge กำหนดคู่สีของ pending, approved, rejected และสถานะอื่นจาก token กลาง

### ชุด Pocket

[pocket.css:2](../frontend/src/app/pocket.css#L2) ประกาศชุดสี `--pocket-*` อีกชุด โดยไม่ได้อ้างกลับไปยังสีหลัก ใช้จริงกับ catalog, คูปองฉัน, คำขอ, ของขวัญที่ส่ง และรายละเอียดคูปอง

ชุดนี้มีสีข้อความ พื้นผิว เส้นขอบ และ rarity ของตัวเอง พร้อม CSS ทับปุ่มและ tab กลางบางส่วน จึงเป็นระบบหน้าตาอีกชุดที่ใช้งานจริง ไม่ใช่เพียง style ของ demo

### Provider และ Light/Dark Mode

ไม่มี ThemeProvider สำหรับหน้าตา; provider ใน root คือ `AuthProvider` การกระจาย theme ใช้ CSS ที่ root และการสืบทอดตัวแปร จึงไม่พบปัญหาหน้าปกติหลุดจาก theme เพราะอยู่นอก provider

รองรับเฉพาะ light mode: [globals.css:31](../frontend/src/app/globals.css#L31) ระบุ `color-scheme: light` ไม่พบระบบสลับสีหรือชุด token dark mode การไม่มี dark mode จึงยังไม่ใช่ข้อบกพร่องตามความสามารถปัจจุบัน

## 2. ขอบเขตหน้าและ Component ที่ตรวจ

| ขอบเขต | ผลจากโค้ด |
| --- | --- |
| `/`, `/privacy` และ auth 4 หน้า: `/login`, `/register`, `/forgot-password`, `/reset-password` | ใช้สีและฟอนต์หลัก รวมถึง form/error/loading กลาง มีพื้นหลัง `bg-white` ใน auth layout |
| `/dashboard`, `/sets`, `/gifts/new`, `/history`, `/more`, `/couple`, `/couple/accept` | ใช้ theme หลักและ UI กลางจริง รูปแบบคูปองและหัวข้อต่างจากกลุ่ม Pocket |
| `/catalog`, `/my-coupons`, `/requests`, `/sent-gifts` | ใช้ Pocket เป็นหลัก แต่ navigation, form, notification และสถานะโหลดบางส่วนยังใช้ theme หลัก |
| admin 5 หน้า: `/admin/dashboard`, `/admin/coupons`, `/admin/sets`, `/admin/users`, `/admin/overview` | ใช้ UI กลาง ตารางเขียนเองและใช้ token เป็นส่วนใหญ่ พบสี checkbox และพื้นหลังบางจุดข้าม semantic token |
| `/design/love-pass` | เป็นหน้าตัวอย่างที่รันได้จริง ใช้ข้อมูลจำลองและ component ร่วมกับผลิตภัณฑ์ ไม่ใช่โค้ดเก่าที่ไม่มีทางเข้าถึง |
| Modal, form และ table | มีการใช้ theme กลางจริง แต่ modal แบบ Pocket มี CSS ทับปุ่มกลาง; confirmation ลบข้อมูลฝั่ง admin ใช้ `window.confirm()` |
| Toast, chart และ library UI | ไม่พบ toast หรือ chart library; ใช้ `Notice` แบบ inline แทน ส่วน UI ภายนอกที่พบคือ Google Sign-In |

Layout ที่ตรวจคือ root, auth, user และ admin รวมถึง user template ที่ทำ page transition

Component ที่ตรวจทั้ง 10 ไฟล์ ได้แก่ `ui.tsx`, `nav.tsx`, `GoogleLoginButton.tsx`, `love-ticket.tsx`, `ticket-request.tsx`, `coupon-request-card.tsx`, `sent-gift-card.tsx`, `redemption-receipt.tsx`, `ticket-illustration.tsx` และ `love-doodle.tsx`

## 3. ตารางปัญหา เรียงตามผลกระทบสูงไปต่ำ

คำว่า “สูง” ในรายงานนี้หมายถึงผลกระทบต่อการควบคุม theme และความสม่ำเสมอ ไม่ใช่ข้อผิดพลาดที่ทำให้ระบบหยุดทำงาน

| ไฟล์และเลขบรรทัด | สิ่งที่พบ | ผลกระทบ | แนวทางแก้ |
| --- | --- | --- | --- |
| **1 · สูง** — [globals.css:3](../frontend/src/app/globals.css#L3), [pocket.css:2](../frontend/src/app/pocket.css#L2) | มี palette หลักและ Pocket แยกกัน เช่น `--color-ink` กับ `--pocket-ink`; rarity ก็มี mapping แยกใน CSS และ `rarityStyles` | เปลี่ยนสีหลักแล้วหน้าคูปองและรายละเอียดไม่ตาม ขณะที่หน้าใน flow เดียวกัน เช่น catalog → sets → ตรวจของขวัญ ใช้คนละชุดหน้าตา | กำหนดให้ชัดว่า Pocket เป็น theme ผลิตภัณฑ์หรือ variant ของตั๋ว แล้วเชื่อม token บทบาทร่วม เช่น surface/text/action/status เข้ากับแหล่งเดียว |
| **2 · สูง** — [pocket.css:67](../frontend/src/app/pocket.css#L67), [pocket.css:175](../frontend/src/app/pocket.css#L175), [pocket.css:195](../frontend/src/app/pocket.css#L195) | selector เช่น `.ticket-dialog .ui-button.bg-love` และ `.sent-gifts-page .ui-button.bg-love` ทับ background ของ Button โดยไม่ได้กำหนด hover ให้ครบ | `hover:bg-love-hover`/`hover:bg-canvas` จากปุ่มกลางไม่สามารถเปลี่ยนพื้นหลังในบริบทเหล่านี้ได้ ปุ่ม variant เดียวกันจึงตอบสนองต่างกันตามหน้า | ให้ Button รับสีผ่านตัวแปรหรือ variant ที่ชัดเจน และกำหนดสถานะให้ครบ หลีกเลี่ยงใช้ชื่อ utility เป็นจุดเชื่อม CSS |
| **3 · กลาง** — [pocket.css:46](../frontend/src/app/pocket.css#L46), [globals.css:35](../frontend/src/app/globals.css#L35) | รอยเว้าตั๋วใช้ `--pocket-canvas` (`#f5f2ea`) แต่พื้นหลังหน้าผลิตภัณฑ์ใช้ `--color-canvas` (`#fff8f3`) | พื้นที่ที่ควรดูเหมือนเจาะทะลุไปยังพื้นหลังมีสีคนละค่า โดย demo มีพื้นหลัง Pocket จึงอาจไม่เห็นปัญหาเดียวกัน | อ้างอิงสีพื้นผิวที่ครอบตั๋วจริง หรือกำหนดตัวแปรพื้นหลังจาก container; ตรวจภาพหน้าผลิตภัณฑ์ประกอบ |
| **4 · กลาง** — [admin/coupons/page.tsx:246](../frontend/src/app/admin/coupons/page.tsx#L246), [admin/sets/page.tsx:193](../frontend/src/app/admin/sets/page.tsx#L193) | checkbox ใช้ `accent-purple-600` ซึ่งทับ `accent-color: var(--color-love)` ใน global base | เปลี่ยนสี action กลางแล้ว checkbox ทั้งสองหน้าไม่ตาม | ใช้ accent token ของระบบ หรือกำหนด token สำหรับ admin ที่มีบทบาทชัดเจน |
| **5 · กลาง** — [auth/layout.tsx:12](../frontend/src/app/%28auth%29/layout.tsx#L12), [admin/users/page.tsx:97](../frontend/src/app/admin/users/page.tsx#L97), [admin/coupons/page.tsx:274](../frontend/src/app/admin/coupons/page.tsx#L274), [couple/page.tsx:110](../frontend/src/app/%28user%29/couple/page.tsx#L110) | ใช้ `bg-white` กับพื้นผิวทั่วไป แทน `bg-surface` | วันนี้สีตรงกัน แต่เมื่อปรับ surface จุดเหล่านี้จะยังขาว | เปลี่ยนพื้นผิวทั่วไปให้อ้างอิง semantic token เดียวกัน |
| **6 · กลาง** — [pocket.css:20](../frontend/src/app/pocket.css#L20), [pocket.css:30](../frontend/src/app/pocket.css#L30), [pocket.css:58](../frontend/src/app/pocket.css#L58), [pocket.css:116](../frontend/src/app/pocket.css#L116) | สี RARE/LEGENDARY บางค่า สี used/expired, shadow และพื้นหลังใบรับความทรงจำยังเป็น hex ใน selector | แม้เปลี่ยน `--pocket-*` แล้ว รายละเอียดสถานะและเงาบางส่วนยังคงสีเดิม | ย้ายค่าที่มีบทบาทซ้ำเป็น token เช่น rarity/status/paper/shadow แล้วใช้ใน selector |
| **7 · กลาง–ต่ำ** — [ui.tsx:24](../frontend/src/components/ui.tsx#L24), [pocket.css:172](../frontend/src/app/pocket.css#L172), [globals.css:241](../frontend/src/app/globals.css#L241) | hover ของปุ่มและ status tab ไม่ได้ตัด `:disabled` ออก แม้มี opacity ลดลงแล้ว | ระหว่าง busy ปุ่มหรือ tab ที่กดไม่ได้ยังเปลี่ยนสีเมื่อชี้เมาส์; ส่วน active ของ `.ui-button` มี guard ถูกต้องแล้ว | จำกัด hover ด้วย `:not(:disabled)` และตรวจสถานะ busy ด้วยเมาส์จริง |
| **8 · ต่ำ** — [ui.tsx:30](../frontend/src/components/ui.tsx#L30), [ui.tsx:38](../frontend/src/components/ui.tsx#L38), [pocket.css:53](../frontend/src/app/pocket.css#L53) | Button รับ `size="sm"` แต่ส่งออกเพียง `data-size`; ไม่พบ style ที่อ่านค่านี้ ปุ่ม Pocket กำหนดขนาด/ฟอนต์/radius แยก | ผู้เรียกใช้ขนาดกลางไม่ได้ตาม API ที่ระบุ และต้องพึ่ง CSS ของแต่ละบริบท | ทำ size variant ให้มีผลจริง และรวมค่าของ control ที่ตั้งใจใช้ซ้ำ |
| **9 · ต่ำ** — [layout.tsx:5](../frontend/src/app/layout.tsx#L5), [vouchers.css:1](../frontend/src/app/vouchers.css#L1), [globals.css:114](../frontend/src/app/globals.css#L114) | ยังโหลด stylesheet voucher เก่าทุกหน้า ทั้งที่ไม่พบ JSX ใช้ class ของมัน รวมถึง style `love-note`, `note-*`, `coupon-sticker` ที่ไม่พบ consumer ปัจจุบัน | มีระบบหน้าตาเก่าปะปน ทำให้ดูแลและเลือกแก้ theme ผิดชุดได้ | ตรวจยืนยัน runtime ก่อนถอด import และลบ style ที่เลิกใช้ |

ข้อ 2 ตรวจเทียบกับ CSS ที่ build ไว้ด้วย พบทั้ง utility hover และกฎ Pocket ที่ทับอยู่จริง กฎ Pocket อยู่นอก CSS layer ของ utility จึงมีผลเหนือ utility ปกติ แต่ผล build เดิมเป็นหลักฐานเสริม ไม่ใช้แทน source ปัจจุบัน

การมี Pocket เป็น variant ไม่ใช่ปัญหาในตัวเอง จุดที่พบคือบทบาทพื้นฐานแยกจากส่วนกลางและการใช้ component ร่วมยังมีการทับสถานะไม่ครบ

## 4. สถานะ Interaction และ Feedback

| สถานะ | ผลตรวจ |
| --- | --- |
| Hover | ปุ่มกลางมี token hover; พบการทับและการไม่ตัด disabled ตามตาราง |
| Focus | มี `:focus-visible` กลางอ้างอิง `--color-focus`; ตั๋วใช้ token เดียวกัน ส่วน Dialog มีการจัดการ focus และคืน focus |
| Active/selected | ปุ่มกลางมี active animation; navigation ใช้ `aria-current`, filter/tab ใช้ `aria-pressed` แต่ Pocket มีการทับสี selected แยก |
| Disabled | Button ลด opacity และเปลี่ยน cursor; form control เปลี่ยนพื้นหลัง แต่ยังไม่มี disabled token เฉพาะ และ hover ไม่สม่ำเสมอ |
| Loading | ใช้ Skeleton/Spinner และข้อความ busy จริง Skeleton ยังคง `bg-love-soft` แม้อยู่ในหน้า Pocket |
| Empty | ใช้ EmptyState กลางเป็นส่วนใหญ่; หน้าตรวจของขวัญมี empty cart เขียนเฉพาะจุด แต่ยังใช้ token กลาง |
| Error | ใช้ ErrorText/ErrorState และสี danger กลาง; Field ส่ง `aria-invalid` แล้ว แต่ไม่พบ visual style ที่อ่านสถานะนี้ จึงแสดง error ผ่านข้อความเป็นหลัก |
| Light/dark | ตั้งใจคง light mode; ไม่พบ theme dark ที่ต้องตรวจความครบถ้วน |

การยังไม่มีสีขอบ invalid แยกเป็นช่องว่างของ visual state ไม่ได้หมายความว่าไม่มี error feedback เพราะมีข้อความ error และ ARIA อยู่แล้ว

## 5. ค่าที่เขียนตรงแต่ยังไม่ควรนับเป็นปัญหาทั้งหมด

- `p-4`, `gap-3`, `rounded-xl`, `shadow-sm` ใช้มาตราส่วนของ Tailwind อยู่แล้ว ไม่ใช่ค่าหลุดระบบเพียงเพราะปรากฏใน component
- ขนาด SVG, รอยปรุ, มุมหมุน, รูปทรงใบเสร็จ, safe area และความสูง navigation เป็น geometry เฉพาะงาน ไม่จำเป็นต้องย้ายทุกค่าเป็น token
- ฟอนต์ monospace สำหรับเลขตั๋ว และ Georgia สำหรับข้อความตกแต่ง มีบทบาทเฉพาะ ต่างจากการใช้ฟอนต์สุ่มกับเนื้อหาปกติ
- SVG หมวดคูปองใช้ `currentColor` และ `--pocket-accent` จริง ส่วน hex fallback ช่วยให้ดาวน์โหลด SVG ไปเปิดเดี่ยว ๆ ได้ จึงไม่จัดเป็นการข้าม theme ในแอป
- `text-white` บนปุ่มและสีดำโปร่งใสของ backdrop อาจเป็นค่าคงที่ที่ตั้งใจไว้ หากต้องปรับตามหลาย theme ค่อยกำหนด `on-action` และ `overlay` token
- Google Sign-In ใช้ SDK พร้อม `theme: "outline"` ที่ [GoogleLoginButton.tsx:122](../frontend/src/components/GoogleLoginButton.tsx#L122) เป็น UI ที่ภายนอกควบคุม ไม่ควรคาดว่าจะรับ CSS variables ของแอปเหมือนปุ่มที่เขียนเอง
- `window.confirm()` ใน admin เป็นหน้าตาของ browser/OS จึงไม่รับ theme เว็บ หากต้องการความสม่ำเสมอถึง confirmation ต้องเปลี่ยนมาใช้ Dialog กลาง
- [EmailTemplates.cs:12](../backend/src/LovePass.Application/Common/Services/EmailTemplates.cs#L12) เป็น HTML อีเมลที่ใช้งานจริง แต่ยังไม่มี branded styles และไม่ได้รับ CSS จาก frontend หากคำว่า “ทั้ง project” รวมอีเมลด้วย ส่วนนี้ยังไม่ได้ใช้ theme ผลิตภัณฑ์

## 6. โค้ดจริง ตัวอย่าง และส่วนที่ไม่พบการใช้งาน

| ส่วน | สถานะและหลักฐาน |
| --- | --- |
| Component 9 จาก 10 ไฟล์ | พบเส้นทาง import จาก page/layout |
| [LoveDoodle](../frontend/src/components/love-doodle.tsx#L2) | ไม่พบผู้เรียกใช้ในโค้ดปัจจุบัน |
| `CouponCard` | ยังใช้ที่ landing page จึงไม่ใช่โค้ดตาย แม้หน้าคูปองจริงเปลี่ยนมาใช้ LoveTicket แล้ว |
| `/design/love-pass` | Demo ที่มี route จริง มีข้อมูลจำลองชัดเจน แต่ LoveTicket, TicketRequest และ SVG ที่ใช้ร่วมกันเป็นโค้ดผลิตภัณฑ์ด้วย |
| `vouchers.css` | ถูกโหลดจริง แต่ไม่พบ element ที่ใช้ class ของมัน; token `--color-paper`, `--stub-width`, `--ticket-ink` จึงอยู่ในชุดที่ไม่พบ consumer ปัจจุบัน |
| Color token หลัก | ไม่พบ token ที่ประกาศแล้วไร้การอ้างอิงใน source |
| `--font-sans` | ถูก Tailwind ใช้ทางอ้อม จึงไม่นับว่า unused แม้ไม่มี class `font-sans` โดยตรง |
| [fonts/source.css](../frontend/src/app/fonts/source.css#L1) | ไม่ถูก import ใช้งานจริง เป็นข้อมูลแหล่งฟอนต์เดิม ส่วน runtime ใช้ local font จาก root layout |
| `rarityStyles.border` | ประกาศไว้ แต่ไม่พบผู้ใช้ property นี้ใน source ปัจจุบัน; ตัว `rarityStyles` และ property อื่นยังใช้จริง |
| `docs/archive/` และ screenshot/evidence | เป็นหลักฐานงานเก่า ไม่ใช่ source runtime และไม่ใช้ยืนยันว่าหน้าปัจจุบันผ่านแล้ว |

การไม่พบ consumer อาศัย import และการค้นหาทั้ง repository; ยังไม่ใช่การพิสูจน์จากการเก็บ runtime coverage ทุกเงื่อนไข

## 7. ลำดับที่ควรแก้

1. ตกลงความสัมพันธ์ระหว่าง theme หลักกับ Pocket แล้วรวม token บทบาทร่วม โดยเก็บรูปลักษณ์ตั๋วเฉพาะไว้ได้
2. แก้ CSS ทับ Button และทำ hover/disabled ให้ครบทุกบริบท
3. แก้พื้นหลังรอยเว้าตั๋ว, checkbox และพื้นผิวที่ข้าม token
4. รวมสีสถานะ/เงาที่กระจายอยู่ และทำ `size` ของ Button ให้มีผลจริง
5. ถอดชุด style เก่าหลังยืนยัน runtime และแยก style ของ demo ให้ชัดเจน

## 8. ส่วนที่ต้องเปิดหน้าจอตรวจเพิ่มและข้อจำกัด

รอบนี้เป็นการตรวจโค้ด **ยังไม่ได้เปิด browser หรือรันชุดทดสอบใหม่** ชุด UI test ที่มีอยู่ตรวจบาง flow, contrast และ responsive ด้วย fixture แต่ไม่ครอบคลุม theme ทุก element/ทุกสถานะ และบางชุดเขียน screenshot/evidence ลงไฟล์ จึงไม่ได้รันในงานตรวจแบบไม่แก้ไฟล์นี้

ควรตรวจหน้าจอเพิ่มเติมดังนี้:

- catalog → sets → ตรวจของขวัญ → sent-gifts เพื่อประเมินการเปลี่ยนภาษา visual ระหว่าง flow
- ตั๋วทุก rarity และสถานะ โดยเฉพาะรอยเว้าบนพื้นหลังหน้าจริง
- modal, hover และ disabled ขณะส่งคำขอ/อนุมัติ รวมถึง form error และ keyboard focus
- ตาราง admin ที่จอแคบ, native date/select/checkbox และ Google Sign-In ที่โหลดจาก SDK จริง
- หน้า 404 และข้อผิดพลาดระดับแอป เพราะไม่พบ custom `not-found.tsx`, `error.tsx` หรือ `global-error.tsx` ที่กำหนด theme เอง
- อีเมลใน client จริง หากต้องการให้ theme ครอบคลุมอีเมลด้วย

ยังยืนยัน contrast ของทุกคู่สี ผลของ browser แต่ละตัว และความตรงกันกับ deployment ปัจจุบันไม่ได้จาก static audit เพียงอย่างเดียว
