# LOVE PASS — กติกาการทำงาน (คนและ AI agent)

ไฟล์นี้คือกติกาเดียวของทั้ง repo `CLAUDE.md` import ไฟล์นี้ จึงใช้กติกาเดียวกันทุกเครื่องมือ ถ้าจะเปลี่ยนกติกาให้แก้ที่นี่ที่เดียว

LOVE PASS คือแพลตฟอร์มคูปองของขวัญสำหรับคู่รัก: มอบคูปอง → อีกฝ่ายขอใช้ → ผู้มอบยืนยัน → เก็บเป็นความทรงจำ

| ส่วน | Stack | อ่านก่อนแก้ |
| --- | --- | --- |
| `frontend/` | Next.js 16 (App Router, webpack), React 19, Tailwind CSS v4, TypeScript | [frontend/AGENTS.md](frontend/AGENTS.md), [docs/design/README.md](docs/design/README.md) |
| `backend/` | ASP.NET Core (.NET 10), Clean Architecture, MediatR, FluentValidation, EF Core + PostgreSQL | [docs/product/lovepass.md](docs/product/lovepass.md) |
| `docs/` | product · design · guides · archive | [docs/README.md](docs/README.md) |

## กติกาทั่วไป

- แก้เฉพาะสิ่งที่งานต้องการ ไม่ refactor หรือย้ายไฟล์นอกขอบเขต ถ้าเจอปัญหาอื่นให้แจ้ง ไม่แอบแก้
- ทำงานบน `dev/golf` commit message และ pull request เป็นภาษาอังกฤษ (ดู [release-workflow](docs/guides/release-workflow.md)) ไฟล์ที่เป็นของงานอื่นไม่รวมใน commit เดียวกัน
- ห้าม commit secret หรือไฟล์ `.env*` ค่าใหม่ให้เพิ่มใน `.env.example` / `appsettings*.json` แบบไม่มีค่าลับ
- ข้อความที่ผู้ใช้เห็นเป็นภาษาไทย น้ำเสียงอบอุ่นแบบคนรักคุยกัน error ต้องบอกว่าเกิดอะไรและทำอะไรต่อได้
- รายงานผลตามจริง: ไม่อ้างว่ารันเทส ตรวจหน้าจอ หรือ generate asset ถ้าไม่ได้ทำจริง

## Frontend

### โครงสร้าง

- หน้าใน `src/app/` แยก group: `(auth)` ล็อกอิน, `(user)` ผู้ใช้, `admin/` ผู้ดูแล, `design/love-pass` สมุดตัวอย่างที่ไม่ยิง API
- เรียก API ผ่าน `src/lib/api.ts` เท่านั้น type อยู่ที่ `src/types/index.ts` โหลดข้อมูลในหน้าใช้ `useResource` (`src/lib/use-resource.ts`)
- Next.js รุ่นนี้ต่างจากที่โมเดลรู้จัก อ่าน `node_modules/next/dist/docs/` ก่อนใช้ API ของ Next (รายละเอียดใน [frontend/AGENTS.md](frontend/AGENTS.md))

### ใช้ component กลางก่อนเสมอ

