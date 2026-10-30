using LovePass.Application.Common.Interfaces;
using LovePass.Application.Features.Admin;
using LovePass.Application.Features.Coupons;
using LovePass.Application.Features.Gifts;
using LovePass.Application.Features.History;
using LovePass.Application.Features.Redemptions;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.UnitTests;

/// <summary>
/// ตรวจกับ PostgreSQL จริง (query ใช้ navigation ที่ต้องแปลเป็น SQL) — ข้ามถ้าไม่ได้ตั้ง LOVEPASS_TEST_PG
/// เช่น Host=localhost;Port=55432;Database=lp;Username=postgres;Password=pw (ฐานข้อมูลจะถูกลบและสร้างใหม่)
/// </summary>
public class DissolvedCoupleVisibilityTests
{
    private static readonly string? Connection = Environment.GetEnvironmentVariable("LOVEPASS_TEST_PG");

    private sealed class FakeUser(int id) : ICurrentUserService
    {
        public int? UserId => id;
        public string? Email => null;
        public bool IsAdmin => false;
    }

    private const string Snapshot = """{"name":"ตั๋วกอด","description":"","terms":"","rarity":"COMMON","emoji":"🤗","imageUrl":null}""";

    [Fact]
    public async Task DissolvingACouple_HidesTheirCouponsPacksRequestsAndHistory_ButKeepsTheData()
    {
        if (string.IsNullOrEmpty(Connection)) return; // ไม่มี PostgreSQL ให้ตรวจ — ข้ามเงียบๆ

        var options = new DbContextOptionsBuilder<ApplicationDbContext>().UseNpgsql(Connection).Options;
        await using var db = new ApplicationDbContext(options);
        await db.Database.EnsureDeletedAsync();
        await db.Database.EnsureCreatedAsync();

        ApplicationUser U(string n) => new() { UserName = n, Email = $"{n}@t.test", DisplayName = n, CreatedAt = DateTime.UtcNow };
        var a = U("a"); var b = U("b"); var c = U("c");
        db.Users.AddRange(a, b, c);
        var template = new CouponTemplate { Name = "ตั๋วกอด" };
        db.CouponTemplates.Add(template);
        await db.SaveChangesAsync();

        var couple = new Couple { Members = [new CoupleMember { UserId = a.Id }, new CoupleMember { UserId = b.Id }] };
        db.Couples.Add(couple);
        await db.SaveChangesAsync();

        var batch = new GiftBatch { SenderId = a.Id, ReceiverId = b.Id, CoupleId = couple.Id, Message = "รัก" };
        batch.Coupons.Add(new IssuedCoupon
        {
            CouponTemplateId = template.Id, SenderId = a.Id, ReceiverId = b.Id, Quantity = 2, RemainingQuantity = 2,
            ExpiresAt = DateTime.UtcNow.AddDays(30), TemplateSnapshot = Snapshot
        });
        db.GiftBatches.Add(batch);
        await db.SaveChangesAsync();
        db.Redemptions.Add(new Redemption
        {
            IssuedCouponId = batch.Coupons[0].Id, RequesterId = b.Id, ApproverId = a.Id, Status = RedemptionStatus.Approved,
            RequestedAt = DateTime.UtcNow, ResolvedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        async Task<(int coupons, int sent, int redemptionsSent, int redemptionsReceived, int history, int dashboard)> Snapshotted()
        {
            var asB = new FakeUser(b.Id); var asA = new FakeUser(a.Id);
            return ((await new GetMyCouponsQueryHandler(db, asB).Handle(new GetMyCouponsQuery(), default)).Count,
                (await new GetSentGiftsQueryHandler(db, asA).Handle(new GetSentGiftsQuery(), default)).Count,
                (await new GetRedemptionsQueryHandler(db, asB).Handle(new GetRedemptionsQuery("sent"), default)).Count,
                (await new GetRedemptionsQueryHandler(db, asA).Handle(new GetRedemptionsQuery("received"), default)).Count,
                (await new GetHistoryQueryHandler(db, asB).Handle(new GetHistoryQuery(), default)).Count
                + (await new GetHistoryQueryHandler(db, asA).Handle(new GetHistoryQuery(), default)).Count,
                (await new GetDashboardQueryHandler(db, asB).Handle(new GetDashboardQuery(), default)).ReceivedCoupons
                + (await new GetDashboardQueryHandler(db, asB).Handle(new GetDashboardQuery(), default)).UsedCoupons);
        }

        var before = await Snapshotted();
        Assert.Equal((1, 1, 1, 1, 3, 3), before);

        await new DissolveCoupleCommandHandler(db).Handle(new DissolveCoupleCommand(couple.Id), default);
        Assert.Equal((0, 0, 0, 0, 0, 0), await Snapshotted());

        // ข้อมูลไม่ถูกลบ
        Assert.Equal(1, await db.GiftBatches.CountAsync());
        Assert.Equal(1, await db.IssuedCoupons.CountAsync());
        Assert.Equal(1, await db.Redemptions.CountAsync());
        Assert.Equal(2, await db.CoupleMembers.CountAsync());

        // จับคู่ใหม่กับคนเดิม → ของเก่ากลับมา
        db.Couples.Add(new Couple { Members = [new CoupleMember { UserId = a.Id }, new CoupleMember { UserId = b.Id }] });
        await db.SaveChangesAsync();
        Assert.Equal(before, await Snapshotted());

        // ยกเลิกแล้วจับกับคนใหม่ → ไม่เห็นของคนเก่า
        var again = await db.Couples.OrderByDescending(x => x.Id).FirstAsync();
        await new DissolveCoupleCommandHandler(db).Handle(new DissolveCoupleCommand(again.Id), default);
        db.Couples.Add(new Couple { Members = [new CoupleMember { UserId = b.Id }, new CoupleMember { UserId = c.Id }] });
        await db.SaveChangesAsync();
        Assert.Equal((0, 0, 0, 0, 0, 0), await Snapshotted());

        await Assert.ThrowsAsync<LovePass.Application.Common.Exceptions.ConflictException>(
            () => new DissolveCoupleCommandHandler(db).Handle(new DissolveCoupleCommand(couple.Id), default));
    }
}
