# Prompt: ลงมือปรับ UI/UX ของ LOVE PASS ตามรายงาน

> วิธีใช้: ให้ coding agent ที่เปิด repo นี้อ่านไฟล์นี้แล้วเริ่มทำได้ทันที
> คำสั่งสั้น: `อ่าน docs/archive/ui-implementation-prompt.md แล้วลงมือทำตามลำดับจนจบ พร้อมทดสอบและสรุปผล`

---

## บทบาทและเป้าหมาย

คุณคือ Senior Frontend Engineer ที่มีทักษะ Product Design และ accessibility สำหรับแอป consumer ภาษาไทยบนมือถือ

**นี่คือโหมด implementation ให้ลงมือแก้โค้ดจริง ไม่ใช่ตรวจซ้ำแล้วส่งแผนอย่างเดียว** ปรับ LOVE PASS ให้คู่รักทั่วไปที่ไม่ถนัดเทคโนโลยีใช้งานได้ง่าย อ่านชัด และมีบุคลิก colourful อบอุ่นน่ารัก ตามรายงานที่อยู่ใน repo นี้

ทำงานต่อเนื่องตามลำดับด้านล่าง เมื่อช่วงหนึ่งผ่านการตรวจแล้วให้ทำช่วงถัดไป ไม่ต้องหยุดขออนุมัติ routine implementation choices ทุกช่วง หากบางรายการติดข้อจำกัด ให้ทำส่วนที่ไม่ติดให้ครบ และรายงานสิ่งที่ยังยืนยันไม่ได้ตามจริง

## อ่านก่อนเริ่ม

1. `docs/archive/ui-audit-report.md` ทั้งฉบับ โดยเฉพาะ Findings และ Roadmap
2. `docs/archive/ui-audit-contrast.md` โดยเฉพาะคู่สีที่เสนอและเงื่อนไข focus
3. `README.md`, `frontend/AGENTS.md` และ AGENTS.md อื่นที่ครอบคลุมไฟล์ที่จะเปลี่ยน
4. โค้ดปัจจุบันใน `frontend/src/app/`, `frontend/src/components/`, `frontend/src/lib/`, types, package.json และ configuration ที่เกี่ยวข้อง
5. คู่มือเวอร์ชันที่ติดตั้งใน `frontend/node_modules/next/dist/docs/` ก่อนใช้ Next.js APIs หรือเปลี่ยน configuration

รายงานเป็น snapshot วันที่ 30 ตุลาคม 2026 เลขบรรทัดอาจเลื่อนและบาง finding เป็นการอ่านโค้ดเท่านั้น ให้ยืนยันกับโค้ดปัจจุบันก่อนแก้ หากแก้ไปแล้วไม่ต้องแก้ซ้ำ หากหลักฐานไม่รองรับให้บันทึกเหตุผล ไม่ฝืนเปลี่ยนตามข้อสันนิษฐาน

คำว่า “ห้ามแก้โค้ด” ใน `docs/archive/ui-audit-prompt.md` เป็นขอบเขตของงาน audit เดิม งานตาม prompt นี้ให้แก้โค้ดได้ตามเป้าหมายที่ระบุ **อย่าแก้รายงานเก่าให้กลายเป็นผลตรวจหลังแก้**

## ขอบเขตและหลักตัดสินใจ

