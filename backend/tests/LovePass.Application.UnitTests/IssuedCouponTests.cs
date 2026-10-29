using LovePass.Domain.Entities;
using LovePass.Domain.Enums;

namespace LovePass.Application.UnitTests;

public class IssuedCouponTests
{
    private static IssuedCoupon NewCoupon(int quantity = 2, int daysToExpire = 30) => new()
    {
        CouponTemplateId = 1,
        SenderId = 1,
        ReceiverId = 2,
        Quantity = quantity,
        RemainingQuantity = quantity,
        ReservedQuantity = 0,
        ExpiresAt = DateTime.UtcNow.AddDays(daysToExpire),
        TemplateSnapshot = """{"name":"ตั๋วกอด","description":"","terms":"","rarity":"COMMON","emoji":"🤗","imageUrl":null}"""
    };

    [Fact]
    public void TryReserve_IncrementsReserved()
    {
        var coupon = NewCoupon(quantity: 2);

        var result = coupon.TryReserve();

        Assert.True(result);
        Assert.Equal(1, coupon.ReservedQuantity);
        Assert.Equal(2, coupon.RemainingQuantity);
        Assert.Equal(1, coupon.AvailableQuantity);
    }

    [Fact]
    public void TryReserve_Fails_WhenNoAvailable()
    {
        var coupon = NewCoupon(quantity: 1);
        coupon.TryReserve();

        var result = coupon.TryReserve();

        Assert.False(result);
        Assert.Equal(1, coupon.ReservedQuantity);
    }

    [Fact]
    public void TryReserve_Fails_WhenExpired()
    {
        var coupon = NewCoupon(daysToExpire: -1);

        Assert.False(coupon.TryReserve());
    }

    [Fact]
    public void TryConfirmRedemption_DecrementsRemainingAndReserved()
    {
        var coupon = NewCoupon(quantity: 3);
        coupon.TryReserve();

        var result = coupon.TryConfirmRedemption();

        Assert.True(result);
        Assert.Equal(2, coupon.RemainingQuantity);
        Assert.Equal(0, coupon.ReservedQuantity);
        Assert.Equal(IssuedCouponStatus.Active, coupon.Status);
    }

    [Fact]
    public void TryConfirmRedemption_SetsFullyRedeemed_WhenRemainingReachesZero()
    {
        var coupon = NewCoupon(quantity: 1);
        coupon.TryReserve();

        Assert.True(coupon.TryConfirmRedemption());
        Assert.Equal(0, coupon.RemainingQuantity);
        Assert.Equal(IssuedCouponStatus.FullyRedeemed, coupon.Status);
        Assert.False(coupon.IsUsable);
    }

    [Fact]
    public void TryReleaseReservation_ReturnsTheReservedUnit()
    {
        var coupon = NewCoupon(quantity: 2);
        coupon.TryReserve();

        Assert.True(coupon.TryReleaseReservation());
        Assert.Equal(0, coupon.ReservedQuantity);
        Assert.Equal(2, coupon.AvailableQuantity);
    }

    [Fact]
    public void ReadSnapshot_ReturnsOriginalDetails()
    {
        var coupon = NewCoupon();

        var snapshot = coupon.ReadSnapshot();

        Assert.Equal("ตั๋วกอด", snapshot.Name);
        Assert.Equal("COMMON", snapshot.Rarity);
        Assert.Equal("🤗", snapshot.Emoji);
    }
}
