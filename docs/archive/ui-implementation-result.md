# LOVE PASS — ผลปรับ UI/UX

วันที่: 30 ตุลาคม 2026 (Asia/Bangkok)

ดำเนินการช่วง 1–4 ของ `ui-implementation-prompt.md` ใน frontend โดยรักษา API contracts และ backend transaction/authorization เดิม ไม่ deploy, publish หรือ push งานนี้ และไม่เขียนทับรายงาน audit เดิม

## พฤติกรรมหลังปรับ

- ใช้ light theme ครบชุดจาก semantic tokens บนกระดาษครีม ตัวหนังสือเข้ม ทั้งเมื่อ OS เลือก light และ dark ปุ่มหลัก/ช่องกรอกมีพื้นที่อย่างน้อย 48px ช่องกรอก 16px และ focus outline แยกจากพื้นปุ่ม
- Navigation มี 5 งาน พร้อมชื่อไทย, SVG และ `aria-current` รวม catalog/sets ใต้เลือกของขวัญ เพิ่มหน้า `/more` สำหรับคู่ของฉัน ประวัติ ของขวัญที่ส่ง ออกจากระบบ และ admin ตามสิทธิ์ Routes/query เดิมยังใช้ได้
- ตะกร้าอยู่เหนือ navigation และวัดความสูง navigation ด้วย ResizeObserver เพื่อรองรับตัวหนังสือที่ wrap พร้อม safe-area และพื้นที่ท้ายเนื้อหา
- คำเชิญรักษา pathname/query ผ่าน login/register และตรวจ returnTo ด้วย allowlist ภายใน แยก API/network error จาก session หมดอายุ การ refresh ล้มเหลวด้วย 5xx ไม่ล้าง token
- ขอใช้คูปองผ่าน native dialog มีชื่อ, initial focus, Tab/Shift+Tab trap, Escape, scroll lock, background inert และ focus return ถ้าปุ่มเดิมหายหลังอนุมัติ จะคืน focus ให้หัวข้อหน้า Error อยู่ใน dialog และ retry เก็บข้อความเดิม
- อนุมัติมีทบทวนชื่อคูปอง/ผู้ขอและผล “ใช้ 1 ใบ” ก่อนเรียก API ไม่แต่งจำนวนคงเหลือ ล็อก mutation ป้องกันกดซ้ำและ action แข่งข้ามแถว
- Grouping ใช้ทุก snapshot field ที่แสดง ร่วม expiry/sender แยกเงื่อนไขหรือ rarity ที่ต่างกัน เพิ่มมุมมองใช้ได้/รอแฟนยืนยันและจำนวนที่กันไว้จาก contract
- ของขวัญจำกัด 1–100 มีชื่อปุ่มเพิ่ม/ลด/ลบ ใช้วันที่ตามปฏิทินท้องถิ่น คงความหมายหมดอายุสิ้นวันเดิม ชุดที่ preview ไม่สำเร็จส่งไม่ได้ ส่งชุดไม่ล้าง custom draft ที่ไม่ได้ส่ง สำเร็จไป “ดูของขวัญที่ส่ง”
- หน้าที่ใช้ API แยก skeleton/error/retry/empty/success ป้องกัน response เก่าทับ filter/tab ใหม่ ประวัติและรายการยาว wrap ได้ Admin เป็นรายการบนมือถือ เปิดฟอร์มแล้วเลื่อน/focus มี labels และ pending lock คง confirmation ก่อนลบ เพิ่มค้นหาผู้ใช้ในข้อมูลที่โหลดมา
- ใช้ CouponCard ทรงตั๋ว, Mali 600 และ Sarabun 400/600 พร้อม display swap, LinkButton เป็น anchor ตัวเดียว, press/success effect ด้วย CSS และ reduced-motion fallback ไม่เพิ่ม runtime dependency
- เชื่อม error รายฟิลด์กับ aria-invalid/aria-describedby ใน auth และ admin forms แปลงข้อความ error ที่เป็นเทคนิค/อังกฤษเป็นข้อความไทย รวม 404 ที่อาจมี identifier ของคำเชิญ

ไฟล์หลัก: `frontend/src/app/globals.css`, `layout.tsx`, `components/ui.tsx`, `components/nav.tsx`, `components/GoogleLoginButton.tsx`, `lib/api.ts`, `lib/auth.tsx`, `lib/flow.ts`, `lib/use-resource.ts` และ auth/user/admin pages ที่ใช้ส่วนกลางเหล่านี้

