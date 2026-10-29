using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LovePass.Infrastructure.Data;

/// <summary>Seed ข้อมูลเริ่มต้นตอนรันครั้งแรกเมื่อ DB ว่าง: บัญชี Admin + Coupon Templates ตัวอย่าง + Romantic Set</summary>
public sealed class DataSeeder(
    UserManager<ApplicationUser> userManager,
    RoleManager<IdentityRole<int>> roleManager,
    IApplicationDbContext db,
    IOptions<SeedOptions> options,
    ILogger<DataSeeder> logger)
{
    public async Task SeedAsync(CancellationToken cancellationToken = default)
    {
        await EnsureRoleAsync(ApplicationUser.AdminRole);
        await EnsureRoleAsync(ApplicationUser.UserRole);
        await EnsureAdminAsync();
        await EnsureDemoDataAsync(cancellationToken);
    }

    private async Task EnsureRoleAsync(string role)
    {
        if (!await roleManager.RoleExistsAsync(role))
            await roleManager.CreateAsync(new IdentityRole<int>(role));
    }

    private async Task EnsureAdminAsync()
    {
        var admin = await userManager.FindByEmailAsync(options.Value.AdminEmail);
        if (admin is not null) return;

        admin = new ApplicationUser
        {
            UserName = options.Value.AdminEmail,
            Email = options.Value.AdminEmail,
            DisplayName = "Admin",
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(admin, options.Value.AdminPassword);
        if (!result.Succeeded)
        {
            logger.LogWarning("Failed to seed admin: {Errors}", string.Join("; ", result.Errors.Select(e => e.Description)));
            return;
        }

        await userManager.AddToRoleAsync(admin, ApplicationUser.AdminRole);
        logger.LogInformation("Seeded admin account {Email}", options.Value.AdminEmail);
    }

    private async Task EnsureDemoDataAsync(CancellationToken cancellationToken)
    {
        if (!options.Value.DemoTemplates || await db.CouponTemplates.AnyAsync(cancellationToken))
            return;

        var hug = new CouponTemplate { Name = "ตั๋วกอดไม่อั้น", Description = "กอดได้ตามใจ ไม่จำกัดเวลา", Terms = "แสดงตั๋วแล้วขอกอดได้ทันที", Rarity = Rarity.Common, Emoji = "🤗" };
        var meal = new CouponTemplate { Name = "ตั๋วมื้อนี้ฉันเลี้ยง", Description = "มื้อที่ชอบให้เลือกได้เอง", Terms = "ไม่รวมเครื่องดื่มแอลกอฮอล์", Rarity = Rarity.Rare, Emoji = "🍜" };
        var wish = new CouponTemplate { Name = "ตั๋วขอพร 1 ข้อ", Description = "ขออะไรก็ได้ 1 อย่าง (ตามสมควร)", Terms = "ห้ามขอสิ่งที่เป็นไปไม่ได้", Rarity = Rarity.Epic, Emoji = "🌟" };
        var freedom = new CouponTemplate { Name = "ตั๋วตามใจ 1 วัน", Description = "วันนี้เธอตามใจเราทุกอย่าง", Terms = "ใช้ได้ 1 วันภายในวันที่กำหนด", Rarity = Rarity.Epic, Emoji = "👑" };
        var invite = new CouponTemplate { Name = "ตั๋วอัญเชิญ", Description = "เชิญไปงานหรือสถานที่พิเศษ 1 ครั้ง", Terms = "แจ้งล่วงหน้าอย่างน้อย 3 วัน", Rarity = Rarity.Common, Emoji = "💌" };
        var bigGift = new CouponTemplate { Name = "ตั๋วอะไรก็ได้ไม่เกิน 10,000 บาท", Description = "ของขวัญมูลค่าไม่เกิน 10,000 บาท", Terms = "ต้องมีของจริงเป็นหลักฐาน", Rarity = Rarity.Legendary, Emoji = "🎁" };
        var trip = new CouponTemplate { Name = "ตั๋วทริปพิเศษ", Description = "เที่ยวด้วยกันแบบพิเศษ 1 ทริป", Terms = "วางแผนร่วมกันก่อนใช้สิทธิ์", Rarity = Rarity.Legendary, Emoji = "✈️" };

        hug.Category = CouponCategory.Affection;
        meal.Category = CouponCategory.Food;
        wish.Category = freedom.Category = bigGift.Category = CouponCategory.Wish;
        invite.Category = CouponCategory.Together;
        trip.Category = CouponCategory.Adventure;
        var templates = new[] { hug, meal, wish, freedom, invite, bigGift, trip };
        db.CouponTemplates.AddRange(templates);
        await db.SaveChangesAsync(cancellationToken); // ต้อง save ก่อนเพื่อให้ได้ Id จริง

        db.CouponSets.Add(new CouponSet
        {
            Name = "Romantic Set",
            Description = "ชุดคูปองโรแมนติกสำหรับโอกาสพิเศษ",
            IsActive = true,
            Items =
            [
                new CouponSetItem { CouponTemplateId = hug.Id, Quantity = 5 },
                new CouponSetItem { CouponTemplateId = meal.Id, Quantity = 3 },
                new CouponSetItem { CouponTemplateId = invite.Id, Quantity = 2 },
                new CouponSetItem { CouponTemplateId = freedom.Id, Quantity = 1 }
            ]
        });

        await db.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Seeded {Count} demo coupon templates + Romantic Set", templates.Length);
    }
}