ตารางเต็มอยู่ใน [docs/design/README.md](docs/design/README.md#components)

- Control ทุกตัวใช้ `Button`, `LinkButton`, `Field`, `Input`, `Select`, `Textarea` จาก `components/ui.tsx` — ห้ามเขียนปุ่มหรือ input ใหม่ ห้าม override สี/hover/disabled ของปุ่มจาก CSS ของหน้า
- พื้นกระดาษใช้ `Card` เลือก `variant` ตามวัตถุ: `paper` (ทั่วไป/admin), `letter`, `booklet`, `journal`
- คูปองทุกใบใช้ `LoveTicket` / `TicketDetail`, ใบคำขอใช้ `CouponRequestCard`, ตราใช้แล้วใช้ `RubberStamp`, ของขวัญที่ส่งใช้ `SentGiftCard`, ใบรับใช้ `RedemptionReceipt`, ซอง/ตราครั่ง/ไอคอนใช้ `stationery.tsx`
- โครงหน้าและสถานะใช้ `PageTitle`, `Dialog`, `EmptyState`, `ErrorState`, `ErrorText`, `Notice`, `Skeleton`
- ถ้าต้องมีวัตถุใหม่ที่ใช้มากกว่าหนึ่งหน้า สร้างเป็น component ใน `src/components/` (ชื่อไฟล์ kebab-case) ไม่ copy markup ไปหลายหน้า

### Theme และ CSS

- สีทุกค่ามาจาก token ใน `src/app/globals.css` ห้าม hardcode สีในหน้าหรือ component (ยกเว้นในไฟล์ illustration SVG)
- `globals.css` = tokens, base, materials ของ `Card`, control states / `pocket.css` = geometry ของตั๋วและวัตถุกระดาษ ห้ามสร้าง palette ชุดที่สอง
- ใช้ Tailwind utility สำหรับ layout/spacing ได้ แต่ความเป็นวัสดุ (กระดาษ หมึก รอยปรุ) ต้องอยู่ใน class ที่ใช้ซ้ำได้
- Sarabun สำหรับ UI และเนื้อหา, Mali เฉพาะหัวข้อและข้อความที่ "เขียนด้วยมือ", mono สำหรับเลขที่พิมพ์

### Art direction และการสร้างสิ่งใหม่

ธีมคือ **Pastel Pink × Romantic Stationery × Illustrated Analog Objects** — ตั๋วต้องดูพิมพ์จริง ตราต้องดูประทับจริง ซองต้องดูพับจริง

- **ถ้าสิ่งที่มีไม่พอ ให้สร้างใหม่ได้เลย** เมื่อเข้ากับธีมและทำให้ผลลัพธ์ดูเป็นวัตถุจริง: SVG ที่วาดเอง, SVG จากสคริปต์ (`frontend/scripts/materials.mjs`), CSS mask/gradient, SVG filter (`material-defs.tsx`) หรือ AI image generation ถ้ามีเครื่องมือ
- asset ที่สร้างต้องเป็นภาพวาดแนว stylized realism ไม่ใช่ภาพถ่าย ไม่ใช่ stock photo และไม่ใช่ภาพหน้าจอทั้ง component
- เก็บที่ `frontend/public/materials/<หมวด>/` ใช้เป็น layer ของ component จริง — ข้อความ ตัวเลข วันที่ สถานะ และปุ่มต้องเป็น HTML เสมอ
- ห้ามใช้ emoji เป็นภาพประกอบ ใช้ `TicketIllustration`, `StationeryIcon` หรือวาด SVG ใหม่ในสไตล์ลายเส้นเดียวกัน
- รายละเอียดต้องมีเหตุผลทางกายภาพและพอดี ไม่ใส่ texture/เงา/animation เพิ่มเพื่อให้ดูซับซ้อน
- เพิ่ม asset แล้วบันทึกในตาราง Materials ของ [docs/design/README.md](docs/design/README.md) ถ้าไม่ได้ใช้เครื่องมือ generate จริง ห้ามเขียนว่า generate
- Admin ใช้ token เดียวกันแต่เน้นความชัดเจน ไม่ใส่วัตถุ analog ที่ซับซ้อน

### พฤติกรรมที่ห้ามพัง

- **ไม่แสดงผลสำเร็จก่อน API สำเร็จ** — ตราประทับ (`RubberStamp animate`), ซองเปิด, notice สำเร็จ แสดงหลัง response สำเร็จเท่านั้น ข้อมูลที่โหลดมาแล้วแสดงสถานะสุดท้ายโดยไม่เล่น animation
- ทุก animation ต้องมี resting state เป็นผลลัพธ์สุดท้าย และเคารพ `prefers-reduced-motion`
- พื้นที่กดอย่างน้อย 44px, มี focus ที่มองเห็นได้, ใช้คีย์บอร์ดได้, dialog คืน focus เมื่อปิด, สถานะมีข้อความให้ screen reader
- ไม่มี horizontal scroll ที่ 320–1440px ข้อความไทยยาวต้องตัดบรรทัดได้
- ปุ่มของ `LoveTicket` ต้องอยู่นอก stub ที่ถูก mask เพื่อให้แตะได้ทั้งใบ (ดูคอมเมนต์ใน `love-ticket.tsx`)

### ตรวจก่อนส่งงาน (ใน `frontend/`)

```bash
npx tsc --noEmit
npm run lint -- --quiet
npm test
npm run build
```

Browser tests ต้องใช้ Playwright ที่ติดตั้งไว้ (`PLAYWRIGHT_MODULE=<path ของ package playwright>`) และ server ที่ localhost — `npm run test:pocket`, `npm run test:categories` (dev server), `npm run test:ui` (production build, ตั้ง `UI_TEST_URL`) ผลจะลงที่ `frontend/test-results/` ซึ่งไม่ถูก commit งานที่เปลี่ยนหน้าตาต้องดูหน้าจอจริงที่กว้าง 390 และ 1280 px

## Backend

### Clean Architecture

```
WebApi → Application → Domain
Infrastructure → Application → Domain
```

- `LovePass.Domain` — entity, enum, value object, กฎของ entity (เช่น `IssuedCoupon.TryReserve()`) ไม่อ้างอิงโปรเจกต์อื่นหรือ EF
- `LovePass.Application` — use case ทั้งหมด, interface ของสิ่งภายนอก (`Common/Interfaces`), exception, behavior
- `LovePass.Infrastructure` — EF Core (`Data/`), Identity/JWT, อีเมล, บริการภายนอก ลงทะเบียนใน `DependencyInjection.cs`
- `LovePass.WebApi` — controller, middleware, `Program.cs` เท่านั้น ไม่มี business logic

### เพิ่ม use case

- ไฟล์อยู่ที่ `Application/Features/<Area>/<Area>Commands.cs` หรือ `<Area>Queries.cs` เก็บ request, validator, handler และ DTO ของ use case เดียวกันไว้ด้วยกัน
- เปลี่ยนข้อมูล = `sealed record XxxCommand(...) : ICommand<T>` (ห่อ transaction อัตโนมัติด้วย `TransactionBehavior`) / อ่านอย่างเดียว = `IQuery<T>`
- Validator = `XxxCommandValidator : AbstractValidator<XxxCommand>` ในไฟล์เดียวกัน ถูกลงทะเบียนอัตโนมัติและรันก่อน handler
- Handler เป็น `sealed class` ใช้ primary constructor inject `IApplicationDbContext`, `ICurrentUserService` ฯลฯ ตรวจสิทธิ์ด้วย `currentUser.RequiredUserId()` และความเป็นเจ้าของข้อมูลใน handler เสมอ
- DTO เป็น `sealed record` ส่งออกเป็น camelCase enum ส่งเป็น string ตัวพิมพ์ใหญ่ (`"PENDING"`, `"WISH"`)
- กฎที่เป็นของ entity ใส่ใน Domain ไม่กระจายในหลาย handler

### Error

- โยน exception จาก `Application/Common/Exceptions/AppExceptions.cs`: `NotFoundException` (404), `ForbiddenAccessException` (403), `UnauthorizedException` (401), `ConflictException("ข้อความไทย")` (409) — validation error เป็น 400 อัตโนมัติ
- `ExceptionHandlingMiddleware` แปลงเป็น RFC 7807 ProblemDetails controller ไม่ try/catch เอง
- ข้อความใน `ConflictException` แสดงถึงผู้ใช้ จึงเป็นภาษาไทยที่อ่านเข้าใจ

### Controller

- อยู่ที่ `WebApi/Controllers/Api/V1/` route `api/v1/<resource>` ใส่ `[ApiController]`, `[Authorize]` (admin ใช้ `[Authorize(Roles = "Admin")]` ใน `Admin/`)
- primary constructor รับ `ISender mediator` แต่ละ action มีแค่ `Ok(await mediator.Send(...))` พร้อม `/// <summary>` ภาษาไทยสั้น ๆ

### Data

- เปลี่ยน entity → แก้ `Infrastructure/Data/EntityConfigurations.cs` → สร้าง migration (API รัน migration อัตโนมัติตอน start):

```bash
cd backend
dotnet ef migrations add <Name> --project src/LovePass.Infrastructure --startup-project src/LovePass.WebApi --output-dir Data/Migrations
```

- ลบข้อมูลที่มีประวัติอ้างอิงใช้ soft delete (`ISoftDeletable`) ไม่ลบจริง
- คูปองที่มอบไปแล้วอ่านข้อมูลจาก snapshot (`CouponTemplateSnapshot`) แก้ template ต้องไม่เปลี่ยนคูปองที่มอบไปแล้ว
- เวลาเก็บเป็น UTC

### API contract

- เปลี่ยน DTO หรือ endpoint ต้องแก้ `frontend/src/types/index.ts` และ `frontend/src/lib/api.ts` ในงานเดียวกัน field ใหม่ควรเป็นแบบเพิ่ม (frontend ยังรับ response เก่าได้)
- เปลี่ยน contract ต้องอัปเดตเอกสารใน `docs/product/`

### ตรวจก่อนส่งงาน (ใน `backend/`)

```bash
dotnet build
dotnet test
```

test อยู่ที่ `tests/LovePass.Application.UnitTests` (xUnit) ทดสอบกฎ domain และ validator ของ use case ที่เพิ่มหรือแก้

## เอกสาร

- สารบัญและกติกาอยู่ที่ [docs/README.md](docs/README.md): `product/` ระบบทำอะไร, `design/` หน้าตา, `guides/` วิธีทำ, `archive/` งานที่จบแล้ว
- เอกสารใหม่ต้องลงหมวดและเพิ่มบรรทัดใน `docs/README.md` เอกสารที่ล้าสมัยย้ายไป `archive/` ไม่ลบ
- ผลทดสอบ browser ไม่ commit ทั้งหมด เก็บเฉพาะ evidence ที่ต้องอ้างอิงไว้ที่ `docs/archive/<งาน>/`