## Mapping กับ audit เดิม

“แก้และตรวจแล้ว” ในตารางหมายถึงขอบเขต source และ Chromium/fixtures ที่ระบุ ไม่ใช่การรับรอง WCAG ทั้งเว็บ

| Finding | สถานะ | สิ่งที่แก้และหลักฐาน |
| --- | --- | --- |
| S1 สีพื้น/ข้อความ | แก้และตรวจแล้ว | Light-only semantic theme; ตรวจ OS light/dark, สีจริงจาก browser และภาพ login/dashboard/catalog |
| S2 navigation | แก้และตรวจแล้ว | 5 งาน + `/more` + GiftViews + route/query เดิม; layout 320–1280, current state, cart/nav separation |
| S3 controls/contrast/focus | แก้และตรวจแล้ว | Form 16px/48px, buttons min 48×48, border/control และ outline offset 3px; 28 คู่สีและ keyboard dialog |
| S4 loading/error/empty/feedback | แก้และตรวจแล้ว | API 500→retry 14 หน้า, empty 10 หน้า, race 3 หน้า, dialog error/retry; field associations ตรวจ source/compile |
| S5 auth/returnTo/session | แก้แต่ตรวจได้บางส่วน | Login/register invite ผ่าน browser; malicious paths ผ่าน focused tests; session 500/refresh 500/หมดอายุผ่าน fixtures; Google OAuth จริงยังไม่ได้ทดสอบ |
| S6 semantics/fonts/consistency | แก้และตรวจแล้ว | LinkButton/shared states/ticket/fonts; build, DOM screenshots, Resource Timing ของฟอนต์ และ reduced-motion |
| Landing | แก้แต่ตรวจได้บางส่วน | ตัวอย่างตั๋วและ 3 จังหวะ ปุ่ม wrap และรอ auth readiness; compile/source ตรวจแล้ว ยังไม่ทำ usability study |
| login/register | แก้และตรวจแล้ว | Autocomplete, password reveal, safe returnTo, field errors, Google divider ตาม option; browser invite ทั้ง 2 ทางและภาพ 375/390/1280 |
| forgot/reset-password | แก้แต่ตรวจได้บางส่วน | ตัด Resend/log, แก้อีเมลได้, invalid-link recovery และ success notice; invalid reset ผ่าน browser ไม่ส่งเมลหรือเปลี่ยนรหัสจริง |
| Google shared | แก้แต่ตรวจได้บางส่วน | รอ script readiness/timeout/retry, busy guard, width ตาม container/resize และ safe destination; ยังไม่มีหลักฐาน OAuth ด้วย provider จริง |
| dashboard | แก้และตรวจแล้ว | Primary next step ตามคู่/คำขอ/คูปองจริง สถิติรองและ retry; ภาพมือถือ/desktop, 500 recovery |
| catalog | แก้และตรวจแล้ว | GiftViews/filter ไทย/เพิ่มลงของขวัญพร้อม live feedback; race, 500/retry, empty, cart positioning และ screenshots |
| sets | แก้และตรวจแล้ว | คำว่าเลือกชุดก่อนตรวจของขวัญ ชื่อ/จำนวน wrap; routes เดิม, empty/error/retry และ geometry |
| gifts/new | แก้และตรวจแล้ว | Quantity/local day, set preview guard, custom draft, duplicate lock, success destination; fixture ส่งจริงผ่าน UI 1 request และ unit boundary tests |
| my-coupons | แก้และตรวจแล้ว | Snapshot identity, reserved count, task/rarity filters, modal; browser terms/rarity แยกกัน, filter race และ retry รักษาข้อความ |
| requests | แก้และตรวจแล้ว | Review/cancel/Escape ไม่เรียก approve; double click เรียกครั้งเดียว; focus trap/return/fallback และ tab race ผ่าน browser |
| history | แก้และตรวจแล้ว | อ่านชื่อ/detail เต็ม วันที่แยกบรรทัด; long fixture, empty/error/retry และ 5 ขนาดจอ |
| sent-gifts | แก้และตรวจแล้ว | มีทางเข้าจากเพิ่มเติม/ส่งสำเร็จ แถว wrap, empty action/retry; browser geometry และ API failure |
| couple | แก้แต่ตรวจได้บางส่วน | ทางเลือกส่ง/มีคำเชิญ, parse trusted link/code ตาม hex32 ของ backend, copy/share fallback, load error; parser/empty/error ผ่าน ยังไม่ทดสอบ native share/clipboard บนอุปกรณ์จริง |
| couple/accept | แก้แต่ตรวจได้บางส่วน | ไม่ทำ query หาย มี skeleton และทางขอลิงก์ใหม่; browser auth flow ผ่าน ผู้ส่ง preview ต้องเพิ่ม API |
| admin shell/dashboard | แก้และตรวจแล้ว | เมนูไทยไม่ต้องเลื่อน strip, page h1, latest-load copy/refresh/drilldown; geometry และ 500/retry |
| admin/coupons | แก้แต่ตรวจได้บางส่วน | Mobile list, focus form, field errors, confirmation+mutation lock; browser data/error/reflow ผ่าน ไม่บันทึกหรือลบข้อมูล backend จริง |
| admin/sets | แก้แต่ตรวจได้บางส่วน | Grid/labels/width wrapper, row-specific delete name, duplicate/quantity validation, focus new select; select >150px ใน geometry tests และภาพ 375/390/1280 ไม่บันทึกจริง |
| admin/users | แก้แต่ตรวจได้บางส่วน | Mobile list/email wrap, local search, protected account copy, pending lock; geometry/error ผ่าน ไม่ลบผู้ใช้จริง |
| admin/overview | แก้และตรวจแล้ว | แยก error สอง API, tabs, activity cards/status ไทย และ batch ID จาก contract; error/empty/reflow ผ่าน |
| ข้อสันนิษฐานว่ามี purple neon/gradient หรือรูป catalog หนัก | ไม่เกี่ยวแล้ว | Audit เดิมระบุว่าไม่พบ จึงไม่ได้เพิ่มงานรื้อภาพหรือ animation framework |
| P3 และข้อมูลที่ contract ยังไม่มี | ยังเหลือ | ดู backlog ด้านล่าง ไม่สร้างข้อมูลสมมติใน production |

