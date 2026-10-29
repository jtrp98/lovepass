# Setup & Deployment

รายละเอียดวิธีรัน local และ deploy ทั้งหมด (ย้ายมาจาก README) — ภาพรวม requirements/architecture ดูที่ [lovepass.md](lovepass.md)

## เริ่มต้นการพัฒนา

### 0) เติมค่า env (ทำครั้งเดียว)

```bash
cp .env.example .env                          # root — ใช้กับ docker-compose
cp backend/.env.example backend/.env          # API — connection string, JWT, Resend
cp frontend/.env.example frontend/.env.local  # URL ของ API
```

แล้วเติมค่าจริงใน `.env` แต่ละไฟล์ (รหัสผ่าน DB, Jwt:SigningKey, Resend API key ฯลฯ)

### 1) ฐานข้อมูล

```bash
docker compose up -d          # PostgreSQL ที่ localhost:5432
```

### 2) Backend — https://localhost:5080 (Swagger: /swagger)

```bash
cd backend
dotnet ef database update --project src/LovePass.Infrastructure --startup-project src/LovePass.WebApi
dotnet run --project src/LovePass.WebApi
```

> รันครั้งแรกจะ seed บัญชี Admin และ Coupon Templates ตัวอย่างตามค่า `Seed:*` ใน `backend/.env`

### 3) Frontend — http://localhost:3000

```bash
cd frontend
npm install
npm run dev
```

## Tests

### คู่รักตัวอย่างสำหรับดู UI

เปิด API และ frontend ตามขั้นตอนด้านบน แล้วรันจากโฟลเดอร์ root (PowerShell):

```powershell
$env:DEMO_PASSWORD = '<ตั้งรหัสผ่านตัวอย่างอย่างน้อย 8 ตัว มีตัวเลขและตัวพิมพ์เล็ก>'
node scripts/seed-demo.mjs
```

สคริปต์สร้าง **มิ้นท์** (`mint@demo.lovepass.test`) และ **ภูมิ** (`phum@demo.lovepass.test`)
จับคู่และมอบคูปองให้กัน มีคูปองทุกประเภทในคลัง คูปองใกล้หมดอายุ และคำขอรอยืนยัน
เข้าบัญชีใดก็ได้ด้วยรหัสผ่านที่ตั้งไว้ แล้วเปิด `http://localhost:3000/my-coupons`
รันซ้ำด้วยรหัสเดิมได้โดยไม่สร้างบัญชีหรือของขวัญที่ยังไม่หมดอายุซ้ำ
สคริปต์รับเฉพาะ API บน localhost และเพิ่มข้อมูลในฐานข้อมูลที่ API นั้นเชื่อมต่ออยู่

```bash
cd backend && dotnet test        # unit tests (domain logic)
node scripts/api-smoke.mjs       # E2E ผ่าน API จริง (API ต้องรันอยู่ + DB พร้อม)
```

## Deployment (Vercel + Render + Supabase)

### 1) Supabase — Database

1. สร้าง project ที่ [supabase.com](https://supabase.com)
2. **Project Settings → Database → Connection string → Session pooler** (port 5432)
   - ใช้ pooler อันนี้ ไม่ใช่ direct (`db.<ref>.supabase.co`) เพราะ direct เป็น IPv6-only ซึ่ง Render ใช้ไม่ได้
3. ประกอบ connection string สำหรับ API (keyword format):

   ```
   Host=aws-XX-<region>.pooler.supabase.com;Port=5432;Database=postgres;Username=postgres.<project-ref>;Password=<db-password>;SSL Mode=Require
   ```

4. ไม่ต้องสร้างตารางเอง — API รัน migration อัตโนมัติตอน startup และ seed บัญชี Admin + คูปองตัวอย่าง (ตั้งค่าใน `Seed:*`)

### 2) Render — Backend API

1. สร้าง **Postgres ไม่ต้อง** (ใช้ Supabase) → New + → **Blueprint** → เลือก repo นี้ → ใช้ `render.yaml` ที่เตรียมไว้ (Docker, health check `/health`)
2. กรอกค่าที่ขอตอนสร้าง (secret — ห้ามใส่ในไฟล์):
   - `ConnectionStrings__DefaultConnection` — จากขั้นตอน Supabase
   - `App__FrontendUrl` และ `Cors__AllowedOrigins` — ชั่วคราวใส่ Vercel URL คาดเดาไว้ได้ (เช่น `https://lovepass.vercel.app`)
   - `Resend__ApiKey` — ไม่ใส่ก็ได้ ระบบจะข้ามการส่งอีเมลและ log แทน
   - `Seed__AdminEmail` / `Seed__AdminPassword` — บัญชี Admin เริ่มต้น
   - `Jwt__SigningKey` ให้ Render สุ่มให้ (generateValue) — หรือใส่ random 64+ ตัวอักษรเอง
3. Deploy เสร็จจะได้ URL เช่น `https://lovepass-api.onrender.com` → ทดสอบ `GET /health`

### 3) Vercel — Frontend

1. Import repo บน Vercel → **Root Directory: `frontend`** (Next.js จะถูกตรวจพบอัตโนมัติ)
2. Environment Variables:
   - `NEXT_PUBLIC_API_BASE_URL` = `https://<render-service>.onrender.com`
3. Deploy แล้วเอา URL จริงกลับไปอัพเดต `App__FrontendUrl` + `Cors__AllowedOrigins` บน Render (Environment → Save → Auto Deploy)

> หมายเหตุ: Render free tier จะ sleep เมื่อไม่มี traffic ~15 นาที — request แรกหลังตื่นช้าราว 30–60 วินาที ถ้าไม่อยากเจอ ใช้ Starter plan

## สมัคร/เข้าสู่ระบบด้วย Google (ทำหรือไม่ก็ได้)

1. [Google Cloud Console](https://console.cloud.google.com/) → สร้าง project (หรือใช้ของเดิม)
2. **APIs & Services → OAuth consent screen** → External → กรอกชื่อแอป ใส่อีเมลตัวเอง → บันทึก (test users ใส่อีเมลที่จะใช้ทดสอบ)
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID** → Web application
   - **Authorized JavaScript origins**: `http://localhost:3000` และ production URL ของ Vercel เช่น `https://lovepass.vercel.app`
   - ไม่ต้องใส่ redirect URIs (เราใช้ Google Identity Services ฝั่ง browser)
4. คัดลอก **Client ID** (ลงท้าย `.apps.googleusercontent.com`) ไปใส่ 2 ที่:
   - `backend/.env` → `Authentication__Google__ClientId=...`
   - `frontend/.env.local` → `NEXT_PUBLIC_GOOGLE_CLIENT_ID=...`
5. Restart backend + frontend — หน้า Login/Register จะมีปุ่ม "ดำเนินการต่อด้วย Google"

**กลไก**: เบราว์เซอร์ได้ Google ID token มา → ส่งให้ `POST /api/v1/auth/google` → backend ตรวจ token กับ JWKS ของ Google (บังคับ audience + อายุ token + email_verified) → สร้าง/ลิงก์บัญชีอัตโนมัติ → ออก JWT ของระบบเหมือน login ปกติ ถ้าไม่ตั้งค่า Client ID ปุ่มจะไม่แสดงและ endpoint ตอบ 409

## หมายเหตุความปลอดภัย (ยกระดับก่อน production)

- MVP เก็บ refresh token ฝั่ง client (localStorage) — ก่อน production ควรย้ายเป็น httpOnly cookie
- ตั้ง `Jwt:SigningKey` เป็น random string ยาว 64+ ตัวอักษร และหมุนเป็นระยะ
