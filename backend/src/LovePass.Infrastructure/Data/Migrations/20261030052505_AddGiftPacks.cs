using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace LovePass.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddGiftPacks : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PackKey",
                table: "GiftBatches",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PackPlan",
                table: "GiftBatches",
                type: "jsonb",
                nullable: true);

            migrationBuilder.AddColumn<uint>(
                name: "xmin",
                table: "GiftBatches",
                type: "xid",
                rowVersion: true,
                nullable: false,
                defaultValue: 0u);

            migrationBuilder.CreateIndex(
                name: "IX_GiftBatches_PackKey",
                table: "GiftBatches",
                column: "PackKey",
                unique: true);

            SeedBirthday(migrationBuilder);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                DO $$ BEGIN
                  IF EXISTS (SELECT 1 FROM "GiftBatches" WHERE "PackPlan" IS NOT NULL) THEN
                    RAISE EXCEPTION 'Cannot remove gift packs while envelopes exist. Preserve their promises before rollback.';
                  END IF;
                END $$;
                UPDATE "CouponSets" SET "IsActive" = FALSE, "IsDeleted" = TRUE WHERE "Name" = 'วันเกิดนี้ มีเราให้ทั้งปี';
                """);
            migrationBuilder.DropIndex(
                name: "IX_GiftBatches_PackKey",
                table: "GiftBatches");

            migrationBuilder.DropColumn(
                name: "PackKey",
                table: "GiftBatches");

            migrationBuilder.DropColumn(
                name: "PackPlan",
                table: "GiftBatches");

            migrationBuilder.DropColumn(
                name: "xmin",
                table: "GiftBatches");
        }

        private static void SeedBirthday(MigrationBuilder migrationBuilder)
        {
            var additions = new[]
            {
                ("ไปหาเธอในวันของเรา", "คิดถึงแล้วไปหา นัดวันมาอยู่ด้วยกันสักครั้ง", "1 ใบ = เราเดินทางไปหาเธอ 1 ครั้ง นัดวันและระยะเวลาอยู่ด้วยกันล่วงหน้า งบค่าเดินทางไปกลับและที่พักของเรารวมไม่เกิน 2,000 บาท ถ้าเส้นทางหรือต้องค้างคืนเกินงบ ให้ตกลงแผนที่อยู่ในงบด้วยกันก่อนยืนยัน", "Epic", "Adventure", false),
                ("ของขวัญวันเกิดที่เธอเลือก", "ของที่เล็งไว้หนึ่งชิ้น เราห่อให้ด้วยความรัก", "1 ใบ = ของขวัญ 1 ชิ้นที่เธอเลือก ไม่เกิน 2,000 บาทรวมค่าส่ง บอกรุ่น สี และขนาดให้ชัด เราซื้อและมอบให้ภายใน 30 วัน ถ้าของหมด เลือกชิ้นใหม่หรือตกลงรอด้วยกัน", "Rare", "Gift", true),
                ("คืนหนังกับขนมของเรา", "เธอเลือกเรื่อง เราจัดขนม แล้วนั่งดูด้วยกัน", "1 ใบ = หนัง 1 เรื่องหรือซีรีส์ 2 ตอนที่เธอเลือก ดูที่บ้านหรือพร้อมกันออนไลน์ เราจ่ายค่าขนม เครื่องดื่ม และค่าเช่าหนังรวมไม่เกิน 300 บาท", "Common", "Together", false)
            };
            static string Sql(string text) => "'" + text.Replace("'", "''") + "'";
            foreach (var (name, description, terms, rarity, category, locked) in additions)
            {
                var fullTerms = terms + "\n\nหนึ่งใบใช้ได้หนึ่งครั้ง คุยรายละเอียดให้ตรงกันก่อนยืนยัน งบคือเพดานที่เราจ่าย ใครไม่สบายใจหยุดได้เสมอ แอปบันทึกสิทธิ์ ไม่ได้โอนเงินหรือจองแทนเรา";
                migrationBuilder.Sql($"""
                    INSERT INTO "CouponTemplates" ("Name", "Description", "Terms", "Rarity", "Category", "Effect", "MetaLocked", "IsActive", "IsDeleted", "CreatedAt")
                    SELECT {Sql(name)}, {Sql(description)}, {Sql(fullTerms)}, {Sql(rarity)}, {Sql(category)}, 'None', {(locked ? "TRUE" : "FALSE")}, TRUE, FALSE, now()
                    WHERE NOT EXISTS (SELECT 1 FROM "CouponTemplates" WHERE "Name" = {Sql(name)} AND NOT "IsDeleted");
                    """);
            }
            migrationBuilder.Sql("""
                UPDATE "CouponSets" SET "IsActive" = FALSE, "IsDeleted" = TRUE, "UpdatedAt" = now() WHERE "Name" = 'Romantic Set' AND NOT "IsDeleted";
                INSERT INTO "CouponSets" ("Name", "Description", "IsActive", "IsDeleted", "CreatedAt")
                SELECT 'วันเกิดนี้ มีเราให้ทั้งปี', 'คำสัญญา 22 ใบ งานบ้าน 8 ใบ พร้อมไปหา ของขวัญ และมื้อพิเศษ งบตามสิทธิ์รวมไม่เกิน 6,900 บาท', TRUE, FALSE, now()
                WHERE NOT EXISTS (SELECT 1 FROM "CouponSets" WHERE "Name" = 'วันเกิดนี้ มีเราให้ทั้งปี' AND NOT "IsDeleted");
                INSERT INTO "CouponSetItems" ("SetId", "CouponTemplateId", "Quantity", "CreatedAt")
                SELECT s."Id", t."Id", v.qty, now()
                FROM "CouponSets" s
                CROSS JOIN (VALUES ('ไปหาเธอในวันของเรา', 1), ('ของขวัญวันเกิดที่เธอเลือก', 1), ('เลี้ยงหนึ่งมื้อ', 1),
                    ('ดอกไม้วันธรรมดา', 1), ('ของอร่อยส่งถึงมือ', 1), ('คืนหนังกับขนมของเรา', 1), ('ช่างภาพส่วนตัวของเธอ', 1),
                    ('กอดไม่อั้น', 3), ('นวดให้ 15 นาที', 3), ('ชมให้ฟัง 3 ข้อ', 1), ('งานบ้านนี้เราทำ', 8)) AS v(name, qty)
                JOIN "CouponTemplates" t ON t."Name" = v.name AND NOT t."IsDeleted"
                WHERE s."Name" = 'วันเกิดนี้ มีเราให้ทั้งปี' AND NOT s."IsDeleted"
                  AND NOT EXISTS (SELECT 1 FROM "CouponSetItems" i WHERE i."SetId" = s."Id" AND i."CouponTemplateId" = t."Id");
                """);
        }
    }
}