## ผลทดสอบที่รันจริง

| วิธีตรวจ | ผล |
| --- | --- |
| `npm test` | ผ่าน 6 focused tests: returnTo, local date/expiry หลาย timezone, quantity bounds, snapshot grouping, invitation parser และ error privacy/ภาษาไทย |
| `npm run lint` | ไม่มี error; 13 warnings ของ `react-hooks/set-state-in-effect` ตามระดับ warning ที่ repo ตั้งไว้ เก็บรายละเอียดใน `ui-implementation/lint.txt` |
| `npx tsc --noEmit` | ผ่าน และ Next build ทำ TypeScript check ผ่านด้วย |
| `npm run build` แบบ config ปกติใน execution environment นี้ | ติด Turbopack child-process socket: `node process exited before we could connect` จึงไม่ถือว่า default build ผ่านบนเครื่องมือนี้ |
| Production build เพื่อทดสอบ | ผ่านครบ 24 app entries รวม internal pages/favicon โดยตั้ง `experimental.turbopackPluginRuntimeStrategy: forceWorkerThreads` **ชั่วคราวเฉพาะการทดสอบ** ตามคู่มือ Next 16.4.3 ที่ติดตั้ง รันนอก sandbox เมื่อเจอ EPERM และคืน `next.config.ts` เดิมเสมอ ไม่มี override นี้ใน source ที่ส่งงาน |
| Browser บน production build ดังกล่าว | ผ่าน 34 กลุ่มตรวจ; 45 คู่หน้า/viewport, 14 หน้า 500→retry, 10 empty lists, auth invite ทั้ง login/register, request/approve/send, race, session และ reduced motion |
| Keyboard | Tab/Shift+Tab อยู่ใน dialog, Escape/cancel ไม่ใช้สิทธิ์, คืน focus ให้ปุ่มเดิม หรือหัวข้อเมื่อปุ่มหายหลังอนุมัติ |
| Viewports | 320×812, 375×812, 390×844, 430×844, 1280×900; long names/details, admin form และจำนวนหลายรายการ ไม่เกิด page overflow ใน 45 ตัวอย่าง |
| Light/dark และ text spacing | 390 ใช้ OS dark ใน geometry รอบสุดท้าย; 375/320/430/1280 ใช้ light; override line-height 1.5, letter .12em, word .16em, paragraph 2em ที่ 320/390/430 ผ่าน reflow/cart separation |
| Runtime | ไม่มี browser `pageerror` ในชุดที่ผ่าน การเรียก API ทั้งหมดถูก intercept ด้วย fixtures; unknown endpoint ตอบ 501 และ block third-party network |

