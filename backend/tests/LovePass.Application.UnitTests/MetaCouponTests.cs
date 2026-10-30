using LovePass.Application.Features.Admin;
using LovePass.Application.Features.Redemptions;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.Rules;
using LovePass.Domain.ValueObjects;

namespace LovePass.Application.UnitTests;

public class MetaCouponTests
{
    private const int Sender = 1, Receiver = 2;

    private static IssuedCoupon Coupon(int id, Rarity rarity, CouponEffect effect = CouponEffect.None, bool metaLocked = false,
        int quantity = 1, int remaining = 1, int sender = Sender, CouponCategory category = CouponCategory.Together) => new()
    {
        Id = id,
        SenderId = sender,
        ReceiverId = Receiver,
        Quantity = quantity,
        RemainingQuantity = remaining,
        ExpiresAt = DateTime.UtcNow.AddDays(30),
        Status = remaining == 0 ? IssuedCouponStatus.FullyRedeemed : IssuedCouponStatus.Active,
        TemplateSnapshot = CouponTemplateSnapshot.Of(new CouponTemplate
        {
            Name = $"ใบที่ {id}", Rarity = rarity, Category = category, Effect = effect, MetaLocked = metaLocked
        }).ToJson()
    };

    [Fact]
    public void LegacySnapshotReadsAsNormalCoupon()
    {
        var snapshot = CouponTemplateSnapshot.FromJson("""{"name":"เดิม","description":"","terms":"","rarity":"EPIC","emoji":null,"imageUrl":null,"category":"WISH"}""");
        Assert.Equal(CouponEffect.None, MetaCouponRules.EffectOf(snapshot));
        Assert.False(snapshot.MetaLocked);
    }