- ทำ P0/P1 ให้ครบก่อน ตามด้วย P2 ที่ปรับหน้าหรือ flow ที่มีอยู่แล้ว รวม design direction และ responsive admin
- เริ่มจากหน้าจอ 375×812 และ 390×844 ตรวจ 320px/430px เพิ่มสำหรับ reflow และ desktop 1280px
- ใช้ stack และโครงสร้างเดิม แก้ที่ shared component แล้วไล่ callers ให้ครบก่อนเพิ่ม abstraction ใหม่
- รักษา API contracts, authentication, authorization, การกัน/ใช้สิทธิ์คูปอง และข้อมูลธุรกรรมเดิม UI ที่เปลี่ยนต้องไม่ลด validation หรือสิทธิ์การเข้าถึง
- ไม่เพิ่ม animation/state/UI framework เพื่อแก้สิ่งที่ CSS, React, HTML หรือ component เดิมทำได้ครบ หากมีเหตุจำเป็นต้องเพิ่ม dependency ให้แสดงเหตุผล ทางเลือก และขนาดเพิ่มจาก build จริง
- อย่าใช้ refactor ทั้ง repo, เปลี่ยน backend architecture หรือย้ายระบบ auth เป็นงานแถม
- ข้อเสนอใหม่ที่เป็น P3 หรือขึ้นกับข้อมูล/API ใหม่ เช่น สะสมครบชุด, ส่งซ้ำ, invite preview API, search/pagination ฝั่ง server และ PWA ให้คงเป็น backlog ที่อธิบายสิ่งที่ต้องมี ไม่ต้องสร้างข้อมูลสมมติหรือทำฟีเจอร์เหล่านี้ในขอบเขตหลักนี้
- ไม่ deploy/publish/push โดยอัตโนมัติ งานจบที่ source และผลตรวจที่ review ได้

## ช่วงที่ 1 — ทำให้อ่านได้และกดได้ก่อน

อ้างอิง S1/S3 และ Quick win ในรายงาน

ไฟล์เริ่มต้น: `frontend/src/app/globals.css`, `frontend/src/app/layout.tsx`, `frontend/src/components/ui.tsx`, `frontend/src/app/admin/sets/page.tsx` แล้วไล่ทุกหน้าที่ใช้ styles เดิม

1. ทำ light theme ให้สมบูรณ์ แก้ unlayered body CSS ที่ชนะ Tailwind และ dark preference ที่เปลี่ยนสีข้อความไม่ตรงกับ surface ใช้สีพื้น/ข้อความจาก semantic tokens ในแหล่งเดียว พร้อม `color-scheme: light`
2. ใช้ palette ในรายงานกับ Tailwind v4 `@theme` และ migrate คู่สีที่ไม่ผ่านทั้ง shared UI และ styles ที่ hardcode ในแต่ละหน้า รวม placeholder, terms, timestamps, cancelled/inactive status และข้อความเตือนหมดอายุ
3. ตั้ง input/textarea/select เป็นอย่างน้อย 16px และ controls หลักมีพื้นที่กดเป้า 48×48 CSS px ปุ่มที่ไม่เต็มช่องต้องมีความกว้างขั้นต่ำเหมาะสม ไม่ขยายตัวหนังสือบน badge ให้กลายเป็นปุ่มโดยไม่จำเป็น
4. เพิ่ม focus-visible ที่ชัดและ contrast ผ่าน ระวัง outline ถูก clip และสี focus ชนพื้นปุ่มเข้ม ใช้ offset ที่เห็น surface จริง
5. แก้ admin set item row ที่ select หดเหลือประมาณ 26px: จัด mobile grid, แก้ `w-full`/width ที่ชนกันผ่าน wrapper, มี label ของคูปอง/จำนวน และชื่อปุ่มลบที่บอกแถว
6. เพิ่ม autocomplete ที่ถูกประเภทใน auth และชื่อเล่น ใช้ email/number keyboard ตามหน้าที่จริง

**เกณฑ์จบช่วงนี้:** ทุกหน้าที่ตรวจอ่านได้ทั้ง OS light/dark preference; input ไม่สืบทอดสีอ่อนบนพื้นขาว; แถวเลือกคูปอง admin ใช้ได้ที่ 320/375/390px; คำนวณ contrast ใหม่จากสีที่ render จริง โดยข้อความทั่วไป ≥4.5:1 และขอบ control/focus ที่จำเป็น ≥3:1

อย่าถือว่า WCAG กำหนดข้อความทุกชนิดต้อง 16px หรือ touch target ทุกอันต้อง 48px ตัวเลขเหล่านี้เป็นเป้าคุณภาพของผลิตภัณฑ์ ข้อ WCAG ที่ใช้จริงและข้อยกเว้นให้แยกตามรายงาน

## ช่วงที่ 2 — ปิดช่องว่างของ flow สำคัญ

อ้างอิง S4/S5/S6 และ findings ของ auth, couple, my-coupons, requests, gifts/new

### Authentication และคำเชิญ

