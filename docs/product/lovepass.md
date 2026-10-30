# LOVE PASS — Project Requirements & Technical Design

ระบบคูปองของขวัญสำหรับคู่รัก (Couple Coupon Platform)

---

## สารบัญ

1. [ภาพรวมโปรเจกต์](#1-ภาพรวมโปรเจกต์)
2. [บทบาทผู้ใช้งาน](#2-บทบาทผู้ใช้งาน)
3. [ระบบ Rarity](#3-ระบบ-rarity)
4. [Coupon Catalog](#4-coupon-catalog)
5. [Coupon Set](#5-coupon-set)
6. [การมอบคูปอง (Gift Flow)](#6-การมอบคูปอง-gift-flow)
7. [ระบบวันหมดอายุ (Expiration)](#7-ระบบวันหมดอายุ-expiration)
8. [ระบบใช้คูปอง (Redemption Flow)](#8-ระบบใช้คูปอง-redemption-flow)
9. [Email Notification](#9-email-notification)
10. [User Pages](#10-user-pages)
11. [Admin Pages](#11-admin-pages)
12. [Database Design](#12-database-design)
13. [Technology Stack](#13-technology-stack)
14. [System Architecture และโครงสร้าง Repository](#14-system-architecture-และโครงสร้าง-repository)
15. [Backend — .NET Clean Architecture](#15-backend--net-clean-architecture)
16. [Frontend — Next.js](#16-frontend--nextjs)
17. [API Design](#17-api-design)
18. [Environment และ Configuration](#18-environment-และ-configuration)
19. [UI / UX Design](#19-ui--ux-design)
20. [Testing และการพัฒนาในเครื่อง](#20-testing-และการพัฒนาในเครื่อง)
21. [MVP Scope](#21-mvp-scope)
22. [หลักการสำคัญของระบบ](#22-หลักการสำคัญของระบบ)

---

## 1. ภาพรวมโปรเจกต์

LOVE PASS เป็นเว็บไซต์สำหรับให้คู่รักมอบคูปองสิทธิพิเศษแก่กัน โดยผู้ใช้สามารถเลือกคูปองจากคลังกลาง กำหนดจำนวน วันหมดอายุ และมอบให้แฟนได้

ผู้รับสามารถเก็บคูปองไว้ในบัญชี และกดขอใช้สิทธิ์ได้ เมื่อมีการขอใช้ ระบบจะส่งอีเมลแจ้งผู้มอบเพื่อยืนยัน

เว็บไซต์เน้นความเรียบง่าย ใช้งานสะดวกบนมือถือ มีระบบ Login และ Database สำหรับเก็บข้อมูลทั้งหมด

---

## 2. บทบาทผู้ใช้งาน

### Admin

- สร้าง แก้ไข และปิดใช้งาน Coupon Template
- กำหนดชื่อ รายละเอียด เงื่อนไข และ Rarity ของคูปอง
- สร้างและจัดการ Coupon Set
- กำหนดว่าภายใน Set มีคูปองชนิดใด จำนวนเท่าไร
- ดูภาพรวมจำนวนผู้ใช้ คู่รัก คูปองที่มอบ คูปองที่ใช้ และคูปองที่หมดอายุ
- จัดการผู้ใช้และข้อมูลระบบตามความจำเป็น
- ไม่จำเป็นต้องเป็นคนแจกคูปองให้แต่ละคู่

### User

- สมัครสมาชิกและ Login
- เชื่อมบัญชีกับแฟนผ่าน Couple Invitation
- เลือกคูปองจาก Catalog กลาง
- เลือกจำนวนคูปองที่ต้องการมอบ
- กำหนดวันหมดอายุเอง
- มอบคูปองให้แฟน
- เลือก Coupon Set สำเร็จรูป
- จัด Custom Set ด้วยตัวเอง
- ดูคูปองที่ได้รับและคูปองที่เคยมอบ
- ขอใช้คูปองที่ได้รับ
- ยืนยันหรือปฏิเสธคำขอใช้คูปองจากแฟน
- ดูประวัติการใช้คูปอง

User A และ User B มีสิทธิ์เท่ากัน สามารถเป็นทั้งผู้ให้และผู้รับได้

---

## 3. ระบบ Rarity

ไม่มีระบบหมวดหมู่ แบ่งคูปองตามความหายาก 4 ระดับเท่านั้น

| Rarity | สี |
| --- | --- |
| `COMMON` | เทา (Grey) |
| `RARE` | ฟ้า (Blue) |
| `EPIC` | ม่วง (Purple) |
| `LEGENDARY` | ทอง (Gold) |

- Admin เป็นผู้กำหนด Rarity ของ Coupon Template
- Rarity มีผลต่อรูปลักษณ์ของคูปอง เช่น สีขอบ สีพื้นหลัง และเอฟเฟกต์พิเศษ แต่ไม่จำเป็นต้องสัมพันธ์กับมูลค่าของคูปอง

---

## 4. Coupon Catalog

Admin สร้าง Coupon Template ไว้ในระบบกลาง

ข้อมูล Coupon Template:

- ชื่อคูปอง
- คำอธิบาย
- เงื่อนไขการใช้งาน
- Rarity
- รูปภาพหรือ Emoji
- สถานะ Active / Inactive

ตัวอย่างคูปอง:

- ตั๋วอัญเชิญ
- ตั๋วกอดไม่อั้น
- ตั๋วตามใจ 1 วัน
- ตั๋วมื้อนี้ฉันเลี้ยง
- ตั๋วอะไรก็ได้ไม่เกิน 10,000 บาท
- ตั๋วทริปพิเศษ
- ตั๋วขอพร 1 ข้อ

Coupon Template เป็นเพียงต้นแบบ ยังไม่ใช่คูปองที่ผู้ใช้ถือครองจริง

---

## 5. Coupon Set

Admin สามารถสร้าง Set สำเร็จรูปเพื่อให้ผู้ใช้มอบคูปองหลายใบพร้อมกันได้

ตัวอย่าง Romantic Set:

- ตั๋วกอด ×5
- ตั๋วมื้อพิเศษ ×3
- ตั๋วอัญเชิญ ×2
- ตั๋วตามใจ ×1

รวม 11 ใบ

รองรับการมอบคูปอง 3 รูปแบบ:

1. **Single Coupon** — เลือกคูปองชนิดเดียว
2. **Predefined Set** — เลือก Set ที่ Admin จัดไว้
3. **Custom Set** — User เลือกคูปองหลายชนิดและจำนวนเอง

เมื่อมอบ Set แล้ว คูปองแต่ละชนิดสามารถใช้แยกกันได้

การแก้ไข Template หรือ Set ภายหลังต้องไม่เปลี่ยนสิทธิ์ของคูปองที่มอบไปแล้ว (ใช้กลไก `template_snapshot`)

---

## 6. การมอบคูปอง (Gift Flow)

1. User A Login
2. เลือก Coupon หรือ Coupon Set
3. กำหนดจำนวนที่ต้องการมอบ
4. กำหนดวันหมดอายุ
5. ตรวจสอบรายละเอียด
6. กดยืนยันมอบให้ User B
7. ระบบบันทึกลง Database (ภายใน Transaction เดียว)
8. คูปองปรากฏในคลังของ User B
9. ระบบส่ง Email แจ้ง User B

ผู้ใช้เป็นคนกำหนดจำนวนและวันหมดอายุ ไม่ใช่ Admin

คูปองชนิดเดียวกันสามารถมีวันหมดอายุต่างกันได้ หากมอบคนละครั้ง (แต่ละครั้งการมอบสร้าง `gift_batch` และ `issued_coupon` ของตัวเอง)

---

## 7. ระบบวันหมดอายุ (Expiration)

- ผู้มอบกำหนดวันหมดอายุเอง
- วันหมดอายุต้องอยู่ในอนาคต
- คูปองที่หมดอายุแล้วไม่สามารถสร้างคำขอใช้ใหม่ได้
- แสดงวันหมดอายุบนคูปอง
- แสดงจำนวนวันที่เหลือก่อนหมดอายุ
- แจ้งเตือนในเว็บไซต์เมื่อใกล้หมดอายุ
- คูปองที่หมดอายุยังคงดูได้ในประวัติ
- เมื่อมีคูปองชนิดเดียวกันหลายชุด ระบบเลือกใช้สิทธิ์ที่หมดอายุเร็วที่สุดก่อน (FEFO — First Expired, First Out)
- คำขอที่ส่งก่อนหมดอายุสามารถคงสิทธิ์ไว้ระหว่างรอยืนยันตามกติกาของระบบ
- ใช้ Background Job หรือการตรวจสถานะตอน Query เพื่อเปลี่ยนสถานะคูปองหมดอายุ (ไม่ต้องรัน job ก็ได้ ให้คำนวณจาก `ExpiresAt` เป็นหลัก)

---

## 8. ระบบใช้คูปอง (Redemption Flow)

1. User B Login
2. เปิด My Coupons
3. เลือกคูปองที่ได้รับจาก User A
4. กด Request Redemption
5. สามารถใส่ข้อความประกอบคำขอได้
6. ระบบกันสิทธิ์คูปอง 1 ใบไว้ชั่วคราว (ภายใน Transaction พร้อม Row Lock)
7. ส่ง Email Notification ไปหา User A
8. User A เปิดลิงก์เพื่อดูคำขอ
9. User A ยืนยันหรือปฏิเสธคำขอ
10. เมื่อยืนยัน ระบบหักสิทธิ์ 1 ใบและบันทึกประวัติ
11. หากปฏิเสธ ระบบคืนสิทธิ์ที่กันไว้

สถานะคำขอ (Redemption Status):

| สถานะ | ความหมาย |
| --- | --- |
| `PENDING` | รอผู้มอบพิจารณา (สิทธิ์ถูกกันไว้ 1 ใบ) |
| `APPROVED` | อนุมัติ หักสิทธิ์ถาวร 1 ใบ |
| `REJECTED` | ปฏิเสธ คืนสิทธิ์ที่กันไว้ |
| `CANCELLED` | ผู้ขอยกเลิกเอง คืนสิทธิ์ที่กันไว้ |

ต้องป้องกันการกดใช้คูปองซ้ำเกินจำนวนที่มี (ใช้ Database Transaction + Optimistic/Row Concurrency)

---

## 9. Email Notification

ใช้บริการ **Resend** ส่งอีเมลผ่าน HTTP API

เหตุการณ์หลัก:

- เมื่อได้รับคูปองใหม่
- เมื่อแฟนขอใช้คูปอง
- เมื่อคำขอได้รับการยืนยัน
- เมื่อคำขอถูกปฏิเสธ

อีเมลควรแสดง:

- ชื่อผู้ส่งคำขอ
- ชื่อคูปอง
- Rarity
- ข้อความจากแฟน
- ลิงก์เปิดรายละเอียดคำขอ

การอนุมัติต้องตรวจสอบสิทธิ์ของผู้ใช้งานก่อน (ลิงก์ในอีเมลพาไปหน้าเว็บที่ต้อง Login เท่านั้น) ไม่อนุมัติเพียงเพราะมีผู้เปิดลิงก์อีเมล

การส่งอีเมลต้องไม่บล็อก main request นานเกินไป — ส่งแบบ Fire-and-forget / Background Queue ใน v1 และพร้อมยกระดับเป็น Background Job เมื่อระบบโต

---

## 10. User Pages

### Authentication

- Register
- Login
- Logout
- Forgot Password

### Couple

- สร้างคำเชิญจับคู่
- ยอมรับคำเชิญ
- แสดงข้อมูลคู่รัก

### Home / Dashboard

- จำนวนคูปองที่ได้รับ
- จำนวนคูปองที่ใช้แล้ว
- คูปองใกล้หมดอายุ
- คำขอใช้คูปองที่รอดำเนินการ

### Coupon Catalog

- แสดงคูปองกลางทั้งหมด
- กรองตาม Rarity
- ดูรายละเอียดคูปอง
- เลือกคูปองเพื่อมอบให้แฟน

### Coupon Sets

- ดู Set สำเร็จรูป
- ดูคูปองภายใน Set
- เลือก Set เพื่อมอบให้แฟน

### Create Gift

- เลือกคูปองหรือจัด Custom Set
- กำหนดจำนวน
- กำหนดวันหมดอายุ
- ยืนยันการมอบ

### My Coupons

- ดูคูปองที่ได้รับ
- จำนวนคงเหลือของแต่ละชนิด
- วันหมดอายุ
- ปุ่ม Request Redemption
- กรองตาม Rarity

### Sent Gifts

- ดูคูปองที่เคยมอบให้แฟน
- ดูจำนวนและวันหมดอายุ

### Requests

- คำขอที่ส่ง
- คำขอที่ได้รับ
- อนุมัติหรือปฏิเสธคำขอ

### History

- ประวัติการใช้คูปอง
- ประวัติการมอบคูปอง
- คูปองหมดอายุ

---

## 11. Admin Pages

### Dashboard

- จำนวนผู้ใช้งาน
- จำนวนคู่รัก
- จำนวน Coupon Templates
- จำนวน Coupon Sets
- จำนวนคูปองที่ถูกมอบ
- จำนวนคูปองที่ถูกใช้
- จำนวนคูปองที่หมดอายุ

### Coupon Management

- Create / Edit / Disable Coupon
- จัดการ Rarity
- จัดการรายละเอียดและเงื่อนไข

### Coupon Set Management

- Create / Edit / Disable Set
- เพิ่มคูปองเข้า Set
- กำหนดจำนวนของแต่ละชนิด

### User Management

- ดูข้อมูลบัญชี
- ดูสถานะผู้ใช้
- จัดการบัญชีตามสิทธิ์ Admin

### System Overview

- ดูรายการการมอบคูปอง
- ดูรายการ Redemption
- ตรวจสอบปัญหาและประวัติการทำรายการ

---

## 12. Database Design

RDBMS: **PostgreSQL** เข้าถึงผ่าน **EF Core** (Provider: Npgsql) — ทุกการเปลี่ยนแปลง schema ทำผ่าน **EF Core Migrations**

ตารางหลัก — ตั้งชื่อตารางและคอลัมน์ด้วย **PascalCase ตรงกับ C# Entity 1:1** (ไม่ต้องติดตั้ง naming-convention plugin) และ **Primary Key เป็น `int4` (integer identity auto-increment)** ทุกตาราง — FK จึงเป็น int4 เช่นกัน ส่วน InviteToken ยังเป็น string สุ่มสำหรับแชร์ลิงก์

### Users → ใช้ตารางของ ASP.NET Core Identity (`AspNetUsers`)

สร้าง class `ApplicationUser : IdentityUser<int>` เพิ่มฟิลด์แอปพลิเคชัน:

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| Id | int4 | PK (identity) |
| Email | text | จัดการโดย Identity |
| DisplayName | text | |
| Role | text | `Admin` / `User` (ASP.NET Core Role) |
| CreatedAt | timestamptz | |
| UpdatedAt | timestamptz | วันที่แก้ไขล่าสุด / วันที่ soft delete |
| IsDeleted | boolean | soft delete — ซ่อนจากทุก query (query filter) ล็อกอินไม่ได้ |

### Couples

| Column | Type |
| --- | --- |
| Id | int4 PK |
| CreatedAt | timestamptz |
| Status | text (`Active` / `Dissolved`) |

### CoupleMembers

| Column | Type |
| --- | --- |
| Id | int4 PK |
| CoupleId | int4 FK → Couples |
| UserId | int4 FK → Users |

เงื่อนไข: user หนึ่งคนอยู่ใน couple เดียวที่ status = Active (Unique partial index)

### CouponTemplates

| Column | Type |
| --- | --- |
| Id | int4 PK |
| Name | text |
| Description | text |
| Terms | text |
| Rarity | text (`COMMON`/`RARE`/`EPIC`/`LEGENDARY`) |
| ImageUrl | text (nullable) |
| Emoji | text (nullable) |
| IsActive | boolean |
| CreatedAt / UpdatedAt | timestamptz |
| IsDeleted | boolean | soft delete — ซ่อนจากทุก query คูปองที่มอบไปแล้วไม่กระทบ (ใช้ snapshot) |

### CouponSets

| Column | Type |
| --- | --- |
| Id | int4 PK |
| Name | text |
| Description | text |
| IsActive | boolean |
| CreatedAt / UpdatedAt | timestamptz |
| IsDeleted | boolean | soft delete — ซ่อนจากทุก query |

### CouponSetItems

| Column | Type |
| --- | --- |
| Id | int4 PK |
| SetId | int4 FK → CouponSets |
| CouponTemplateId | int4 FK → CouponTemplates |
| Quantity | int4 |

### GiftBatches

| Column | Type |
| --- | --- |
| Id | int4 PK |
| SenderId | int4 FK → Users |
| ReceiverId | int4 FK → Users |
| CoupleId | int4 FK → Couples |
| Message | text (nullable) |
| CreatedAt | timestamptz |

### IssuedCoupons

| Column | Type | หมายเหตุ |
| --- | --- | --- |
| Id | int4 PK | |
| GiftBatchId | int4 FK → GiftBatches | |
| CouponTemplateId | int4 FK → CouponTemplates | ไว้อ้างอิงย้อนกลับ |
| SenderId / ReceiverId | int4 FK → Users | denormalize เพื่อ query ง่าย |
| Quantity | int4 | จำนวนที่มอบ |
| RemainingQuantity | int4 | เหลือกี่ใบ (รวมใบที่ถูกกันสิทธิ์) |
| ReservedQuantity | int4 | จำนวนที่ถูกกันไว้ระหว่าง PENDING |
| ExpiresAt | timestamptz | |
| TemplateSnapshot | jsonb | เก็บชื่อ/เงื่อนไข/Rarity ณ วันมอบ |
| Status | text | `Active` / `FullyRedeemed` / `Expired` |
| CreatedAt | timestamptz | |
| RowVersion | int4 | Optimistic concurrency (xmin) |

### Redemptions

| Column | Type |
| --- | --- |
| Id | int4 PK |
| IssuedCouponId | int4 FK → IssuedCoupons |
| RequesterId | int4 FK → Users |
| ApproverId | int4 FK → Users (nullable) |
| Message | text (nullable) |
| Status | text (`PENDING`/`APPROVED`/`REJECTED`/`CANCELLED`) |
| RequestedAt | timestamptz |
| ResolvedAt | timestamptz (nullable) |

### CoupleInvitations

| Column | Type |
| --- | --- |
| Id | int4 PK |
| InviterId | int4 FK → Users |
| InviteToken | text unique (สุ่ม string สำหรับแชร์ลิงก์) |
| ExpiresAt | timestamptz |
| Status | text (`PENDING`/`ACCEPTED`/`EXPIRED`) |

### หลักการด้านข้อมูล

- ทุกตารางใช้ PK `int4` auto-increment (PostgreSQL identity) — ตรงกับ `int` ใน C# และ `IdentityUser<int>`
- **Soft delete** เฉพาะ Users / CouponTemplates / CouponSets (`IsDeleted` + ปักเวลาที่ `UpdatedAt` ไม่มี DeletedAt) — ซ่อนจากทุก query ด้วย EF global query filter; IssuedCoupons / Redemptions / GiftBatches เป็นประวัติธุรกรรมจึงไม่มีการลบ
- การแจกหลายใบ การกันสิทธิ์ (reserve) และการหักจำนวน ต้องทำภายใน **Database Transaction** เดียว พร้อมตรวจ concurrency (EF Core concurrency token หรือ `SELECT ... FOR UPDATE`)
- การแยกสิทธิ์ข้อมูลระหว่างคู่ ทำที่ **Application Layer** (Clean Architecture use case ตรวจ sender/receiver อยู่ใน couple เดียวกันกับ current user เสมอ) ไม่พึ่ง RLS ของฐานข้อมูล
- ตรวจ `ExpiresAt` ทุกครั้งที่อ่าน/ใช้สิทธิ์ — ไม่ต้องรอ batch job เปลี่ยนสถานะก่อน
- Index พื้นฐาน: `IssuedCoupons(ReceiverId, ExpiresAt)`, `Redemptions(Status, ApproverId)`, `CoupleMembers(UserId)`

---

## 13. Technology Stack

| ด้าน | เทคโนโลยี |
| --- | --- |
| Frontend | **Next.js (App Router) + TypeScript** |
| UI | Tailwind CSS + shadcn/ui, Icons (lucide-react) |
| Data Fetching / State | Server Components + TanStack Query (client), react-hook-form + zod (forms) |
| Backend | **ASP.NET Core Web API (.NET LTS) — Clean Architecture** |
| ORM | EF Core + Npgsql |
| Authentication | ASP.NET Core Identity + JWT Bearer (Access Token + Refresh Token) + Google Sign-In (OAuth — ตรวจ Google ID token กับ JWKS) |
| Authorization | Policy-based (role `Admin`) + การตรวจสิทธิ์ระดับ use case |
| Database | PostgreSQL |
| Email | Resend (HTTP API) |
| API Docs | OpenAPI/Swagger (Swashbuckle) |
| Testing | backend: xUnit + FluentAssertions + WebApplicationFactory + Testcontainers · frontend: Vitest + Testing Library + Playwright (E2E) |
| Hosting | Frontend: **Vercel** · Backend: **Render** (Docker — ดู `render.yaml`) · Database: **Supabase** PostgreSQL (Session pooler + SSL) |
| Local Dev | docker-compose (PostgreSQL), dotnet CLI, Node LTS |

---

## 14. System Architecture และโครงสร้าง Repository

สถาปัตยกรรมรวม: **Frontend แยกจาก Backend โดยสิ้นเชิง คุยกันผ่าน REST API (JSON)**

```
┌─────────────────────┐         HTTPS / JSON          ┌──────────────────────────┐
│  Next.js (Vercel)   │ ────────────────────────────▶ │  ASP.NET Core Web API    │
│  - SSR/RSC pages    │                               │  - Controllers           │
│  - Admin + User UI  │ ◀──────────────────────────── │  - MediatR (CQRS)        │
└─────────────────────┘                               │  - Clean Architecture    │
                                                      └───────────┬──────────────┘
                                                                  │
                                                       ┌──────────▼──────────┐
                                                       │  PostgreSQL         │
                                                       │  (EF Core + Identity)│
                                                       └─────────────────────┘
                                                      ┌──────────▼──────────┐
                                                       │  Resend Email API   │
                                                       └─────────────────────┘
```

โครงสร้าง Repository (Monorepo — แยก frontend/backend ชัดเจน):

```
lovepass/
├── docs/                        # สารบัญที่ docs/README.md
│   └── product/lovepass.md      # เอกสารนี้
├── frontend/                    # Next.js application
├── backend/                     # .NET solution
│   ├── LovePass.sln
│   ├── src/
│   │   ├── LovePass.Domain/
│   │   ├── LovePass.Application/
│   │   ├── LovePass.Infrastructure/
│   │   └── LovePass.WebApi/
│   └── tests/
│       ├── LovePass.Domain.UnitTests/
│       ├── LovePass.Application.UnitTests/
│       └── LovePass.WebApi.IntegrationTests/
├── docker-compose.yml           # PostgreSQL สำหรับ dev
├── .gitignore
└── README.md
```

---

## 15. Backend — .NET Clean Architecture

อิงแนวทาง Clean Architecture ที่นิยมทั่วโลก (Jason Taylor's Clean Architecture Template) — 4 โปรเจกต์  dependencies ชี้เข้าหา Domain เสมอ:

```
WebApi ──▶ Infrastructure ──▶ Application ──▶ Domain
   └─────────────────────────────▶ Application
   └─────────────────────────────▶ Domain (ผ่าน Application)
```

กฎเหล็ด: **Domain ไม่อ้างอิงโปรเจกต์ใดเลย** · Application รู้เรื่อง Domain เท่านั้น · Infrastructure  implement interface ที่ Application ประกาศ · WebApi เป็น composition root เท่านั้น

### โครงสร้างภายในแต่ละโปรเจกต์

```
backend/src/

LovePass.Domain/                        # Enterprise logic ล้วน ไม่มี dependency
├── Entities/
│   ├── ApplicationUser.cs              # : IdentityUser<int> (PK int4 — ไว้ตรงนี้เพื่อให้ทั้ง solution ใช้ร่วม)
│   ├── Couple.cs
│   ├── CoupleMember.cs
│   ├── CoupleInvitation.cs
│   ├── CouponTemplate.cs
│   ├── CouponSet.cs
│   ├── CouponSetItem.cs
│   ├── GiftBatch.cs
│   ├── IssuedCoupon.cs
│   └── Redemption.cs
├── Enums/
│   ├── Rarity.cs
│   ├── RedemptionStatus.cs
│   ├── CoupleStatus.cs
│   ├── InvitationStatus.cs
│   └── IssuedCouponStatus.cs
├── Constants/
├── Events/                             # Domain events (ถ้ามี)
└── Common/
    └── BaseEntity.cs

LovePass.Application/                   # Use cases (CQRS + MediatR)
├── Common/
│   ├── Interfaces/
│   │   ├── IApplicationDbContext.cs    # abstraction ของ EF Core
│   │   ├── ICurrentUserService.cs      # ดึง user id/role จาก claims
│   │   ├── IIdentityService.cs         # register/login/reset password
│   │   └── IEmailSender.cs             # ส่งเมล (Infrastructure implement ด้วย Resend)
│   ├── Behaviors/                      # MediatR pipeline: Validation, Logging, Transaction
│   ├── Exceptions/                     # NotFoundException, ForbiddenAccessException, ...
│   ├── Mappings/                       # mapping entity → DTO
│   └── Models/
│       └── Result.cs                   # Result pattern (optional)
├── Auth/
│   ├── Commands/Register/
│   ├── Commands/Login/
│   └── Commands/ResetPassword/
├── Couples/
│   ├── Commands/CreateInvitation/
│   ├── Commands/AcceptInvitation/
│   └── Queries/GetMyCouple/
├── CouponTemplates/                    # Queries สาธารณะ (catalog)
│   └── Queries/GetTemplates/
├── CouponSets/
│   └── Queries/GetSets/
├── Gifts/
│   ├── Commands/CreateGift/            # single / predefined set / custom set
│   └── Queries/GetSentGifts/
├── Coupons/
│   └── Queries/GetMyCoupons/
├── Redemptions/
│   ├── Commands/RequestRedemption/
│   ├── Commands/ApproveRedemption/
│   ├── Commands/RejectRedemption/
│   ├── Commands/CancelRedemption/
│   └── Queries/GetRedemptions/
├── History/
│   └── Queries/GetHistory/
└── Admin/                              # use cases เฉพาะ role Admin
    ├── CouponTemplates/Commands/...
    ├── CouponSets/Commands/...
    ├── Users/Queries/...
    └── Dashboard/Queries/GetStats/

LovePass.Infrastructure/                # รายละเอียดเทคนิค ถูก swap ได้
├── Data/
│   ├── ApplicationDbContext.cs        # : IdentityDbContext<ApplicationUser>, IApplicationDbContext
│   ├── Configurations/                 # IEntityTypeConfiguration ต่อตาราง
│   ├── Interceptors/                   # Auditing, DispatchDomainEvents
│   └── Migrations/                     # EF Core migrations
├── Identity/
│   ├── IdentityService.cs              # implement IIdentityService
│   └── JwtTokenService.cs              # ออก access/refresh token
├── Email/
│   └── ResendEmailSender.cs            # implement IEmailSender ผ่าน Resend API
├── Services/
│   └── CurrentUserService.cs           # implement ICurrentUserService (อ่าน IHttpContextAccessor)
└── DependencyInjection.cs              # AddInfrastructure(this IServiceCollection, IConfiguration)

LovePass.WebApi/                        # ASP.NET Core Web API (composition root)
├── Controllers/
│   ├── Api/V1/
│   │   ├── AuthController.cs
│   │   ├── CouplesController.cs
│   │   ├── CouponTemplatesController.cs
│   │   ├── CouponSetsController.cs
│   │   ├── GiftsController.cs
│   │   ├── CouponsController.cs
│   │   ├── RedemptionsController.cs
│   │   └── Admin/
│   │       ├── AdminCouponTemplatesController.cs
│   │       ├── AdminCouponSetsController.cs
│   │       ├── AdminUsersController.cs
│   │       └── AdminDashboardController.cs
├── Middleware/                         # Exception handling → ProblemDetails
├── appsettings.json
├── appsettings.Development.json
├── appsettings.Production.json         # เก็บเฉพาะค่า non-secret
├── Program.cs
└── LovePass.WebApi.csproj
```

### แนวทางการเขียนที่ตกลงร่วมกัน (Conventions)

- **CQRS + MediatR**: Controller บางเบา — รับ request → ส่ง `ICommand`/`IQuery` ให้ handler → คืน DTO ไม่เผย Entity ออกไปเด็ดขาด
- **Validation**: FluentValidation ทำ validate ที่ pipeline behavior (`ValidationBehavior`) ตัวเดียวจบ
- **Transaction**: หนึ่ง use case = หนึ่ง transaction (ผ่าน `TransactionBehavior` หรือ explicit `BeginTransaction` ใน handler ที่สำคัญ เช่น CreateGift, RequestRedemption)
- **Error contract**: exception ถูก map เป็น RFC 7807 `ProblemDetails` โดย middleware กลาง เช่น `NotFoundException → 404`, `ForbiddenAccessException → 403`, `ValidationException → 400`
- **ตัวอย่าง request flow (มอบคูปอง)**:
  1. `POST /api/v1/gifts` → `GiftsController`
  2. Controller สร้าง `CreateGiftCommand` → `_mediator.Send(...)`
  3. `CreateGiftCommandHandler`: โหลด couple จาก `ICurrentUserService` → ตรวจ receiver เป็นแฟน → อ่าน template → snapshot รายละเอียด → สร้าง `gift_batch` + `issued_coupons` ใน transaction
  4. เรียก `IEmailSender.SendCouponReceivedAsync(...)` (fire-and-forget)
  5. คืน `GiftDto` (201)

### ตั้งชื่อ / สไตล์โค้ด

- Solution: `LovePass` · Root namespace: `LovePass.*`
- C# conventions: file-scoped namespaces, `var` เมื่อ type ชัด, async method ลงท้าย `Async`
- Format ด้วย `dotnet format` + `.editorconfig` — บังคับผ่าน CI
- Nullable enable ทุกโปรเจกต์

---

## 16. Frontend — Next.js

ใช้ **App Router + TypeScript (strict)** โครงสร้างตามที่ community ถือเป็นมาตรฐาน (feature-friendly, colocated components):

```
frontend/
├── public/
├── src/
│   ├── app/
│   │   ├── (auth)/                     # route group: หน้าไม่ต้อง login
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── forgot-password/page.tsx
│   │   ├── (user)/                     # route group: หน้าหลักผู้ใช้ (มี navbar + auth guard)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── catalog/page.tsx
│   │   │   ├── sets/page.tsx
│   │   │   ├── gifts/
│   │   │   │   └── new/page.tsx
│   │   │   ├── my-coupons/page.tsx
│   │   │   ├── sent-gifts/page.tsx
│   │   │   ├── requests/page.tsx
│   │   │   ├── couple/page.tsx
│   │   │   └── history/page.tsx
│   │   ├── admin/                      # หน้า Admin (route จริง /admin/*, role guard)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── coupons/page.tsx
│   │   │   ├── coupons/[id]/page.tsx
│   │   │   ├── sets/page.tsx
│   │   │   ├── sets/[id]/page.tsx
│   │   │   ├── users/page.tsx
│   │   │   └── overview/page.tsx
│   │   ├── layout.tsx                  # root layout (fonts, providers)
│   │   ├── providers.tsx               # QueryClientProvider, Toast, Theme
│   │   └── page.tsx                    # landing / redirect to dashboard
│   ├── components/
│   │   ├── ui/                         # shadcn/ui primitives (button, card, dialog, ...)
│   │   ├── coupon/                     # CouponCard, RarityBadge, QuantityInput
│   │   ├── gift/                       # GiftForm, SetPicker, ExpiryPicker
│   │   ├── request/                    # RequestCard, RequestActions
│   │   └── layout/                     # Navbar, Sidebar, MobileNav, Footer
│   ├── lib/
│   │   ├── api/
│   │   │   ├── client.ts               # fetch wrapper: base URL, auth, refresh, error
│   │   │   ├── auth.ts                 # /auth endpoints
│   │   │   ├── couples.ts
│   │   │   ├── coupons.ts
│   │   │   ├── gifts.ts
│   │   │   ├── redemptions.ts
│   │   │   └── admin.ts
│   │   ├── auth.ts                     # session helpers, role checks
│   │   └── utils.ts                    # cn(), date helpers (days-left, TH locale)
│   ├── hooks/                          # useMyCoupons, useCreateGift, ...
│   ├── types/                          # API types สอดคล้อง backend DTOs 1:1
│   └── styles/
│       └── globals.css
├── .env.local                          # ค่า local (ไม่ commit)
├── .env.example                        # template ของตัวแปร (commit)
├── next.config.ts
├── tsconfig.json
├── eslint.config.mjs
└── package.json
```

### แนวทางการเขียน

- **Server Components เป็นค่าตั้งต้น** — หน้าที่ต้อง interactive (form, filter) แยกเป็น Client Components (`"use client"`) ให้เล็กที่สุด
- **Data fetching**: หน้า RSC เรียก API ตรงจาก server; interaction ฝั่ง client ใช้ TanStack Query ผ่าน `lib/api/*` (ไม่กระจาย fetch ทั่ว component)
- **Route protection**: middleware.ts ตรวจ session cookie เบื้องต้น + ทุกหน้า admin ตรวจ role ฝั่ง server (และ API ก็ตรวจอีกชั้นเสมอ)
- **Type safety**: DTO types ใน `types/` เป็น source of truth เดียวร่วมกับ backend; ห้าม `any`
- **Naming**: components `PascalCase.tsx`, hooks `use-xxx.ts`, utils `camelCase.ts`
- **Formatting/Lint**: ESLint + Prettier ผ่าน CI เดียวกับ backend

---

## 17. API Design

REST API เวอร์ชันใน path: `/api/v1/...` · JSON camelCase · DateTime เป็น ISO 8601 UTC

### การกำหนดชื่อ

- Resource เป็นคำนามพหูพจน์ (`/coupon-templates`, `/redemptions`)
- Action ที่ไม่ใช่ CRUD ใช้ verb sub-path (`POST /redemptions/{id}/approve`)
- Response เป็น DTO ไม่ leak entity

### Endpoints หลัก

| Method | Path | คำอธิบาย | Auth |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | สมัครสมาชิก | – |
| POST | `/api/v1/auth/login` | เข้าสู่ระบบ (ได้ access + refresh token) | – |
| POST | `/api/v1/auth/google` | สมัคร/เข้าสู่ระบบด้วย Google ID token (OAuth) | – |
| POST | `/api/v1/auth/refresh` | ต่ออายุ token | – |
| POST | `/api/v1/auth/forgot-password` | ขอรีเซ็ตรหัสผ่าน (ส่งอีเมล) | – |
| POST | `/api/v1/couples/invitations` | สร้างคำเชิญจับคู่ | User |
| POST | `/api/v1/couples/invitations/accept` | ยอมรับคำเชิญ | User |
| GET | `/api/v1/couples/me` | ข้อมูลคู่ของฉัน | User |
| GET | `/api/v1/coupon-templates?rarity=` | Catalog (Active เท่านั้น) | User |
| GET | `/api/v1/coupon-templates/{id}` | รายละเอียดคูปอง | User |
| GET | `/api/v1/coupon-sets` | Set สำเร็จรูป | User |
| POST | `/api/v1/gifts` | มอบคูปอง (single / setId / custom items) | User |
| GET | `/api/v1/gifts/sent` | คูปองที่เคยมอบ | User |
| GET | `/api/v1/coupons/my?rarity=` | My Coupons (รวมจำนวนคงเหลือ, วันหมดอายุ) | User |
| POST | `/api/v1/redemptions` | ขอใช้คูปอง (body: issuedCouponId, message) | User |
| GET | `/api/v1/redemptions?direction=sent\|received` | คำขอที่เกี่ยวข้อง | User |
| POST | `/api/v1/redemptions/{id}/approve` | ยืนยันคำขอ (เฉพาะผู้มอบ) | User |
| POST | `/api/v1/redemptions/{id}/reject` | ปฏิเสธคำขอ (เฉพาะผู้มอบ) | User |
| POST | `/api/v1/redemptions/{id}/cancel` | ผู้ขอยกเลิก | User |
| GET | `/api/v1/history` | ประวัติมอบ/ใช้/หมดอายุ | User |
| GET/POST | `/api/v1/admin/coupon-templates` | จัดการ template | Admin |
| GET/PUT/DELETE | `/api/v1/admin/coupon-templates/{id}` | แก้ไข / soft delete | Admin |
| GET/POST | `/api/v1/admin/coupon-sets` | จัดการ set | Admin |
| GET/PUT/DELETE | `/api/v1/admin/coupon-sets/{id}` | แก้ไข / soft delete | Admin |
| GET | `/api/v1/admin/users` | รายการผู้ใช้ | Admin |
| DELETE | `/api/v1/admin/users/{id}` | soft delete user (ยุติคู่ ยกเลิกคำขอค้าง คงประวัติ) | Admin |
| GET | `/api/v1/admin/dashboard/stats` | ตัวเลขภาพรวม | Admin |
| GET | `/api/v1/admin/gifts` | ประวัติการมอบทั้งระบบ | Admin |
| GET | `/api/v1/admin/redemptions` | ประวัติ redemption ทั้งระบบ | Admin |

### ตัวอย่าง: มอบคูปอง

```http
POST /api/v1/gifts
Content-Type: application/json

{
  "receiverId": 42,
  "expiresAt": "2026-12-31T23:59:59Z",
  "message": "สุขสันต์วันครบรอบนะ",
  "items": [
    { "couponTemplateId": 7, "quantity": 5 },
    { "couponTemplateId": 12, "quantity": 2 }
  ],
  "couponSetId": null
}
```

### เอกสารและข้อผิดพลาด

- Swagger UI เปิดใน Development/Staging (`/swagger`)
- Error ใช้ RFC 7807 ProblemDetails เสมอ:

```json
{
  "type": "https://httpstatuses.com/400",
  "title": "One or more validation errors occurred.",
  "status": 400,
  "errors": { "ExpiresAt": ["วันหมดอายุต้องอยู่ในอนาคต"] }
}
```

### Authentication & Authorization

- **JWT Bearer**: Access Token อายุสั้น (นาที) + Refresh Token อายุยาว (วัน)
- FE เก็บ refresh token ใน **httpOnly cookie** และ access token ใน memory — ลดความเสี่ยง XSS
- ทุก endpoint อ่อนไหวต้องผ่าน `[Authorize]` + policy ที่เกี่ยวข้อง (`RequireAdmin`)
- การอนุมัติคำขอตรวจว่า current user เป็นผู้มอบของคูปองนั้นจริง (ไม่ใช่แค่เปิดลิงก์ได้)
- Rate limit ที่ endpoint auth (`/login`, `/register`, `/forgot-password`)

---

## 18. Environment และ Configuration

### หลักการ

- **แยก config ตาม environment**: `ASPNETCORE_ENVIRONMENT` = `Development` | `Staging` | `Production`
- **Secret ห้ามอยู่ใน git**: dev ใช้ `dotnet user-secrets` / `.env.local` · production ใช้ env vars ของ platform
- `appsettings.json` เก็บค่า default · `appsettings.{Environment}.json` override เฉพาะค่า non-secret · env vars override ทุกอย่าง (ใช้ `__` แทน `:` เช่น `ConnectionStrings__DefaultConnection`)
- อ่านค่าแบบ typed ด้วย `IOptions<T>` + `Validate()` ตอน startup — ถ้า config ไม่ครบ แอปต้องพังทันที (fail fast)
- FE: Next.js อ่าน env ตอน build/runtime — ตัวแปรที่ใช้ฝั่ง client ต้องขึ้นต้น `NEXT_PUBLIC_`

### Environment variables

#### Backend (`LovePass.WebApi`)

| Variable | ตัวอย่าง | คำอธิบาย |
| --- | --- | --- |
| `ASPNETCORE_ENVIRONMENT` | `Development` | environment ปัจจุบัน |
| `ConnectionStrings__DefaultConnection` | `Host=localhost;Database=lovepass;...` | PostgreSQL |
| `Jwt__Issuer` | `lovepass-api` | token issuer |
| `Jwt__Audience` | `lovepass-web` | token audience |
| `Jwt__SigningKey` | *(secret 64+ chars)* | คีย์เซ็น JWT |
| `Jwt__AccessTokenTtlMinutes` | `15` | อายุ access token |
| `Jwt__RefreshTokenTtlDays` | `30` | อายุ refresh token |
| `Cors__AllowedOrigins` | `https://lovepass.example` | origin ของ FE (คั่นด้วย `;`) |
| `Resend__ApiKey` | *(secret)* | คีย์ Resend |
| `Resend__FromEmail` | `LovePass <noreply@lovepass.example>` | ผู้ส่งอีเมล |
| `App__FrontendUrl` | `https://lovepass.example` | ใช้สร้างลิงก์ในอีเมล |

#### Frontend (`frontend`)

| Variable | ตัวอย่าง | คำอธิบาย |
| --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `https://api.lovepass.example` | base URL ของ .NET API |
| `NEXT_PUBLIC_APP_URL` | `https://lovepass.example` | URL ของเว็บ (สร้างลิงก์ share) |

### การตั้งค่าเริ่มต้นสำหรับ dev

```bash
# Backend — เก็บ secret ในเครื่อง (ไม่โดน commit)
cd backend/src/LovePass.WebApi
dotnet user-secrets init
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Port=5432;Database=lovepass;Username=postgres;Password=postgres"
dotnet user-secrets set "Jwt:SigningKey" "dev-only-signing-key-min-64-characters-long-xxxxxxxxxxxxxxxx"
dotnet user-secrets set "Resend:ApiKey" "re_xxx"
```

```bash
# Frontend
cd frontend
cp .env.example .env.local   # แล้วแก้ค่าให้ตรงกับ backend
```

`appsettings.json` (ค่า non-secret เท่านั้น):

```json
{
  "Jwt": {
    "Issuer": "lovepass-api",
    "Audience": "lovepass-web",
    "AccessTokenTtlMinutes": 15,
    "RefreshTokenTtlDays": 30
  },
  "App": {
    "FrontendUrl": "http://localhost:3000"
  },
  "Cors": {
    "AllowedOrigins": "http://localhost:3000"
  }
}
```

### Environments จริง

| | Development | Staging | Production |
| --- | --- | --- | --- |
| FE | `localhost:3000` | staging domain (Vercel preview) | Vercel production |
| BE | `localhost:5080` (dotnet run) | Render (staging service) | Render (Docker) |
| DB | docker-compose PostgreSQL / Supabase | Supabase (staging project) | Supabase (session pooler + SSL) |
| Secret | .env / .env.local (gitignored) | platform env vars | Render env vars |
| Swagger | เปิด | เปิด (จำกัดเฉพาะภายใน) | ปิด |

---

## 19. UI / UX Design

### ธีมเว็บไซต์

- เรียบง่าย ทันสมัย
- Mobile First — ออกแบบหน้าจอเล็กก่อนแล้วขยายขึ้น desktop
- ดีไซน์สะอาด ไม่ซับซ้อน
- มีความโรแมนติกเล็กน้อย แต่ไม่หวานจนเกินไป

### Coupon Design

| Rarity | สี |
| --- | --- |
| COMMON | Grey |
| RARE | Blue |
| EPIC | Purple |
| LEGENDARY | Gold |

คูปองแต่ละใบควรแสดง:

- ชื่อ
- Emoji / Icon
- Rarity
- รายละเอียด
- จำนวนคงเหลือ
- วันหมดอายุ (และจำนวนวันที่เหลือ)
- ปุ่มขอใช้สิทธิ์

- หากเป็นคูปองชนิดเดียวกันและวันหมดอายุเดียวกัน สามารถรวมเป็นการ์ดเดียวแล้วแสดงจำนวน ×N ได้ (จัดกลุ่มจาก `issued_coupon` แต่ละ record)
- หากวันหมดอายุต่างกัน ต้องยังสามารถแยกสิทธิ์แต่ละชุดได้
- LEGENDARY อาจมีเอฟเฟกต์พิเศษ (shimmer/gradient) เล็กน้อยเพื่อความสนุกแต่ไม่กระทบ performance

---

## 20. Testing และการพัฒนาในเครื่อง

### Testing

| ชั้น | เครื่องมือ | ตัวอย่าง |
| --- | --- | --- |
| Domain | xUnit | กติกา FEFO, สถานะหมดอายุ |
| Application | xUnit + in-memory/SQLite หรือ mocks | CreateGift ต้อง fail เมื่อ receiver ไม่ใช่แฟน, RequestRedemption ต้อง reserve 1 ใบและกันเกินจำนวน |
| WebApi | WebApplicationFactory + Testcontainers (PostgreSQL จริง) | auth flow, approve/reject, สิทธิ์ Admin |
| Frontend | Vitest + Testing Library | component สำคัญ เช่น CouponCard, GiftForm |
| E2E | Playwright | ไหลเต็ม: register → จับคู่ → มอบ → ขอใช้ → อนุมัติ |

เป้าหมาย: use case ธุรกิจหลัก (gift / redemption / expiration) ต้องมี test ครบทุกสาขา decision

### รันในเครื่อง

```bash
# 1) ตั้งค่า (ครั้งแรก) — ตามหัวข้อ 18
# 2) รฐานข้อมูล
docker compose up -d          # PostgreSQL บน localhost:5432

# 3) Backend
cd backend
dotnet ef database update --project src/LovePass.Infrastructure --startup-project src/LovePass.WebApi
dotnet run --project src/LovePass.WebApi     # https://localhost:5080 (+ /swagger)

# 4) Frontend
cd frontend
npm install
npm run dev                                  # http://localhost:3000
```

### CI/CD (แนะนำ)

- GitHub Actions: `dotnet format --verify` → build → test → `dotnet publish` → build image
- Frontend: lint → typecheck → test → build
- Migration รันเป็น step ก่อน deploy backend (หรือ bundle ใน container startup สำหรับช่วง MVP)

---

## 21. MVP Scope

สิ่งที่ต้องทำใน Version 1:

1. Login / Register (JWT + refresh)
2. ระบบจับคู่รัก (Couple Invitation)
3. Admin สร้าง Coupon Template
4. Admin สร้าง Coupon Set
5. ระบบ Rarity 4 ระดับ
6. User เลือกและมอบคูปอง (Single / Predefined Set / Custom Set)
7. User กำหนดจำนวนและวันหมดอายุเอง
8. My Coupons (รวมการ์ด, FEFO)
9. Request Redemption + การกันสิทธิ์
10. Email Notification (Resend)
11. Approve / Reject / Cancel
12. Redemption History + History
13. Admin Dashboard + จัดการ Template/Set/User

ยังไม่ต้องมีระบบชำระเงินจริง กาชา แต้มสะสม แชต หรือฟีเจอร์ Social

---

## 22. หลักการสำคัญของระบบ

- Admin เป็นผู้สร้างต้นแบบคูปองและ Set กลางเท่านั้น
- User เป็นผู้เลือกและมอบคูปองให้แฟนเอง
- User กำหนดจำนวนและวันหมดอายุได้
- User ทั้งสองฝ่ายมีสิทธิ์มอบและรับคูปองเท่ากัน
- ไม่มี Category มีเฉพาะ Rarity
- รองรับคูปองซ้ำและการมอบหลายใบพร้อมกัน
- Set เป็นเพียงชุดต้นแบบ ไม่ใช่คูปองที่ต้องใช้พร้อมกัน
- ตั๋วที่ออกให้แล้วต้องคงรายละเอียดและเงื่อนไขเดิม แม้ Admin จะแก้ไขต้นแบบ (template snapshot)
- คูปองที่ใช้แล้วและหมดอายุต้องมีประวัติเก็บไว้
- ผู้ใช้หนึ่งคู่ไม่สามารถเข้าถึงข้อมูลของอีกคู่ได้ — บังคับที่ Application Layer ทุก use case
- การตรวจสิทธิ์และเปลี่ยนสถานะต้องเกิดฝั่ง Server เท่านั้น (frontend เป็นแค่ UI)
- Domain logic อยู่ใน `LovePass.Domain`/`Application` — Infrastructure เปลี่ยนได้โดยไม่กระทบกติกาธุรกิจ
- Secret ทั้งหมดอยู่นอก git และ config แยกตาม environment

---

เป้าหมาย: สร้างแพลตฟอร์มคูปองสำหรับคู่รักที่เรียบง่าย ใช้งานได้จริง มีระบบจัดการส่วนกลาง และสถาปัตยกรรม (Next.js + .NET Clean Architecture) ที่รองรับผู้ใช้หลายคู่และขยายฟีเจอร์ในอนาคตได้
