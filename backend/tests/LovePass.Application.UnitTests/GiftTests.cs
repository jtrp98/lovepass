using LovePass.Application.Common.Models;
using LovePass.Application.Common.Services;
using LovePass.Application.Features.Gifts;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using Microsoft.Extensions.Options;

namespace LovePass.Application.UnitTests;

public class GiftTests
{
    [Fact]
    public void CreateGiftCommandValidatorAllowsTitleAndMessageWithinLimits()
    {
        var validator = new CreateGiftCommandValidator();
        var command = new CreateGiftCommand(
            ReceiverId: 2,
            ExpiresAt: DateTime.UtcNow.AddDays(7),
            Title: "ของขวัญวันครบรอบ",
            Message: "รักเธอเสมอ",
            Items: [new GiftItemInput(1, 2)]);

        var result = validator.Validate(command);
        Assert.True(result.IsValid);

        var tooLongTitle = command with { Title = new string('A', 101) };
        Assert.False(validator.Validate(tooLongTitle).IsValid);

        var tooLongMessage = command with { Message = new string('B', 501) };
        Assert.False(validator.Validate(tooLongMessage).IsValid);
    }

    [Fact]
    public void EmailTemplateCouponReceivedIncludesTitleMessageAndCouponDescriptions()
    {
        var app = new AppOptions { FrontendUrl = "https://app.lovepass.local" };
        var coupons = new List<CouponEmailItem>
        {
            new("นวดไหล่ 30 นาที", "นวดให้สบายจนหลับ พร้อมชาอุ่น ๆ", 2, "COMMON", "💆"),
            new("ดินเนอร์ใต้แสงเทียน", "เลือกร้านที่อยากไปได้เลย", 1, "RARE", "🕯️")
        };

        var (subject, html) = EmailTemplates.CouponReceived(
            receiverName: "คนดี",
            senderName: "แฟนจ๋า",
            giftTitle: "สุขสันต์วันครบรอบ 1 ปี",
            giftMessage: "ขอบคุณที่อยู่ข้างกันมาตลอดนะ รักที่สุดเลย",
            coupons: coupons,
            expiresAt: DateTime.UtcNow.AddMonths(1),
            app: app);

        Assert.Contains("สุขสันต์วันครบรอบ 1 ปี", subject);
        Assert.Contains("สุขสันต์วันครบรอบ 1 ปี", html);
        Assert.Contains("ขอบคุณที่อยู่ข้างกันมาตลอดนะ รักที่สุดเลย", html);
        Assert.Contains("นวดไหล่ 30 นาที", html);
        Assert.Contains("นวดให้สบายจนหลับ พร้อมชาอุ่น ๆ", html);
        Assert.Contains("ดินเนอร์ใต้แสงเทียน", html);
        Assert.Contains("เลือกร้านที่อยากไปได้เลย", html);
    }

    [Fact]
    public void EmailTemplateGiftPackReceivedIncludesDetails()
    {
        var app = new AppOptions { FrontendUrl = "https://app.lovepass.local" };
        var (subject, html) = EmailTemplates.GiftPackReceived(
            receiverName: "บี",
            senderName: "เอ",
            packName: "ซองคำสัญญา",
            message: "ขอให้ปีนี้มีความสุขมาก ๆ นะ",
            details: ["COMMON: ให้สิทธิ์ 5 ใบ", "RARE: ให้สิทธิ์ 1 ใบ"],
            expiresAt: DateTime.UtcNow.AddMonths(6),
            app: app);

        Assert.Contains("ซองคำสัญญา", subject);
        Assert.Contains("ขอให้ปีนี้มีความสุขมาก ๆ นะ", html);
        Assert.Contains("COMMON: ให้สิทธิ์ 5 ใบ", html);
    }

    [Fact]
    public void IssuedCouponInheritsExactExpiryDateAndPreservesItAcrossOpening()
    {
        var expiresAt = new DateTime(2026, 12, 31, 16, 59, 59, DateTimeKind.Utc);
        var coupon = new IssuedCoupon
        {
            Id = 1,
            GiftBatchId = 10,
            CouponTemplateId = 1,
            Quantity = 2,
            RemainingQuantity = 2,
            ExpiresAt = expiresAt,
            Status = IssuedCouponStatus.Active
        };

        var batch = new GiftBatch
        {
            Id = 10,
            SenderId = 1,
            ReceiverId = 2,
            Coupons = [coupon],
            OpenedAt = null
        };

        // Before opening: expiresAt matches the set date identically
        Assert.Equal(expiresAt, coupon.ExpiresAt);
        Assert.False(coupon.IsExpired);

        // After opening the batch: OpenedAt is recorded, but coupon ExpiresAt is untouched (same day, no post-open reset)
        batch.OpenedAt = DateTime.UtcNow;
        Assert.Equal(expiresAt, coupon.ExpiresAt);
        Assert.False(coupon.IsExpired);
    }
}