- เก็บปลายทางรวม query ของหน้าที่ต้อง login แล้วกลับหลัง login/register สำเร็จ รวม Google Sign-In เมื่อเปิดใช้งาน คำเชิญต้องไม่หายเมื่อสลับหน้าเข้าสู่ระบบกับสมัครสมาชิก
- ตรวจ `returnTo` ให้เป็นเส้นทางภายในที่อนุญาต ปฏิเสธ external URL, protocol-relative URL และรูปแบบ encoded/backslash ที่อาจทำให้หลุด origin อย่าสร้าง open redirect และอย่า log invitation token
- แยก session หมดอายุจริงจาก network/5xx error ไม่ล้าง token หรือกล่าวว่าผู้ใช้ยังไม่จับคู่เพียงเพราะ API ติดต่อไม่ได้
- แสดง divider “หรือ” เฉพาะเมื่อมี Google option จริง; ถ้าเปิด Google ให้ขนาดพอดี container และมี loading/error feedback ไม่เปลี่ยน provider protocol โดยเดา
- couple ใช้คำว่า “รหัสคำเชิญ” และแยก “ส่งคำเชิญ” กับ “ฉันมีคำเชิญแล้ว” เป็นทางเลือก ไม่ใช่ขั้นตอน 1/2 ที่ต้องทำทั้งคู่
- คัดลอก/แชร์ลิงก์มีผลสำเร็จและ fallback เมื่อใช้ไม่ได้ ถ้ารองรับการวางทั้งลิงก์และรหัส ให้ parse เฉพาะรูปแบบที่เชื่อถือได้และมี validation
- invalid reset/invite link มีทางกลับหรือขอลิงก์ใหม่; ตัดข้อความ Resend/backend/log ออกจากหน้าผู้ใช้ และยืนยันผลตั้งรหัสสำเร็จอย่างชัดเจน

### ขอใช้และอนุมัติคูปอง

- ทำ modal/bottom sheet ที่มีชื่อและ semantics ถูกต้อง จัด initial focus, focus trap, Escape, focus return, background interaction และ scroll lock ให้ครบ ใช้ native dialog หรือวิธีที่ง่ายที่สุดซึ่งทำพฤติกรรมเหล่านี้ได้จริง
- error ของการขอใช้ต้องอยู่ใน dialog ที่ผู้ใช้เห็น แสดงระหว่าง retry โดยรักษาข้อความที่กรอกไว้ และกำหนดพฤติกรรมปิดระหว่าง submit อย่างไม่กำกวม
- ก่อน approve ให้ทบทวนชื่อคูปอง/ผู้ขอและผล “ใช้ 1 ใบ” พร้อมปุ่มยืนยัน ห้ามส่ง approve API เมื่อเพิ่งเปิด review หรือยกเลิก
- ถ้า response ไม่มีจำนวนคงเหลือ อย่าแต่งจำนวนขึ้นเอง แสดงผลกระทบที่ทราบจริง
- กัน submit ซ้ำและ action แข่งกันในหลายแถว จัด pending state ต่อรายการหรือ serialize อย่างชัดเจน ใช้ผลสำเร็จจาก server ก่อนแสดงว่าใช้สิทธิ์แล้ว
- ตรวจ grouping ของ my-coupons ว่าไม่รวม snapshot ที่เงื่อนไข/rarity ต่างกันแล้วแสดงข้อมูลของใบแรกผิด ใช้ identity ที่มีจริงใน contract

### จัดและส่งของขวัญ

- Quantity control มีชื่อบอกคูปอง กำหนด 1–100 ตรงกับ backend และมีการลบรายการที่เข้าใจได้ ไม่เพิ่มเกินเพดานแล้วรอ server ปฏิเสธ
- แยกเลือกเอง/เลือกชุดให้ชัด ไม่ส่ง selected set ที่ยังโหลดหรือ preview ไม่สำเร็จ และไม่ล้าง custom draft ที่ไม่ได้ส่งอย่างเงียบ ๆ
- ใช้ local calendar สำหรับ date-only และวันขั้นต่ำ ตรวจขอบเขตวันตาม timezone โดยไม่เปลี่ยน semantics วันหมดอายุของ API
- หน้าทบทวนก่อนส่งเห็นผู้รับ รายการ จำนวน และวันหมดอายุอยู่แล้ว ไม่เพิ่ม confirmation ซ้ำหลายชั้นโดยไม่มีเหตุผล
- ส่งสำเร็จพาไป `/sent-gifts` ด้วยคำว่า “ดูของขวัญที่ส่ง” แทนหน้าคูปองที่ได้รับ
- LinkButton ต้อง render anchor เพียงตัวเดียว แก้ Link ครอบ Button ที่เกี่ยวข้องให้ครบ

