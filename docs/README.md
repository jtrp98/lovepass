# เอกสาร LOVE PASS

เอกสารแบ่งเป็น 4 หมวดตามคำถามที่ผู้อ่านมี เอกสารใหม่ต้องลงหมวดใดหมวดหนึ่งและเพิ่มบรรทัดในหน้านี้

| หมวด | ตอบคำถาม | ใส่อะไร |
| --- | --- | --- |
| [`product/`](product/) | ระบบต้องทำอะไร ทำงานอย่างไร | requirements, กฎธุรกิจ, API contract, data model, spec ของฟีเจอร์ |
| [`design/`](design/) | หน้าตาและความรู้สึกของแอปเป็นแบบไหน | design system, art direction, materials, บันทึกงาน redesign ที่ยังเป็นมาตรฐานอยู่ |
| [`guides/`](guides/) | ต้องทำอย่างไร | รัน local, deploy, ตั้งค่าบริการภายนอก, release |
| [`archive/`](archive/) | เคยทำอะไรไปแล้ว | prompt, audit, ผลงานรอบที่จบแล้ว และ evidence เก่า อ่านอ้างอิงเท่านั้น |

## product — ระบบ

- [lovepass.md](product/lovepass.md) — requirements และ technical design ฉบับเต็ม (บทบาท, flow, data model, API, architecture)
- [coupon-categories.md](product/coupon-categories.md) — หมวดหมู่คูปอง, snapshot, API contract และภาพประกอบประจำหมวด

## design — หน้าตาและประสบการณ์

- [design/README.md](design/README.md) — **design system ที่ใช้อยู่**: art direction, tokens, materials, components และวิธีเพิ่ม asset ใหม่
- [romantic-redesign/](design/romantic-redesign/README.md) — บันทึกงาน redesign แนว romantic stationery พร้อม evidence และ screenshots

## guides — วิธีทำงาน

- [setup-and-deploy.md](guides/setup-and-deploy.md) — รัน local, tests และ deploy
- [online-deployment.md](guides/online-deployment.md) — ระบบที่ deploy อยู่และการตั้งค่า hosting
- [gmail-setup.md](guides/gmail-setup.md) — ส่งอีเมลแจ้งเตือนผ่าน Gmail API
- [release-workflow.md](guides/release-workflow.md) — branch, version และขั้นตอน release

## archive — ประวัติ

- [archive/README.md](archive/README.md) — รายการงานที่จบแล้ว (UI audit, ticket refresh, theme audit, requests/sent-gifts refresh)

## กติกาการเขียนเอกสาร

- ภาษาไทยเป็นหลัก ใช้ศัพท์เทคนิคภาษาอังกฤษตามจริง (component, endpoint, token)
- ลิงก์ไปโค้ดใช้ path แบบ relative จากไฟล์เอกสาร
- ผลทดสอบจาก browser (`npm run test:ui` ฯลฯ) ลงที่ `frontend/test-results/` ซึ่งไม่ถูก commit ถ้าต้องเก็บเป็นหลักฐานให้คัดลอกเฉพาะที่จำเป็นไปไว้ใต้ `archive/<ชื่องาน>/`
- เอกสารที่ล้าสมัยแล้วย้ายไป `archive/` พร้อมบรรทัดอธิบายใน `archive/README.md` ไม่ลบทิ้ง