รายละเอียด machine-readable: [evidence.json](ui-implementation/evidence.json), [bundle.json](ui-implementation/bundle.json)

Browser flows เป็นการกด/กรอกบนเว็บที่รันจริงโดย Playwright ส่วน backend เป็น fixtures ตาม types และ endpoint ของ repo ไม่มีการเรียก backend จริง ไม่มีการส่งเมล/จับคู่/ส่งของขวัญ/ใช้สิทธิ์/ลบข้อมูล production การผ่านนี้พิสูจน์พฤติกรรม UI ภายใต้สถานการณ์ที่จำลองไว้ ไม่พิสูจน์ concurrency/idempotency ฝั่ง server

Worker override เป็นข้อจำกัดของการตรวจ ไม่ได้แก้ config ถาวร คู่มือที่ติดตั้งเตือนว่า forceWorkerThreads อาจกระทบ Node >=24.13.1 ตอน teardown จึงไม่แนะนำให้เปิดถาวรเพียงเพื่อเลี่ยงปัญหาของ execution environment

## ภาพหลังแก้

เก็บ 21 ภาพใน `docs/archive/ui-implementation/screenshots/` จาก build ที่ทดสอบ รายชื่อทั้งหมดอยู่ใน evidence.json ชื่อผู้ใช้และข้อมูลในภาพเป็น fixtures

| หน้า | มือถือ | Desktop |
| --- | --- | --- |
| Login | [375](ui-implementation/screenshots/login-375.png), [390](ui-implementation/screenshots/login-390.png) | [1280](ui-implementation/screenshots/login-1280.png) |
| Dashboard | [375](ui-implementation/screenshots/dashboard-375.png), [390](ui-implementation/screenshots/dashboard-390.png) | [1280](ui-implementation/screenshots/dashboard-1280.png) |
| Catalog | [375](ui-implementation/screenshots/catalog-375.png), [390](ui-implementation/screenshots/catalog-390.png) | [1280](ui-implementation/screenshots/catalog-1280.png) |
| Checkout | [375](ui-implementation/screenshots/gifts-new-375.png), [390](ui-implementation/screenshots/gifts-new-390.png) | [1280](ui-implementation/screenshots/gifts-new-1280.png) |
| Review ก่อนอนุมัติ | [Mobile](ui-implementation/screenshots/review-mobile.png) | [Desktop](ui-implementation/screenshots/review-desktop.png) |
| ขอใช้แบบ error | [Mobile](ui-implementation/screenshots/request-error-mobile.png) | [Desktop](ui-implementation/screenshots/request-error-desktop.png) |
| Admin set form | [375](ui-implementation/screenshots/admin-sets-375.png), [390](ui-implementation/screenshots/admin-sets-390.png) | [1280](ui-implementation/screenshots/admin-sets-1280.png) |

ภาพ full-page แสดง fixed navigation ณ viewport ขณะจับภาพ จึงอาจเห็นแถบอยู่กลางภาพยาว ใช้ geometry/scroll checks ประกอบการประเมินการบังเนื้อหา

## Contrast หลังแก้

คำนวณใหม่ด้วย sRGB relative luminance จากสีที่ browser resolve ผ่าน CSS tokens ใน production build ตารางนี้ครอบคลุมคู่ที่นำไปใช้จริง ไม่รับรองคู่สีอื่นโดยอนุมาน ข้อความทั่วไปใช้ 4.5:1; ขอบ control/focus ใช้ 3:1 แยกจากเป้า product 16px/48px เส้นตกแต่งและ disabled controls ไม่ใช้เกณฑ์ข้อความปกติแบบเหมารวม