**เกณฑ์จบช่วงนี้:** anonymous invite → login/register → กลับคำเชิญเดิมได้; กดยกเลิก review ไม่ใช้สิทธิ์; กดซ้ำไม่สร้างธุรกรรมซ้ำจาก UI; error ใน dialog อ่านและแก้ได้; จำนวน/วัน/ชุดที่ส่งตรงกับสิ่งที่ทบทวน

## ช่วงที่ 3 — Navigation และ states ทุกหน้า

อ้างอิง S2/S4 และ findings รายหน้าในรายงาน

1. Mobile bottom navigation 5 งาน: หน้าแรก / เลือกของขวัญ / คูปองฉัน / คำขอ / เพิ่มเติม ใช้คำไทยและ icon ที่สม่ำเสมอ พร้อม current state ที่ประกาศได้
2. รวม catalog/sets เป็นสองมุมมองภายใต้เลือกของขวัญ โดยรักษา routes/query เดิมที่ยังมีคนเปิดได้
3. เพิ่มเติมเก็บคู่ของฉัน, ประวัติ, ของขวัญที่ส่ง, ออกจากระบบ และ admin เฉพาะผู้มีสิทธิ์ Header ไม่ให้โลโก้และ logout บีบเมนูงานหลัก
4. จัด cart task bar เหนือ bottom navigation จองพื้นที่ content และใช้ safe-area ให้ตรงความสูงจริง ทั้งสองแถบต้องไม่ทับกันหรือบังคูปองสุดท้าย
5. เพิ่ม/ปรับ EmptyState action, ErrorState retry, Skeleton, Notice และ StatusBadge เท่าที่มี callers ใช้จริง ไม่สร้างระบบ plugin/config สำหรับ states
6. ทุก API-driven page ต้องแยก loading / error / empty / success: dashboard, catalog, sets, my-coupons, gifts/new, requests, history, sent-gifts, couple และ admin ทั้งหมด ห้าม catch เป็นรายการว่างหรือขีดอย่างเดียว
7. async filter/tab ป้องกัน response เก่าทับผลใหม่และล้าง error เก่าเมื่อโหลดสำเร็จ Feedback จากการเพิ่มคูปองเกิดใกล้จุดกดพร้อม live status ที่เหมาะสม
8. error ผูกกับฟิลด์เมื่อระบุฟิลด์ได้ ใช้ `aria-invalid`/`aria-describedby`; error ใหม่ใช้ alert และ success ใช้ status อย่างเหมาะสม ไม่ทำ live announcement ซ้ำทุก render
9. แปล PENDING/APPROVED/REJECTED/CANCELLED และข้อความผู้ใช้เป็นไทย ส่วน rarity ให้มีคำไทยช่วยเข้าใจโดยยังรักษาค่า enum/API เดิม
10. Admin delete มี confirmation อยู่แล้ว ให้คงไว้และเพิ่ม pending lock; loading failure ต้อง retry ได้โดยไม่หลงว่าไม่มีข้อมูล

**เกณฑ์จบช่วงนี้:** ทุกงานหลักเข้าถึงได้จากมือถือโดยไม่เลื่อน menustrip; ไม่มี route ตกหล่น; empty state มีทางต่อที่เหมาะสม; offline/500 ไม่ถูกแสดงเป็น “ไม่มีคูปอง/ยังไม่จับคู่”; task bar และ safe area ไม่บังงาน

## ช่วงที่ 4 — Design direction และ P2 ของหน้าที่มีอยู่

