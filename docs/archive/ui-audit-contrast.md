# LOVE PASS — ตารางคำนวณ contrast

วันที่ตรวจ: 30 ตุลาคม 2026 · เอกสารประกอบ [รายงานหลัก](ui-audit-report.md)

## วิธีคำนวณและขอบเขต

อ่าน palette จาก CSS ที่ dev server build จริง: frontend/.next/dev/static/chunks/src_app_globals_css_css_1igg3k2-ikub5._.single.css ซึ่งมี fallback hex และ lab ภายใต้ supports; browser ที่ตรวจคืน computedStyle เป็น Lab จึงใช้ค่าชุดนี้ ไม่ยก hex Tailwind v3 ใน prompt มาใช้

แปลง Lab D50 → XYZ → Bradford adaptation D65 → sRGB แล้ว clamp ช่องสี0–1; luminance=0.2126R+0.7152G+0.0722B หลัง linearize sRGB; ratio=(Lสว่าง+0.05)/(Lมืด+0.05) ตัดสินด้วยค่าที่ไม่ปัด แสดง3ตำแหน่ง Hexแสดงผลปัด8bit ไม่ใช้hexที่ปัดคำนวณย้อนกลับ สี out-of-gamut อาจถูก browser/display gamut-map ต่างจากการ clamp เล็กน้อย ค่าปัจจุบันจึงเป็นค่าประมาณตาม model ไม่ใช้ค่าที่เฉียดผ่านรับรอง browser ทั้งระบบ Paletteใหม่เป็น sRGB hex ตรง จึงไม่มีความไม่แน่นอนจาก Lab conversion

รวมคู่ text/bg ที่ระบุใน source ทั้ง normal/hover, shared controls, rarity/status, inherited text, light/dark และ nav/cart โปร่งแสง โดยรวมรายการซ้ำ บางคู่ไม่มีข้อมูลใน seed จึงคำนวณจาก source ไม่อ้างว่าเห็นทุก state บนจอจริง Emojiหลายสีและ Google widget ที่ยังไม่เปิดไม่ใช่คู่ text CSS เดียวจึงไม่สร้างตัวเลขสมมติ Disabled controls ได้รับข้อยกเว้น ไม่ใช้ opacity50 ของปุ่ม disabled ตัดสินว่าตก AA

Cascade: [globals.css:22](C:/src/_projectX/lovepass/frontend/src/app/globals.css:22) เป็น unlayered CSS จึงชนะ utility บน body ที่ [layout.tsx:26](C:/src/_projectX/lovepass/frontend/src/app/layout.tsx:26) ทั้ง light/dark พื้น rose50/40 จึงไม่ใช่พื้นจริง White/90 บน dark คำนวณ alpha ตาม model; backdrop-blur ผ่าน content มีหลาย pixel ต้องตรวจซ้ำหลังออกแบบ nav

