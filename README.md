# LOVE PASS

ระบบคูปองของขวัญสำหรับคู่รัก (Couple Coupon Platform) — คู่รักสร้างและมอบคูปองของขวัญให้กัน แลกใช้จริงพร้อมบันทึกประวัติ

| ส่วน | Stack |
| --- | --- |
| `frontend/` | Next.js (App Router) + TypeScript + Tailwind CSS — deploy บน **Vercel** |
| `backend/` | ASP.NET Core Web API (.NET 10) — Clean Architecture — deploy บน **Render** (Docker) |
| DB | **Supabase** PostgreSQL (EF Core + Npgsql) |

```
lovepass/
├── docs/        # requirements, architecture, setup & deployment
├── frontend/    # Next.js
├── backend/     # .NET Clean Architecture
├── scripts/     # API smoke tests
└── docker-compose.yml
```

- เอกสารฉบับเต็ม (requirements + architecture): [docs/lovepass.md](docs/lovepass.md)
- วิธีรัน local, tests และ deployment: [docs/setup-and-deploy.md](docs/setup-and-deploy.md)