ใช้ทิศทาง **“สมุดตั๋วความสุขของสองเรา”** จากรายงาน: กระดาษครีม สี rose/mint/sky/butter/lavender ที่มีหน้าที่ชัด อ่านไทยง่าย ไม่ใช้ธีมม่วง neon หรือ gradient/glow ทั่วหน้า

- ทำ CouponCard ทรงตั๋วที่คง hierarchy ชื่อ/คำสัญญา/เงื่อนไข/วันหมดอายุ ไม่ให้รอยเว้าหรือเส้นปรุตัดเนื้อหา
- ใช้ Mali 600 สำหรับ display และ Sarabun 400/600 สำหรับเนื้อหาตามรายงาน ผ่าน next/font และ display swap; ลดฟอนต์เดิมที่โหลดแต่ไม่ได้ใช้ วัด font transfer จริง ไม่โหลดทุกน้ำหนัก
- Dashboard มี primary next step ตามสถานะคู่รัก/คำขอ/คูปองที่มีจริง ย่อสถิติเป็นข้อมูลรอง และมี loading/error ที่ชัด
- Landing มีตัวอย่างคูปองและคำอธิบายสั้น 3 จังหวะ เข้าใจว่าผลิตภัณฑ์ทำอะไร ปุ่มไม่ชนกันเมื่อ text ขยาย
- Catalog มีปุ่มเพิ่มที่เข้าใจได้ เงื่อนไขอ่านง่ายและ feedback ทันที; sets ใช้คำว่าเลือกชุดก่อนตรวจของขวัญ ไม่สัญญาว่าส่งในคลิกเดียวหากยังมี checkout
- History อ่านชื่อและรายละเอียดเต็มได้ ไม่ truncate โดยไม่มีทางเปิด; sent-gifts และรายการชุดต้อง wrap ชื่อยาว/วันที่/จำนวนอย่างอ่านรู้เรื่อง
- Admin มือถือใช้รายการ/cards ที่อ่านและกด action ได้ ส่วน desktop ใช้ table ได้ เปิดฟอร์มแล้วจัด focus/scroll ไปยังงานที่เริ่ม
- แก้คำอธิบายสถิติ “เรียลไทม์” ให้ตรงพฤติกรรมจริง เช่น โหลดล่าสุดและปุ่มรีเฟรช ไม่เพิ่ม polling เพื่อให้ตรง copy เดิม
- เพิ่ม press feedback, success check และเอฟเฟกต์ของขวัญสั้น ๆ ด้วย CSS; ไม่บังคับ scratch/gesture เพิ่มก่อนเห็นผลและไม่ทำให้ทำงานต่อช้าลง
- ทุก motion รองรับ prefers-reduced-motion ไม่ใช้ decorative loop ยาว ไม่ animate layout เพื่อความสวย จองขนาด skeleton และ overlay เพื่อลด layout shift
- ViewTransition เป็น optional enhancement ใช้ได้เฉพาะเมื่อคู่มือเวอร์ชันที่ติดตั้งรองรับและตรวจ fallback แล้ว ไม่ทำให้ทุก route ต้องรอ animation

**เกณฑ์จบช่วงนี้:** หน้าหลักและ admin ใช้ภาษา สี typography และ spacing ไปทางเดียวกัน; ทุกสถานะใช้งานได้เทียบเท่าหน้าปกติ; reduced motion ไม่เสียข้อมูลหรือ feedback; ไม่มี dependency หนักที่ไม่จำเป็น

## วิธีตรวจที่ต้องทำ

### ตรวจ source และ automation

- ก่อนแก้ shared component ค้นหาทุก caller และตรวจ regression ที่จุดใช้งานจริง
- ใช้ scripts ใน package.json สำหรับ lint/build และแก้ error ที่เกิดจากงานนี้ ไม่ซ่อนปัญหาด้วย disable rule/validation แบบครอบจักรวาล
- เพิ่ม focused tests ให้ logic ที่มีความเสี่ยง: safe returnTo, local date boundary, quantity bound, async state ที่แก้, review/cancel/submit และ grouping ถ้ามีการเปลี่ยน
- ทดสอบสถานะ API ช้า/ล้มเหลวด้วยวิธีที่ repo รองรับ เช่น test fixtures/network interception ใน test หลีกเลี่ยงการเพิ่ม fake success ใน production code
- ไม่สร้าง snapshot tests จำนวนมากที่เพียงสะท้อน implementation หรือชุดทดสอบใหญ่สำหรับการเปลี่ยนสี/spacing อย่างเดียว