    [Fact]
    public void ReplayNeedsACouponThatWasAlreadyUsed()
    {
        var replay = Coupon(1, Rarity.Epic, CouponEffect.Replay);
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.Replay, replay, Coupon(2, Rarity.Epic)));
        Assert.Null(MetaCouponRules.CheckCouponTarget(CouponEffect.Replay, replay, Coupon(3, Rarity.Epic, remaining: 0)));
    }

    [Fact]
    public void ReplayStopsAtEpicAndGoldStopsAtLegendary()
    {
        var used = Coupon(2, Rarity.Legendary, remaining: 0);
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.Replay, Coupon(1, Rarity.Epic, CouponEffect.Replay), used));
        Assert.Null(MetaCouponRules.CheckCouponTarget(CouponEffect.ReplayGold, Coupon(1, Rarity.Legendary, CouponEffect.ReplayGold), used));
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.ReplayGold, Coupon(1, Rarity.Legendary, CouponEffect.ReplayGold),
            Coupon(3, Rarity.Mythic, metaLocked: true, remaining: 0)));
    }

    [Fact]
    public void PowersNeverTargetOtherPowers()
    {
        var usedReplay = Coupon(2, Rarity.Epic, CouponEffect.Replay, remaining: 0);
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.ReplayGold, Coupon(1, Rarity.Legendary, CouponEffect.ReplayGold), usedReplay));
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.Extend, Coupon(1, Rarity.Common, CouponEffect.Extend), Coupon(3, Rarity.Rare, CouponEffect.Wildcard)));
    }

    [Fact]
    public void LockedCouponsOnlyAcceptExtend()
    {
        var cash = Coupon(2, Rarity.Mythic, metaLocked: true, category: CouponCategory.Gift);
        Assert.Null(MetaCouponRules.CheckCouponTarget(CouponEffect.Extend, Coupon(1, Rarity.Common, CouponEffect.Extend), cash));
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.Upgrade, Coupon(1, Rarity.Rare, CouponEffect.Upgrade),
            Coupon(3, Rarity.Common, metaLocked: true, category: CouponCategory.Gift)));
    }

    [Fact]
    public void PowersOnlyWorkWithCouponsFromTheSameGiver()
    {
        var other = Coupon(2, Rarity.Common, remaining: 0, sender: 99);
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.Replay, Coupon(1, Rarity.Epic, CouponEffect.Replay), other));
    }

    [Fact]
    public void FastPassAndUpgradeNeedAUsableTarget()
    {
        var fastPass = Coupon(1, Rarity.Rare, CouponEffect.FastPass);
        Assert.Null(MetaCouponRules.CheckCouponTarget(CouponEffect.FastPass, fastPass, Coupon(2, Rarity.Rare)));
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.FastPass, fastPass, Coupon(3, Rarity.Epic)));
        Assert.NotNull(MetaCouponRules.CheckCouponTarget(CouponEffect.FastPass, fastPass, Coupon(4, Rarity.Common, remaining: 0)));
    }

    [Fact]
    public void WildcardPicksActiveCommonOrRareNonGiftTemplates()
    {
        Assert.Null(MetaCouponRules.CheckTemplateTarget(CouponEffect.Wildcard, new CouponTemplate { Rarity = Rarity.Rare, Category = CouponCategory.Food }));
        Assert.NotNull(MetaCouponRules.CheckTemplateTarget(CouponEffect.Wildcard, new CouponTemplate { Rarity = Rarity.Epic }));
        Assert.NotNull(MetaCouponRules.CheckTemplateTarget(CouponEffect.Wildcard, new CouponTemplate { Rarity = Rarity.Common, Category = CouponCategory.Gift }));
        Assert.NotNull(MetaCouponRules.CheckTemplateTarget(CouponEffect.Wildcard, new CouponTemplate { Rarity = Rarity.Rare, Effect = CouponEffect.FastPass }));
        Assert.NotNull(MetaCouponRules.CheckTemplateTarget(CouponEffect.Wildcard, new CouponTemplate { Rarity = Rarity.Common, IsActive = false }));
    }

    [Fact]
    public void ExtendingASingleCouponMovesItsExpiry()
    {
        var target = Coupon(2, Rarity.Rare);
        var expiry = target.ExpiresAt;
        Assert.True(target.TryReserve());
        Assert.True(target.TryExtendReservedUnit(MetaCouponRules.ExtendBy, out var split));
        Assert.Null(split);
        Assert.Equal(expiry.AddDays(60), target.ExpiresAt);
        Assert.Equal(0, target.ReservedQuantity);
    }

    [Fact]
    public void ExtendingOneOfManySplitsItIntoItsOwnRow()
    {
        var target = Coupon(2, Rarity.Common, quantity: 3, remaining: 2);
        var expiry = target.ExpiresAt;
        Assert.True(target.TryReserve());
        Assert.True(target.TryExtendReservedUnit(MetaCouponRules.ExtendBy, out var split));

        Assert.NotNull(split);
        Assert.Equal(1, split.Quantity);
        Assert.Equal(expiry.AddDays(60), split.ExpiresAt);
        Assert.Equal(target.TemplateSnapshot, split.TemplateSnapshot);
        Assert.Equal((2, 1, 0), (target.Quantity, target.RemainingQuantity, target.ReservedQuantity));
        Assert.Equal(expiry, target.ExpiresAt);
        Assert.Equal(1, target.ConfirmedUses);
    }

    [Fact]
    public void RequestCannotNameTwoTargets()
    {
        Assert.False(new RequestRedemptionCommandValidator().Validate(new RequestRedemptionCommand(1, null, 2, 3)).IsValid);
        Assert.True(new RequestRedemptionCommandValidator().Validate(new RequestRedemptionCommand(1, null, 2)).IsValid);
    }

    [Theory]
    [InlineData("MYTHIC", "GIFT", "NONE")]
    [InlineData("LEGENDARY", "POWER", "REPLAYGOLD")]
    [InlineData("rare", "power", "fastpass")]
    public void AdminAcceptsNewTierCategoryAndEffect(string rarity, string category, string effect)
    {
        Assert.True(new CreateCouponTemplateCommandValidator().Validate(new CreateCouponTemplateCommand("ชื่อ", "", "", rarity, null, null, category, effect)).IsValid);
        Assert.True(new UpdateCouponTemplateCommandValidator().Validate(new UpdateCouponTemplateCommand(1, "ชื่อ", "", "", rarity, null, null, true, category, effect)).IsValid);
    }

    [Fact]
    public void AdminRejectsUnknownEffect()
    {
        Assert.False(new CreateCouponTemplateCommandValidator().Validate(new CreateCouponTemplateCommand("ชื่อ", "", "", "RARE", null, null, "POWER", "DOUBLE")).IsValid);
    }
}
