using LovePass.Application.Features.Gifts;
using LovePass.Domain.ValueObjects;

namespace LovePass.Application.UnitTests;

public class GiftPackTests
{
    private static GiftPackPlan Plan() => new()
    {
        Name = "วันเกิด", Mode = "CHOICE", OpenedAt = DateTime.UtcNow, ExpiresAt = DateTime.UtcNow.AddYears(1),
        OpenedTiers = ["COMMON", "RARE"],
        Quotas = new() { ["COMMON"] = 3, ["RARE"] = 1 },
        Options = [new(1, 2, new("งานบ้าน", "", "ทำจนเสร็จ", "COMMON", null, null)),
            new(2, 3, new("กอด", "", "30 นาที", "COMMON", null, null)),
            new(3, 1, new("ของขวัญ", "", "2,000 บาท", "RARE", null, null))]
    };

    [Fact]
    public void BatchSelectionIsAtomicAndRequiresAnOpenedTier()
    {
        var plan = Plan(); plan.OpenedTiers.Clear();
        Assert.False(plan.TryChooseMany(Guid.NewGuid(), "COMMON", [1, 2], false));
        plan.OpenedTiers.Add("COMMON");
        Assert.False(plan.TryChooseMany(Guid.NewGuid(), "COMMON", [1, 1, 1], false));
        Assert.False(plan.TryChooseMany(Guid.NewGuid(), "COMMON", [1, 3], false));
        Assert.Empty(plan.Draws);
        var id = Guid.NewGuid();
        Assert.True(plan.TryChooseMany(id, "COMMON", [1, 1, 2], false));
        Assert.Equal(3, plan.Draws.Count);
        Assert.False(plan.TryChooseMany(id, "COMMON", [2], false));
        Assert.Equal(0, plan.Remaining("COMMON"));
        Assert.Single(plan.Available("RARE"));
    }

    [Fact]
    public void BatchValidatorRejectsBadCountsAndAmbiguousSelections()
    {
        var validator = new DrawGiftPackCommandValidator();
        var command = new DrawGiftPackCommand(1, Guid.NewGuid(), "COMMON", Quantity: 3, CouponTemplateIds: [1, 1, 2]);
        Assert.True(validator.Validate(command).IsValid);
        Assert.False(validator.Validate(command with { Quantity = 2 }).IsValid);
        Assert.False(validator.Validate(command with { Quantity = 0 }).IsValid);
        Assert.False(validator.Validate(command with { CouponTemplateId = 1 }).IsValid);
        Assert.False(validator.Validate(command with { CouponTemplateIds = [0, 1, 2] }).IsValid);
        Assert.False(validator.Validate(command with { ExpectedDrawCount = -1 }).IsValid);
    }

    [Fact]
    public void ChoiceAndRandomShareQuotaAndRespectRepeatLimit()
    {
        var plan = Plan();
        Assert.True(plan.TryChoose(Guid.NewGuid(), "COMMON", 1, false));
        Assert.True(plan.TryChoose(Guid.NewGuid(), "COMMON", 1, true));
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 1, true));
        Assert.True(plan.TryChoose(Guid.NewGuid(), "COMMON", 2, false));
        Assert.Empty(plan.Available("COMMON"));
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 2, true));
        Assert.Single(plan.Available("RARE"));
    }

    [Fact]
    public void CannotReplayIntentOrSelectOutsidePoolOrTier()
    {
        var plan = Plan(); var id = Guid.NewGuid();
        Assert.True(plan.TryChoose(id, "COMMON", 1, true));
        Assert.False(plan.TryChoose(id, "COMMON", 2, false));
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 3, false));
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 999, false));
        Assert.Single(plan.Draws);
    }

    [Fact]
    public void MustOpenBeforeChoosingAndCannotChooseExpiredOrFixedPack()
    {
        var plan = Plan(); plan.OpenedAt = null;
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 1, true));
        plan.OpenedAt = DateTime.UtcNow; plan.ExpiresAt = DateTime.UtcNow.AddSeconds(-1);
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 1, true));
        plan.ExpiresAt = DateTime.UtcNow.AddDays(1); plan.Mode = "FIXED";
        Assert.False(plan.TryChoose(Guid.NewGuid(), "COMMON", 1, true));
    }

    [Fact]
    public void ReloadRetainsDrawsAndOriginalTerms()
    {
        var plan = Plan(); plan.TryChoose(Guid.NewGuid(), "COMMON", 1, true);
        var reloaded = GiftPackPlan.FromJson(plan.ToJson());
        Assert.Single(reloaded.Draws);
        Assert.Equal(2, reloaded.Remaining("COMMON"));
        Assert.Equal("ทำจนเสร็จ", reloaded.Options[0].Coupon.Terms);
    }

    [Fact]
    public void ValidatorRejectsDuplicateOptionsAndQuotasAndUnknownMode()
    {
        var command = new CreateGiftPackCommand(Guid.NewGuid(), 2, "วันเกิด", "CHOICE", DateTime.UtcNow.AddDays(1), null,
            [new(1, 8)], [new("COMMON", 10)]);
        var validator = new CreateGiftPackCommandValidator();
        Assert.True(validator.Validate(command).IsValid);
        Assert.True(validator.Validate(command with { Options = [] }).IsValid);
        Assert.False(validator.Validate(command with { Mode = "FIXED", Options = [], Quotas = [] }).IsValid);
        Assert.False(validator.Validate(command with { Options = [new(1, 8), new(1, 8)] }).IsValid);
        Assert.False(validator.Validate(command with { Quotas = [new("COMMON", 1), new("COMMON", 1)] }).IsValid);
        Assert.False(validator.Validate(command with { Quotas = [new("FAKE", 1)] }).IsValid);
        Assert.False(validator.Validate(command with { Mode = "FAKE" }).IsValid);
        Assert.False(validator.Validate(command with { Options = null! }).IsValid);
        Assert.False(validator.Validate(command with { Quotas = null! }).IsValid);
    }
}