เกณฑ์จาก [W3C WCAG2.2](https://www.w3.org/TR/WCAG22/): ข้อความทั่วไป4.5:1, ข้อความใหญ่24pxหรือ18.66px boldขึ้นไป3:1, nontext control3:1 ไม่ปัด4.499ให้ผ่าน4.5

## 1. Text/background ปัจจุบัน

| Foreground | Background | Hexประมาณ (fg / bg) | Contrast | เป้า | ผล | ตำแหน่ง/หมายเหตุ |
| --- | --- | --- | ---: | ---: | --- | --- |
| white | rose-500 | #FFFFFF / #FF2056 | 3.755:1 | 4.5:1 | ไม่ผ่าน | [ui.tsx:18](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:18) — primary |
| white | rose-600 | #FFFFFF / #EC003F | 4.510:1 | 4.5:1 | ผ่าน | [ui.tsx:18](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:18) — primary hover |
| white | red-500 | #FFFFFF / #FB2C36 | 3.820:1 | 4.5:1 | ไม่ผ่าน | [ui.tsx:20](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:20) — danger |
| white | red-600 | #FFFFFF / #E7000B | 4.765:1 | 4.5:1 | ผ่าน | [ui.tsx:20](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:20) — danger hover |
| rose-700 | rose-50 | #C70036 / #FFF1F2 | 5.506:1 | 4.5:1 | ผ่าน | [ui.tsx:19](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:19) — secondary |
| rose-700 | rose-100 | #C70036 / #FFE4E6 | 5.038:1 | 4.5:1 | ผ่าน | [ui.tsx:19](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:19) — secondary hover / active nav |
| gray-600 | white | #4A5565 / #FFFFFF | 7.561:1 | 4.5:1 | ผ่าน | [ui.tsx:21](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:21) — ghost / descriptions |
| gray-600 | gray-100 | #4A5565 / #F3F4F6 | 6.871:1 | 4.5:1 | ผ่าน | [ui.tsx:21](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:21) — ghost hover / COMMON |
| gray-700 | white | #364153 / #FFFFFF | 10.306:1 | 4.5:1 | ผ่าน | [ui.tsx:59](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:59) — field label |
| gray-400 | white | #99A1AF / #FFFFFF | 2.602:1 | 4.5:1 | ไม่ผ่าน | [ui.tsx:93](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:93) — hint / terms |
| gray-500 | white | #6A7282 / #FFFFFF | 4.836:1 | 4.5:1 | ผ่าน | [ui.tsx:126](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:126) — secondary |
| gray-900 | white | #101828 / #FFFFFF | 17.747:1 | 4.5:1 | ผ่าน | [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107) — PageTitle light |
| blue-700 | blue-50 | #1447E6 / #EFF6FF | 6.261:1 | 4.5:1 | ผ่าน | [ui.tsx:71](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:71) — RARE |
| purple-700 | purple-50 | #8200DB / #FAF5FF | 6.596:1 | 4.5:1 | ผ่าน | [ui.tsx:72](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:72) — EPIC |
| amber-700 | amber-50 | #BB4D00 / #FFFBEB | 4.871:1 | 4.5:1 | ผ่าน | [ui.tsx:75](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:75) — LEGENDARY |
| gray-600 | gray-100 | #4A5565 / #F3F4F6 | 6.871:1 | 4.5:1 | ผ่าน | [ui.tsx:70](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:70) — COMMON |
| red-600 | red-50 | #E7000B / #FEF2F2 | 4.362:1 | 4.5:1 | ไม่ผ่าน | [ui.tsx:100](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:100) — ErrorText |
| gray-300 | white | #D1D5DC / #FFFFFF | 1.472:1 | 4.5:1 | ไม่ผ่าน | [page.tsx:89](C:/src/_projectX/lovepass/frontend/src/app/admin/users/page.tsx:89) |
| gray-600 | gray-50 | #4A5565 / #F9FAFB | 7.243:1 | 4.5:1 | ผ่าน | [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — filter hover |
| gray-600 | rose-50 | #4A5565 / #FFF1F2 | 6.875:1 | 4.5:1 | ผ่าน | [page.tsx:163](C:/src/_projectX/lovepass/frontend/src/app/(user)/gifts/new/page.tsx:163) |
| gray-500 | gray-50 | #6A7282 / #F9FAFB | 4.633:1 | 4.5:1 | ผ่าน | [page.tsx:144](C:/src/_projectX/lovepass/frontend/src/app/(user)/my-coupons/page.tsx:144); [page.tsx:187](C:/src/_projectX/lovepass/frontend/src/app/admin/coupons/page.tsx:187) |
| gray-500 | gray-100 | #6A7282 / #F3F4F6 | 4.395:1 | 4.5:1 | ไม่ผ่าน | [page.tsx:12](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:12); [page.tsx:11](C:/src/_projectX/lovepass/frontend/src/app/(user)/history/page.tsx:11); [page.tsx:208](C:/src/_projectX/lovepass/frontend/src/app/admin/coupons/page.tsx:208) |
| rose-600 | white | #EC003F / #FFFFFF | 4.510:1 | 4.5:1 | ผ่าน | [page.tsx:33](C:/src/_projectX/lovepass/frontend/src/app/(user)/dashboard/page.tsx:33); [page.tsx:61](C:/src/_projectX/lovepass/frontend/src/app/(auth)/register/page.tsx:61); [ui.tsx:116](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:116) |
| rose-600 | rose-50 | #EC003F / #FFF1F2 | 4.101:1 | 4.5:1 | ไม่ผ่าน | [page.tsx:33](C:/src/_projectX/lovepass/frontend/src/app/(user)/dashboard/page.tsx:33); [page.tsx:61](C:/src/_projectX/lovepass/frontend/src/app/(auth)/register/page.tsx:61); [ui.tsx:116](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:116) |
| rose-600 | white | #EC003F / #FFFFFF | 4.510:1 | 3:1 | ผ่าน | [ui.tsx:116](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:116); [ui.tsx:127](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:127) — stat 30px bold ใช้เกณฑ์ข้อความใหญ่ |
| blue-600 | white | #155DFC / #FFFFFF | 5.256:1 | 3:1 | ผ่าน | [ui.tsx:117](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:117); [ui.tsx:127](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:127) — stat 30px bold ใช้เกณฑ์ข้อความใหญ่ |
| amber-600 | white | #E17100 / #FFFFFF | 3.193:1 | 3:1 | ผ่าน | [ui.tsx:118](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:118); [ui.tsx:127](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:127) — stat 30px bold ใช้เกณฑ์ข้อความใหญ่ |
| purple-600 | white | #9810FA / #FFFFFF | 5.534:1 | 3:1 | ผ่าน | [ui.tsx:119](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:119); [ui.tsx:127](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:127) — stat 30px bold ใช้เกณฑ์ข้อความใหญ่ |
| gray-700 | white | #364153 / #FFFFFF | 10.306:1 | 3:1 | ผ่าน | [ui.tsx:120](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:120); [ui.tsx:127](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:127) — stat 30px bold ใช้เกณฑ์ข้อความใหญ่ |
| amber-600 | gray-50 | #E17100 / #F9FAFB | 3.058:1 | 4.5:1 | ไม่ผ่าน | [page.tsx:144](C:/src/_projectX/lovepass/frontend/src/app/(user)/my-coupons/page.tsx:144) — expiry 14px |
| purple-700 | purple-100 | #8200DB / #F3E8FF | 5.988:1 | 4.5:1 | ผ่าน | [nav.tsx:49](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:49); [page.tsx:80](C:/src/_projectX/lovepass/frontend/src/app/admin/users/page.tsx:80) |
| purple-700 | white | #8200DB / #FFFFFF | 7.075:1 | 4.5:1 | ผ่าน | [nav.tsx:93](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:93) |
| purple-600 | white | #9810FA / #FFFFFF | 5.534:1 | 4.5:1 | ผ่าน | [nav.tsx:49](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:49) |
| purple-600 | purple-50 | #9810FA / #FAF5FF | 5.159:1 | 4.5:1 | ผ่าน | [nav.tsx:93](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:93) |
| purple-600 | purple-100 | #9810FA / #F3E8FF | 4.683:1 | 4.5:1 | ผ่าน | [nav.tsx:93](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:93) |
| amber-700 | amber-100 | #BB4D00 / #FEF3C6 | 4.537:1 | 4.5:1 | ผ่าน | [page.tsx:9](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:9) |
| red-700 | red-100 | #C10007 / #FFE2E2 | 5.259:1 | 4.5:1 | ผ่าน | [page.tsx:11](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:11) |
| green-700 | green-50 | #008236 / #F0FDF4 | 4.723:1 | 4.5:1 | ผ่าน | [page.tsx:70](C:/src/_projectX/lovepass/frontend/src/app/(user)/couple/page.tsx:70); [page.tsx:10](C:/src/_projectX/lovepass/frontend/src/app/(user)/history/page.tsx:10) |
| green-700 | green-100 | #008236 / #DCFCE7 | 4.497:1 | 4.5:1 | ไม่ผ่าน | [page.tsx:10](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:10); [page.tsx:208](C:/src/_projectX/lovepass/frontend/src/app/admin/coupons/page.tsx:208) |
| rose-700 | rose-50 | #C70036 / #FFF1F2 | 5.506:1 | 4.5:1 | ผ่าน | [page.tsx:9](C:/src/_projectX/lovepass/frontend/src/app/(user)/history/page.tsx:9) |
| rose-700 | rose-100 | #C70036 / #FFE4E6 | 5.038:1 | 4.5:1 | ผ่าน | [page.tsx:33](C:/src/_projectX/lovepass/frontend/src/app/(user)/sets/page.tsx:33) |
| red-600 | white | #E7000B / #FFFFFF | 4.765:1 | 4.5:1 | ผ่าน | [GoogleLoginButton.tsx:94](C:/src/_projectX/lovepass/frontend/src/components/GoogleLoginButton.tsx:94) |
| ink | white | #171717 / #FFFFFF | 17.928:1 | 4.5:1 | ผ่าน | [globals.css:5](C:/src/_projectX/lovepass/frontend/src/app/globals.css:5); [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66); [page.tsx:41](C:/src/_projectX/lovepass/frontend/src/app/(user)/sets/page.tsx:41); [page.tsx:108](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:108) — light inherited; คำนวณ cascade |
| lightInk | white | #EDEDED / #FFFFFF | 1.171:1 | 4.5:1 | ไม่ผ่าน | [globals.css:18](C:/src/_projectX/lovepass/frontend/src/app/globals.css:18); [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66); [page.tsx:99](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:99); [page.tsx:108](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:108) — dark inherited; บนขาวยืนยันจากจอจริง |
| ink | rose-50 | #171717 / #FFF1F2 | 16.301:1 | 4.5:1 | ผ่าน | [globals.css:5](C:/src/_projectX/lovepass/frontend/src/app/globals.css:5); [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66); [page.tsx:41](C:/src/_projectX/lovepass/frontend/src/app/(user)/sets/page.tsx:41); [page.tsx:108](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:108) — light inherited; คำนวณ cascade |
| lightInk | rose-50 | #EDEDED / #FFF1F2 | 1.064:1 | 4.5:1 | ไม่ผ่าน | [globals.css:18](C:/src/_projectX/lovepass/frontend/src/app/globals.css:18); [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66); [page.tsx:99](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:99); [page.tsx:108](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:108) — dark inherited; บนขาวยืนยันจากจอจริง |
| ink | gray-50 | #171717 / #F9FAFB | 17.175:1 | 4.5:1 | ผ่าน | [globals.css:5](C:/src/_projectX/lovepass/frontend/src/app/globals.css:5); [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66); [page.tsx:41](C:/src/_projectX/lovepass/frontend/src/app/(user)/sets/page.tsx:41); [page.tsx:108](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:108) — light inherited; คำนวณ cascade |
| lightInk | gray-50 | #EDEDED / #F9FAFB | 1.122:1 | 4.5:1 | ไม่ผ่าน | [globals.css:18](C:/src/_projectX/lovepass/frontend/src/app/globals.css:18); [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66); [page.tsx:99](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:99); [page.tsx:108](C:/src/_projectX/lovepass/frontend/src/app/(user)/requests/page.tsx:108) — dark inherited; บนขาวยืนยันจากจอจริง |
| gray-900 | dark | #101828 / #0A0A0A | 1.116:1 | 4.5:1 | ไม่ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| gray-700 | dark | #364153 / #0A0A0A | 1.921:1 | 4.5:1 | ไม่ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| gray-600 | dark | #4A5565 / #0A0A0A | 2.619:1 | 4.5:1 | ไม่ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| gray-500 | dark | #6A7282 / #0A0A0A | 4.094:1 | 4.5:1 | ไม่ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| gray-400 | dark | #99A1AF / #0A0A0A | 7.608:1 | 4.5:1 | ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| rose-600 | dark | #EC003F / #0A0A0A | 4.389:1 | 4.5:1 | ไม่ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| purple-700 | dark | #8200DB / #0A0A0A | 2.798:1 | 3:1 | ไม่ผ่าน | [globals.css:17](C:/src/_projectX/lovepass/frontend/src/app/globals.css:17); [ui.tsx:107](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:107); [ui.tsx:108](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:108); [page.tsx:22](C:/src/_projectX/lovepass/frontend/src/app/admin/overview/page.tsx:22); [page.tsx:76](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:76) — ข้อความนอก surface; purple admin heading20px bold ใช้3 |
| gray-600 | navDark | #4A5565 / #E7E7E7 | 6.086:1 | 4.5:1 | ผ่าน | [nav.tsx:24](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:24); [nav.tsx:26](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:26); [nav.tsx:49](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:49) — white/90 over #0A0A0A; backdrop เปลี่ยนตามเนื้อหา |
| rose-600 | navDark | #EC003F / #E7E7E7 | 3.631:1 | 4.5:1 | ไม่ผ่าน | [nav.tsx:24](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:24); [nav.tsx:26](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:26); [nav.tsx:49](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:49) — white/90 over #0A0A0A; backdrop เปลี่ยนตามเนื้อหา |
| purple-600 | navDark | #9810FA / #E7E7E7 | 4.454:1 | 4.5:1 | ไม่ผ่าน | [nav.tsx:24](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:24); [nav.tsx:26](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:26); [nav.tsx:49](C:/src/_projectX/lovepass/frontend/src/components/nav.tsx:49) — white/90 over #0A0A0A; backdrop เปลี่ยนตามเนื้อหา |
| gray-600 | cartDark | #4A5565 / #F3F3F3 | 6.799:1 | 4.5:1 | ผ่าน | [page.tsx:116](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:116); [page.tsx:118](C:/src/_projectX/lovepass/frontend/src/app/(user)/catalog/page.tsx:118) — white/95 over #0A0A0A |
| placeholderLight | white | #8B8B8B / #FFFFFF | 3.407:1 | 4.5:1 | ไม่ผ่าน | [ui.tsx:31](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:31); [globals.css:5](C:/src/_projectX/lovepass/frontend/src/app/globals.css:5) — placeholder 50% currentColor |
| placeholderDark | white | #F6F6F6 / #FFFFFF | 1.081:1 | 4.5:1 | ไม่ผ่าน | [ui.tsx:31](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:31); [globals.css:18](C:/src/_projectX/lovepass/frontend/src/app/globals.css:18) — placeholder 50% currentColor |

## 2. Non-text controls / focus / เส้นตกแต่ง

| คู่สี | Contrast | เกณฑ์ | ผล/การตีความ | หลักฐาน |
| --- | ---: | --- | --- | --- |
| gray-300 / white | 1.472:1 | 3:1 | ไม่ผ่าน — ขอบ form controls | [ui.tsx:31](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:31) |
| rose-400 / white | 2.859:1 | 3:1 | ไม่ผ่าน — ขอบ focus | [ui.tsx:31](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:31) |
| rose-100 / white | 1.202:1 | 3:1 | ไม่ผ่าน — ring focus | [ui.tsx:31](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:31) |
| gray-200 / white | 1.237:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — ขอบตกแต่ง Card | [ui.tsx:66](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:66) |
| gray-300 / white | 1.472:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — COMMON มีข้อความกำกับ | [ui.tsx:70](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:70) |
| blue-400 / white | 2.637:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — RARE มีข้อความกำกับ | [ui.tsx:71](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:71) |
| purple-400 / white | 2.789:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — EPIC มีข้อความกำกับ | [ui.tsx:72](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:72) |
| amber-500 / white | 2.145:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — LEGENDARY มีข้อความกำกับ | [ui.tsx:76](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:76) |
| amber-400 / amber-50 | 1.656:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — badge border | [ui.tsx:75](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:75) |
| blue-300 / blue-50 | 1.662:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — badge border | [ui.tsx:71](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:71) |
| purple-300 / purple-50 | 1.661:1 | ไม่บังคับกับเส้นตกแต่งนี้ | ไม่เกี่ยว: มีข้อความบอกระดับอยู่แล้ว — badge border | [ui.tsx:72](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:72) |

## 3. Paletteใหม่: คู่textที่อนุญาตและขอบcontrol

จุดที่จะเปลี่ยน [ui.tsx:18](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:18) / [ui.tsx:31](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:31) / [ui.tsx:69](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:69) / [ui.tsx:100](C:/src/_projectX/lovepass/frontend/src/components/ui.tsx:100) และ body [globals.css:22](C:/src/_projectX/lovepass/frontend/src/app/globals.css:22) ตารางนี้เป็นข้อเสนอ ยังไม่เปลี่ยน code

| Foreground | Background | Hex (fg / bg) | Contrast | เกณฑ์ | ผล/ใช้กับ |
| --- | --- | --- | ---: | ---: | --- |
| ink | canvas | #3B2430 / #FFF8F3 | 13.486:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | surface | #3B2430 / #FFFFFF | 14.180:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | love-soft | #3B2430 / #FFE3EB | 11.775:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | mint-soft | #3B2430 / #DFF5E8 | 12.400:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | sky-soft | #3B2430 / #E3F0FF | 12.272:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | lavender-soft | #3B2430 / #EEE5FF | 11.673:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | butter-soft | #3B2430 / #FFF0B8 | 12.430:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| ink | danger-soft | #3B2430 / #FDE7EB | 12.023:1 | 4.5:1 | ผ่าน — ชื่อ/เนื้อหาบนพื้นสีที่กำหนด |
| muted | canvas | #71545F / #FFF8F3 | 6.370:1 | 4.5:1 | ผ่าน — ข้อความรอง/COMMON |
| muted | surface | #71545F / #FFFFFF | 6.697:1 | 4.5:1 | ผ่าน — ข้อความรอง/COMMON |
| love | love-soft | #B83258 / #FFE3EB | 4.797:1 | 4.5:1 | ผ่าน — CTAรอง / link / brand |
| love | surface | #B83258 / #FFFFFF | 5.777:1 | 4.5:1 | ผ่าน — CTAรอง / link / brand |
| love | canvas | #B83258 / #FFF8F3 | 5.494:1 | 4.5:1 | ผ่าน — CTAรอง / link / brand |
| mint-ink | mint-soft | #205D46 / #DFF5E8 | 6.762:1 | 4.5:1 | ผ่าน — ข้อความหมวด/rarity/status |
| sky-ink | sky-soft | #214E78 / #E3F0FF | 7.493:1 | 4.5:1 | ผ่าน — ข้อความหมวด/rarity/status |
| lavender-ink | lavender-soft | #563580 / #EEE5FF | 7.799:1 | 4.5:1 | ผ่าน — ข้อความหมวด/rarity/status |
| butter-ink | butter-soft | #704900 / #FFF0B8 | 6.968:1 | 4.5:1 | ผ่าน — ข้อความหมวด/rarity/status |
| danger | danger-soft | #B42335 / #FDE7EB | 5.509:1 | 4.5:1 | ผ่าน — ErrorText |
| white | love | #FFFFFF / #B83258 | 5.777:1 | 4.5:1 | ผ่าน — ข้อความปุ่ม normal/hover |
| white | love-hover | #FFFFFF / #9C2648 | 7.542:1 | 4.5:1 | ผ่าน — ข้อความปุ่ม normal/hover |
| white | danger | #FFFFFF / #B42335 | 6.497:1 | 4.5:1 | ผ่าน — ข้อความปุ่ม normal/hover |
| white | danger-hover | #FFFFFF / #901C2A | 8.804:1 | 4.5:1 | ผ่าน — ข้อความปุ่ม normal/hover |
| control | canvas | #896C78 / #FFF8F3 | 4.458:1 | 3:1 | ผ่าน — เส้นขอบcontrol ไม่ใช้เป็นtext |
| focus | canvas | #6C3D91 / #FFF8F3 | 7.359:1 | 3:1 | ผ่าน — outlinefocus เทียบพื้น |
| control | surface | #896C78 / #FFFFFF | 4.688:1 | 3:1 | ผ่าน — เส้นขอบcontrol ไม่ใช้เป็นtext |
| focus | surface | #6C3D91 / #FFFFFF | 7.738:1 | 3:1 | ผ่าน — outlinefocus เทียบพื้น |

Focusต้องมี outline-offset-2 ที่แสดง canvas/surface จริงระหว่างปุ่มกับ outline จึงใช้คู่ focus/canvas หรือ focus/surface ด้านบน ห้าม outline สีม่วงชนปุ่ม love โดยตรงเพราะสีเข้มสองสี contrast ต่ำ และต้องไม่ clip outline ด้วย overflow hidden

## 4. ผลต่างจาก baseline ใน prompt

- White/rose500≈3.755, white/red500≈3.820, red600/red50≈4.362 และrose400/white≈2.859 ยังไม่ผ่านหน้าที่นั้น แม้ตัวเลขต่างจาก Tailwindv3
- Gray500/white≈4.836ผ่านข้อความทั่วไป แต่gray500/gray100≈4.395ไม่ผ่าน จึงต้องแก้CANCELLED/INACTIVE/expiredbadgeด้วย
- Amber600/white≈3.193ผ่านstat30pxboldที่เกณฑ์3 แต่amber600/gray50≈3.058ไม่ผ่านข้อความ14pxที่เกณฑ์4.5
- Darkmodeพังสองทิศ: gray900/dark≈1.116 และ#EDEDED/white≈1.171 แก้พื้นอย่างเดียวไม่พอหากtextยังสืบทอดขัดกับsurface
- Navโปร่งแสงขึ้นกับpixelใต้blur ไม่ใช้ผลบนขาวรับรองตอนdark/scrollผ่านcontent เสนอsurfaceทึบแล้วตรวจใหม่

คู่สีจากข้อมูล/ภาพภายนอกในอนาคตต้องคำนวณเพิ่ม ไม่รับรองคู่ข้ามกลุ่มโดยอัตโนมัติ