| สีข้อความ/เส้น | พื้น | RGB ที่ render (หน้า/พื้น) | Ratio | เกณฑ์ | ผล |
| --- | --- | --- | ---: | ---: | --- |
| ink | mint-soft | rgb(59, 36, 48) / rgb(223, 245, 232) | 12.400:1 | 4.5:1 | ผ่าน |
| ink | sky-soft | rgb(59, 36, 48) / rgb(227, 240, 255) | 12.272:1 | 4.5:1 | ผ่าน |
| ink | lavender-soft | rgb(59, 36, 48) / rgb(238, 229, 255) | 11.673:1 | 4.5:1 | ผ่าน |
| ink | butter-soft | rgb(59, 36, 48) / rgb(255, 240, 184) | 12.430:1 | 4.5:1 | ผ่าน |
| muted | surface | rgb(113, 84, 95) / rgb(255, 255, 255) | 6.697:1 | 4.5:1 | ผ่าน |
| love | canvas | rgb(184, 50, 88) / rgb(255, 248, 243) | 5.494:1 | 4.5:1 | ผ่าน |
| focus | love-soft | rgb(108, 61, 145) / rgb(255, 227, 235) | 6.426:1 | 3:1 | ผ่าน |
| focus | lavender-soft | rgb(108, 61, 145) / rgb(238, 229, 255) | 6.370:1 | 3:1 | ผ่าน |
| control | love-soft | rgb(137, 108, 120) / rgb(255, 227, 235) | 3.893:1 | 3:1 | ผ่าน |
| ink | canvas | rgb(59, 36, 48) / rgb(255, 248, 243) | 13.486:1 | 4.5:1 | ผ่าน |
| ink | surface | rgb(59, 36, 48) / rgb(255, 255, 255) | 14.180:1 | 4.5:1 | ผ่าน |
| muted | canvas | rgb(113, 84, 95) / rgb(255, 248, 243) | 6.370:1 | 4.5:1 | ผ่าน |
| muted | love-soft | rgb(113, 84, 95) / rgb(255, 227, 235) | 5.562:1 | 4.5:1 | ผ่าน |
| love | surface | rgb(184, 50, 88) / rgb(255, 255, 255) | 5.777:1 | 4.5:1 | ผ่าน |
| love | love-soft | rgb(184, 50, 88) / rgb(255, 227, 235) | 4.797:1 | 4.5:1 | ผ่าน |
| surface | love | rgb(255, 255, 255) / rgb(184, 50, 88) | 5.777:1 | 4.5:1 | ผ่าน |
| surface | love-hover | rgb(255, 255, 255) / rgb(156, 38, 72) | 7.542:1 | 4.5:1 | ผ่าน |
| surface | danger | rgb(255, 255, 255) / rgb(180, 35, 53) | 6.497:1 | 4.5:1 | ผ่าน |
| surface | danger-hover | rgb(255, 255, 255) / rgb(144, 28, 42) | 8.804:1 | 4.5:1 | ผ่าน |
| danger | danger-soft | rgb(180, 35, 53) / rgb(253, 231, 235) | 5.509:1 | 4.5:1 | ผ่าน |
| mint-ink | mint-soft | rgb(32, 93, 70) / rgb(223, 245, 232) | 6.762:1 | 4.5:1 | ผ่าน |
| sky-ink | sky-soft | rgb(33, 78, 120) / rgb(227, 240, 255) | 7.493:1 | 4.5:1 | ผ่าน |
| lavender-ink | lavender-soft | rgb(86, 53, 128) / rgb(238, 229, 255) | 7.799:1 | 4.5:1 | ผ่าน |
| butter-ink | butter-soft | rgb(112, 73, 0) / rgb(255, 240, 184) | 6.968:1 | 4.5:1 | ผ่าน |
| control | surface | rgb(137, 108, 120) / rgb(255, 255, 255) | 4.688:1 | 3:1 | ผ่าน |
| control | canvas | rgb(137, 108, 120) / rgb(255, 248, 243) | 4.458:1 | 3:1 | ผ่าน |
| focus | surface | rgb(108, 61, 145) / rgb(255, 255, 255) | 7.738:1 | 3:1 | ผ่าน |
| focus | canvas | rgb(108, 61, 145) / rgb(255, 248, 243) | 7.359:1 | 3:1 | ผ่าน |

Focus outline กว้าง 3px และ offset 3px มีช่อง surface/canvas ระหว่างปุ่มเข้มกับ outline ตัวอย่าง focus ดูได้ในภาพ checkout และ review ไม่ใช้คู่ม่วง/rose เข้มชนกันโดยตรง

## Font และ bundle

| ไฟล์ฟอนต์ | WOFF2 / encodedBodySize | TransferSize ที่วัด |
| --- | ---: | ---: |
| sarabun_400-s.p.2epet27hlnv7u.woff2 | 20,008 bytes | 20,308 bytes |
| sarabun_600-s.p.3wi-l8v94bh_s.woff2 | 20,028 bytes | 20,328 bytes |
| mali_600-s.2iac7nm8r-x83.woff2 | 31,844 bytes | 32,144 bytes |

