# LOVE PASS online

ตรวจล่าสุด 30 ตุลาคม 2026

## ระบบที่ใช้งานอยู่

| ส่วน | ที่อยู่ / การตั้งค่า |
| --- | --- |
| เว็บ | https://lovepass.vercel.app |
| Privacy policy | https://lovepass.vercel.app/privacy |
| API | https://lovepass-api-jtrp98.onrender.com |
| Health | https://lovepass-api-jtrp98.onrender.com/health |
| Vercel | ทีม `jtrp98`, โปรเจกต์ `lovepass`, แผน Hobby, root `frontend` |
| Render | workspace `jtrp98`, service `lovepass-api-jtrp98`, แผน Free, Frankfurt |
| ฐานข้อมูล | Supabase เดิม ไม่ได้สร้างฐานข้อมูลใหม่บน Render |
| สาขา release / production มาตรฐาน | `main` ผ่าน pull request จาก `dev/golf` |
| Snapshot ก่อน release 1.2.0 | Vercel `433b8da80500791dd5d473ad835541acef6c84b9` / Render `87e6905c79646d1af372f817ae315ef2e43d086e` |

Vercel ติดตาม `main` สำหรับ production แล้ว ส่วน Render ปิด auto deploy และใช้การ deploy แบบ manual
ก่อน deploy release 1.2.0 ให้เปลี่ยน **Settings → Build & Deploy → Branch** ของ Render จาก `codex/lovepass-online` เป็น `main` ตรวจ commit ก่อนกด deploy ทุกครั้ง ไม่ใช้สาขา `codex/lovepass-online` เป็นสาขาออนไลน์ต่อ

Release 1.2.0 มี migration ของชุดของขวัญ ต้อง deploy API และยืนยัน migration/endpoint ใหม่สำเร็จก่อนเปิดใช้ frontend ใหม่ รายละเอียดอยู่ใน [release notes](../archive/releases/1.2.0.md)

## การตั้งค่า

- Vercel: `NEXT_PUBLIC_API_BASE_URL=https://lovepass-api-jtrp98.onrender.com`
- Render: `App__FrontendUrl=https://lovepass.vercel.app`
- Render: `Cors__AllowedOrigins=https://lovepass.vercel.app;https://lovepass-jtrp98.vercel.app` (คั่นด้วย `;`)
- Render: `Email__Provider=Gmail` และตั้ง `Gmail__*` แล้ว
- ค่าลับและรหัสแอดมินอยู่ใน `backend/.env.production.local` ซึ่งถูก gitignore ห้าม commit หรือแสดงค่าใน log
- Gmail token ใหม่ถูกบันทึกใน `backend/.env` และ production profile ตรงกันแล้ว

## Gmail OAuth

โปรเจกต์ Google Cloud `studied-sled-513121-h9` อยู่ในสถานะ **In production**
ผู้ส่งคือ `jaturapat.code@gmail.com` ใช้เฉพาะ scope `gmail.send`
ตั้ง homepage, privacy URL และ authorized domain เป็นเว็บ Vercel ข้างต้นแล้ว
เจ้าของบัญชีอนุญาตเชื่อมต่อใหม่หลังเปลี่ยนเป็น production และนำ refresh token ใหม่ไปตั้งบน Render แล้ว

token ใหม่พ้นเงื่อนไขหมดอายุ 7 วันของโหมด Testing แต่ยังถูกเพิกถอนได้ เช่น ถอนสิทธิ์หรือเปลี่ยนรหัส Gmail
Google ยังแสดงคำเตือน unverified app ในขั้นตอนเชื่อมบัญชี ผู้รับอีเมลแจ้งเตือนไม่ต้องเชื่อม Gmail
ดูเงื่อนไข [refresh token](https://developers.google.com/identity/protocols/oauth2#expiration)
และ [ข้อยกเว้นการตรวจแอปสำหรับ personal use](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification#personal-use)

## ผลตรวจของ snapshot ออนไลน์เดิม (ก่อน release 1.2.0)

- Render snapshot เดิมเป็น `87e6905c79646d1af372f817ae315ef2e43d086e` หลังอัปเดต Gmail ส่วน Vercel production ปัจจุบันเป็น READY ที่ `433b8da80500791dd5d473ad835541acef6c84b9`
- Browser จริง: ล็อกอินผ่านเว็บ → Render → Supabase, หน้าแอดมินและ catalog ที่ 390/1440px ผ่าน
- หน้าแรกและ privacy ที่ 320/768/1024/1440px ผ่าน ไม่มีหน้าล้นแนวนอนหรือ JavaScript page errors
- ตรวจ CORS ของเว็บจริง, API health และการปฏิเสธ admin endpoint ที่ไม่ล็อกอินแล้ว
- ใช้ Gmail sender ของ backend ส่งอีเมลทดสอบจริงถึงบัญชีผู้ส่ง: Gmail API ตอบ 200 หลังใช้ token ใหม่
- ตรวจ Vercel runtime error logs หลังทดสอบ ไม่พบรายการ error
- เครื่องมืออ่าน Render logs รอบสุดท้ายตอบ 503 (log retrieval unavailable); หลัง deploy ตรวจ API health และ CORS ผ่านแล้ว
- หลักฐาน browser อยู่ใน `backend/obj/ui-production-validation/` (gitignored)

การส่งอีเมลทดสอบใช้โค้ด backend บนเครื่อง การตั้งค่าเดียวกันถูกอัปเดตบน Render และตรวจ health หลัง deploy แล้ว
ยังไม่ได้ทดสอบเหตุการณ์มอบคูปองระหว่างผู้ใช้จริงบน production เพื่อหลีกเลี่ยงการเปลี่ยนข้อมูลของผู้ใช้
