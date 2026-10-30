# ส่งการแจ้งเตือนด้วย Gmail ของคุณ

Gmail API ใช้ที่อยู่ Gmail เป็นผู้ส่งได้โดยไม่ต้องซื้อโดเมน และส่งผ่าน HTTPS จึงใช้กับ Render Free ได้
ทุกจุดที่ใช้ `IEmailSender` จะเปลี่ยนพร้อมกัน: รับของขวัญ ขอใช้คูปอง อนุมัติ/ปฏิเสธ และรีเซ็ตรหัสผ่าน
ผู้รับไม่ต้องสมัคร Google Cloud หรืออนุญาตแอป ผู้ที่ต้องอนุญาตคือเจ้าของบัญชีผู้ส่งเพียงคนเดียว

## 1. เตรียม Google ครั้งแรก

1. เปิด [Google Cloud Console](https://console.cloud.google.com/) ด้วย Gmail ที่จะใช้ส่ง
   เลือกโปรเจกต์เดิมของ LOVE PASS หรือสร้างโปรเจกต์ใหม่
2. เปิด [Gmail API](https://console.cloud.google.com/apis/library/gmail.googleapis.com) ในโปรเจกต์นั้น แล้วกด **Enable**
3. เปิด **Google Auth Platform → Branding** หากยังไม่ได้ตั้งค่า ให้กด **Get started**
   ตั้งชื่อ `LOVE PASS` และใช้อีเมลของคุณเป็น User support email / Contact email
   เลือก Audience เป็น **External** สำหรับ Gmail ส่วนตัว
4. ใน **Audience → Test users → Add users** ใส่ Gmail ของผู้ส่ง
5. ใน **Data Access → Add or remove scopes** เพิ่มสิทธิ์
   `https://www.googleapis.com/auth/gmail.send` เท่านั้น แล้วบันทึก
6. ใน **Clients → Create client → Application type** เลือก **Desktop app**
   ตั้งชื่อ `LOVE PASS Mail Setup` แล้วสร้างและ **Download JSON** เก็บใน Downloads
   ไฟล์นี้มีข้อมูลลับ อย่าแปะในแชตหรือใส่ใน Git

ใช้ Desktop client แยกจาก Web client ของปุ่ม Google Sign-In ที่หน้าเข้าสู่ระบบ
การเชื่อมบัญชีครั้งแรกทำบนเครื่องคุณ ส่วน backend ที่ deploy จะใช้ refresh token ที่ได้

## 2. เชื่อมบัญชี

เปิด terminal ที่โฟลเดอร์ root ของโปรเจกต์ แล้วรันโดยเปลี่ยนพาธและ Gmail ให้ตรงกับคุณ:

```powershell
node scripts/setup-gmail.mjs "C:\Users\your-name\Downloads\client_secret_xxx.json" sender@gmail.com
```

สคริปต์จะแสดงลิงก์ เปิดลิงก์นั้นในเบราว์เซอร์เครื่องเดียวกัน
เลือก **บัญชีเดียวกับอีเมลผู้ส่งที่ระบุ** แล้วอนุญาตให้ส่งเมล
สคริปต์ขอเฉพาะ `gmail.send` และไม่ขออ่านกล่องจดหมาย
หาก Google แสดงว่าแอปยังไม่ผ่านการยืนยัน ให้ตรวจว่าเป็น OAuth client ที่คุณสร้างเองในข้อ 1
แอปที่ใช้ส่วนตัวอาจอยู่ภายใต้ข้อยกเว้นการตรวจสอบของ Google ตามลิงก์อ้างอิงท้ายเอกสาร

รอ terminal แสดง **Gmail connected** สคริปต์จะบันทึกลง `backend/.env` ให้อัตโนมัติ:

```dotenv
Email__Provider=Gmail
Gmail__SenderEmail=sender@gmail.com
Gmail__ClientId=...
Gmail__ClientSecret=...
Gmail__RefreshToken=...
```

จากนั้น **restart backend** เพื่อโหลดค่าใหม่ ชื่อผู้ส่งคือ `LOVE PASS <sender@gmail.com>`
สคริปต์ไม่แสดง token บนหน้าจอ ไม่ส่งเมล และคงค่าอื่นใน `.env` รวมถึง Resend เดิมไว้
สคริปต์เปิดตัวรับผลลัพธ์ชั่วคราวเฉพาะ `127.0.0.1` พร้อมตรวจ state และ PKCE และปิดเมื่อเสร็จหรือครบ 5 นาที
ถ้าการอนุญาตไม่สำเร็จจะไม่เปลี่ยน `.env` และยังไม่สลับผู้ให้บริการ

## 3. ใช้ต่อเนื่องและ deploy

**Google ที่มี Publishing status = Testing จะออก refresh token อายุ 7 วันสำหรับสิทธิ์นี้**
หากปล่อยไว้แบบ Testing จะต้องรันสคริปต์เชื่อมใหม่เมื่อ token หมดอายุ
เมื่อต้องการใช้ต่อเนื่อง ให้ดู **Google Auth Platform → Audience → Publish app / In production**
แล้วรันสคริปต์เชื่อมใหม่เพื่อรับ token หลังเปลี่ยนสถานะ
แอปที่ใช้ส่วนตัวกับคนรู้จักอาจได้รับข้อยกเว้นการตรวจสอบ แต่ยังอาจมีหน้าคำเตือนและข้อจำกัดจำนวนบัญชี
หากเปิดให้คนทั่วไปเชื่อม Gmail ของตัวเอง ต้องทำตามข้อกำหนดการตรวจสอบของ Google เพิ่มเติม
token ยังอาจถูกเพิกถอน เช่น เมื่อเจ้าของถอนสิทธิ์หรือเปลี่ยนรหัสผ่านบัญชีที่ให้สิทธิ์ Gmail

สำหรับ Render ให้คัดลอกค่าจริงทั้ง 5 ตัวด้านบนไปที่ **Environment** ของ backend แล้ว Save / Redeploy
`.env` ในเครื่องไม่ได้อัปโหลดขึ้น Render โดยอัตโนมัติ อย่าใส่ค่าเหล่านี้ใน `NEXT_PUBLIC_*` หรือ frontend
Blueprint เลือก Gmail สำหรับ production ต้องเติม `Gmail__*` ให้ครบก่อน deploy
หากใช้ Blueprint sync ในภายหลัง ให้ตั้งค่า provider ใน `render.yaml` ให้ตรงกับที่ใช้จริงด้วย

ทดสอบผ่านการมอบคูปองให้คู่ของคุณ หรือขอรีเซ็ตรหัสผ่านของบัญชีตัวเองที่ลงทะเบียนแล้ว
ตรวจ Inbox/Spam ของผู้รับ และ Sent ใน Gmail ของผู้ส่ง
backend จะ log `Gmail accepted notification email` พร้อม message ID เมื่อ Google รับคำขอ
log นี้ยังไม่ยืนยันว่าเมลเข้ากล่อง Inbox แล้ว
หากพบ `Gmail authorization failed` ให้เชื่อมใหม่และตรวจวันหมดอายุ/การถอนสิทธิ์
Gmail ยังมีข้อจำกัดการส่งของบัญชี จึงเหมาะกับการแจ้งเตือนปริมาณน้อย

การคืนค่าเป็น Resend ทำได้ด้วย `Email__Provider=Resend` แล้ว restart
เมื่อเลือก Gmail แต่ค่าจำเป็นไม่ครบ backend จะไม่เริ่มทำงาน เพื่อให้เห็นการตั้งค่าผิดทันที
หากไม่ได้ตั้ง `Email__Provider` จะใช้ Resend ตามเดิม

## ตรวจสอบโค้ด

```powershell
dotnet test backend/LovePass.slnx
node --test scripts/setup-gmail.test.mjs
```

ชุดทดสอบจำลอง HTTP ของ Google และทดสอบ loopback callback จริงในเครื่อง ไม่มีการส่งเมลจริง
ครอบคลุมเมลภาษาไทย, refresh token ถูกเพิกถอน, ส่งไม่ผ่าน, header injection,
การเลือก provider, OAuth state/PKCE, การปฏิเสธสิทธิ์ และการเก็บค่าอื่นใน `.env`

## อ้างอิง

- [Google: Desktop OAuth และ loopback callback](https://developers.google.com/identity/protocols/oauth2/native-app)
- [Google: ส่งเมลผ่าน Gmail API](https://developers.google.com/workspace/gmail/api/guides/sending)
- [Google: สิทธิ์ gmail.send](https://developers.google.com/workspace/gmail/api/auth/scopes)
- [Google: อายุ refresh token รวมถึง Testing 7 วัน](https://developers.google.com/identity/protocols/oauth2#expiration)
- [Google: ข้อยกเว้นการตรวจสอบสำหรับการใช้ส่วนตัว](https://developers.google.com/identity/protocols/oauth2/production-readiness/sensitive-scope-verification#exceptions-verification-requirements)
- [Render Free: บล็อก SMTP ports](https://render.com/docs/free#other-limitations)