รวมฟอนต์ WOFF2 71,880 bytes; Resource Timing transfer รวม 72,780 bytes ใน sample ที่วัด (รวม overhead ที่ browser รายงาน)

JS/CSS static chunks รวมทุก route: **723,189 bytes raw / 229,581 bytes gzip** จากการ gzip แต่ละไฟล์แล้วรวม ยังไม่ใช่ network transfer ต่อ route และไม่รวมฟอนต์ ชิ้นใหญ่สุด 229,850 bytes raw / 71,991 bytes gzip ไม่มี runtime package ใหม่

ฟอนต์ self-host ด้วย next/font/local เพราะ execution environment ติดต่อ Google Fonts ระหว่าง build ไม่ได้ ดาวน์โหลดจาก Google Fonts แล้ว subset ไทย/Latin/เครื่องหมายพื้นฐานตาม `fonts/source.css` มี OFL ของทั้งสองตระกูล Body preload เฉพาะ Sarabun 400/600; Mali 600 ใช้ display และไม่ preload ไม่มี Geist/Mono ที่ไม่ได้ใช้

ไม่ได้มี production build baseline ที่ตรง source ก่อนแก้ จึงยังคำนวณ delta bundle/font ที่เพิ่มเทียบก่อนงานนี้ไม่ได้ ไม่ใช้ build เก่าใน audit เป็น baseline และไม่ได้วัด CWV field p75 หรือใช้ lab score แทนผู้ใช้จริง

## วิธีรันทดสอบซ้ำ

จาก `frontend/` ใช้ `npm test`, `npm run lint`, `npm run build` และเปิด production server ด้วย `npm run start`

Browser script คือ `tests/ui.mjs` ใช้ Playwright ที่ติดตั้งอยู่แล้วผ่าน `PLAYWRIGHT_MODULE` (directory ของ package) และถ้าจำเป็น `PLAYWRIGHT_CHROMIUM_EXECUTABLE` (ไฟล์ Chromium) จากนั้น `npm run test:ui` ค่า UI_TEST_URL ต้องเป็น localhost หรือ 127.0.0.1 เท่านั้น ค่าเริ่มต้น `http://127.0.0.1:3000` ไม่มีการเพิ่ม dependency ใน package-lock เพื่อเครื่องมือทดสอบนี้

Focused tests ใช้ native TypeScript stripping ของ Node ที่ใช้ตรวจงานนี้ (24.21.0); เครื่องที่ใช้ Node รุ่นเก่าต้องใช้ runtime ที่รองรับคำสั่งนี้ Browser fixtures เป็นข้อมูลตัวอย่างของการทดสอบเท่านั้น

## ข้อจำกัดและ backlog

- ยังไม่ได้ทดสอบ Google OAuth จริง, native share/clipboard, iPhone/Safari keyboard/notch หรือ screen reader จริง
- ยังไม่ได้ทำ browser zoom 200%/400% จริง การวัด viewport 320px และ text-spacing overrides ไม่ใช่หลักฐานแทน browser zoom
- ต้องเดิน flow กับบัญชีทดสอบสองคนและ backend/database ที่ยืนยันว่าเป็นข้อมูลทดสอบ ก่อนปล่อยงานจริง รวม email/reset-password, admin save/delete และกรณี network ขาดหลัง server commit ที่ UI อย่างเดียวรับรองการไม่ซ้ำไม่ได้
- P3: invite preview ต้องเพิ่มชื่อผู้เชิญ/อายุคำเชิญใน API; search/pagination ฝั่ง server และ sender/receiver ใน admin feed ต้องเพิ่ม contract; resend/repeat gift, collection progress และ PWA ต้องออกแบบและทดสอบแยก ไม่มีข้อมูลหรือ progress สมมติ
- ViewTransition เป็น optional และไม่ได้เพิ่ม ไม่มี animation/state framework ใหม่ ไม่มีการเปลี่ยน auth architecture หรือ backend permissions

ผลนี้ไม่ใช่การรับรอง WCAG AA ทั้งเว็บไซต์ ส่วนที่ยังตรวจได้บางส่วนระบุไว้ใน mapping และต้องตรวจอุปกรณ์/เทคโนโลยีช่วยเหลือก่อนปล่อย
