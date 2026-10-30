# LOVE PASS

Version **1.0.0** · [Release workflow](docs/guides/release-workflow.md)

ระบบคูปองของขวัญสำหรับคู่รัก (Couple Coupon Platform) — คู่รักสร้างและมอบคูปองของขวัญให้กัน แลกใช้จริงพร้อมบันทึกประวัติ

| ส่วน | Stack |
| --- | --- |
| `frontend/` | Next.js (App Router) + TypeScript + Tailwind CSS — deploy บน **Vercel** |
| `backend/` | ASP.NET Core Web API (.NET 10) — Clean Architecture — deploy บน **Render** (Docker) |
| DB | **Supabase** PostgreSQL (EF Core + Npgsql) |

```
lovepass/
├── docs/        # product · design · guides · archive (ดู docs/README.md)
├── frontend/    # Next.js
├── backend/     # .NET Clean Architecture
├── scripts/     # API smoke tests
└── docker-compose.yml
```

- สารบัญเอกสารทั้งหมด: [docs/README.md](docs/README.md)
- เอกสารฉบับเต็ม (requirements + architecture): [docs/product/lovepass.md](docs/product/lovepass.md)
- Design system: [docs/design/README.md](docs/design/README.md)
- วิธีรัน local, tests และ deployment: [docs/guides/setup-and-deploy.md](docs/guides/setup-and-deploy.md)
- ส่งการแจ้งเตือนด้วย Gmail โดยไม่ต้องมีโดเมน: [docs/guides/gmail-setup.md](docs/guides/gmail-setup.md)
- กติกาการทำงานสำหรับคนและ AI agent: [AGENTS.md](AGENTS.md)