### ตรวจเว็บที่รันจริง

- ใช้ dev server ที่ตรง checkout นี้ ถ้ามีรันอยู่แล้วให้ใช้ก่อน ไม่หยุด process เดิมโดยไม่จำเป็น
- ตรวจอย่างน้อย 375×812, 390×844 และ desktop1280px เพิ่ม320/430pxสำหรับจุดแคบ ชื่อยาว ข้อความ error และจำนวนรายการมาก
- ตรวจ OS light/dark preference, keyboard Tab/Shift+Tab/Enter/Escape, focus return, modal scroll, safe area และ mobile keyboard เมื่อมีอุปกรณ์/เครื่องมือรองรับ
- ตรวจ zoom200%/400% และ text spacing จริงเมื่อทำได้ อย่าใช้ viewport320pxแทนหลักฐานว่าผ่าน browser zoom400%
- ตรวจ contrast ของ text/bg และ control/focus จากค่าที่ใช้งานจริง รวม hover/error/selected อย่ายกตัวเลขจากรายงานมาอ้างหลังเปลี่ยนคู่สีแล้ว
- เดิน flow ส่ง/ขอใช้/ยืนยันด้วยบัญชีทดสอบในสภาพแวดล้อม local ที่ยืนยันว่าเป็นข้อมูลทดสอบ ไม่ส่งอีเมลหรือแก้ข้อมูล production หากทดสอบบางช่วงไม่ได้ ให้ทดสอบ logic/fixture ที่ทำได้และรายงานส่วนที่ขาด
- บันทึกภาพหลังแก้สำหรับ login, dashboard, catalog, checkout, modal/review และ admin set form ทั้งขนาดมือถือและ desktop ที่มีประเด็น เปรียบเทียบกับอาการในรายงาน ไม่ตรวจเฉพาะ happy path
- ถ้าวัด performance ให้ใช้ production build ที่ตรง source รายงาน raw/gzip/transfer ให้ถูกประเภทและ route ที่วัด ค่า lab ใช้ดู regression ไม่ถือว่าเป็น field CWV p75

## รูปแบบส่งงาน

ระหว่างทำส่งความคืบหน้าสั้น ๆ ว่าแก้อะไรแล้ว พบอะไร และกำลังตรวจอะไร ห้ามรายงานว่าทดสอบแล้วหากเพียงอ่าน source

เมื่อจบ ให้ส่ง:

1. สรุปพฤติกรรมที่ดีขึ้นและไฟล์สำคัญที่เปลี่ยน
2. ตาราง mapping ไปยัง findings เดิม: S1–S6 และ findings รายหน้าที่แก้ พร้อมสถานะ **แก้และตรวจแล้ว / แก้แต่ตรวจได้บางส่วน / ไม่เกี่ยวแล้ว / ยังเหลือ** และหลักฐาน
3. ผล lint/build/focused tests และ manual flows ที่รันจริง พร้อมข้อจำกัดที่สำคัญ
4. ภาพหน้าจอหลังแก้ และตาราง contrast ใหม่ของคู่สีที่เปลี่ยน
5. ผล bundle/font ที่เพิ่มถ้ามี และรายการ backlog P3/งานที่ต้องเพิ่ม backend contract

บันทึกผลหลังแก้ใน `docs/archive/ui-implementation-result.md` โดยแยกจาก audit เดิม ถ้าบางข้อยังไม่ผ่านต้องบอกตรง ๆ อย่าสรุปว่า “ผ่าน WCAG ทั้งเว็บ” จากการตรวจเพียงบางหน้า

**เริ่มจากอ่านไฟล์อ้างอิง ตรวจ source ปัจจุบัน แล้วลงมือช่วงที่ 1 ทันที ต่อช่วงที่ 2–4 พร้อมตรวจรับจนขอบเขตหลักเสร็จ**
