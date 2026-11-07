using System.Web;
using LovePass.Application.Common.Models;

namespace LovePass.Application.Common.Services;

public sealed record CouponEmailItem(string Name, string? Description, int Quantity, string Rarity, string? Emoji);

/// <summary>สร้าง subject + HTML body ของอีเมลแจ้งเตือนทุกชนิด (ลิงก์ชี้ไปที่ Frontend)</summary>
public static class EmailTemplates
{
    public static (string Subject, string Html) CouponReceived(
        string receiverName,
        string senderName,
        string? giftTitle,
        string? giftMessage,
        IReadOnlyList<CouponEmailItem> coupons,
        DateTime expiresAt,
        AppOptions app)
    {
        var subject = string.IsNullOrWhiteSpace(giftTitle)
            ? $"{senderName} มอบของขวัญให้คุณ 💝"
            : $"{senderName} มอบ \"{giftTitle}\" ให้คุณ 💝";

        var titleSection = string.IsNullOrWhiteSpace(giftTitle)
            ? ""
            : $"<h3 style=\"color: #b91c1c; margin: 12px 0 6px 0; font-size: 18px;\">“{Escape(giftTitle)}”</h3>";

        var messageSection = string.IsNullOrWhiteSpace(giftMessage)
            ? ""
            : $"""
            <div style="background: #fdf2f8; border: 1px dashed #f472b6; border-radius: 8px; padding: 14px; margin: 14px 0; font-style: italic; color: #831843; line-height: 1.6;">
                “{Escape(giftMessage)}”
            </div>
            """;

        var items = string.Join("", coupons.Select(c => $"""
            <li style="margin-bottom: 12px; padding: 12px; background: #fff5f7; border-radius: 8px; border-left: 4px solid #f43f5e;">
                <div style="font-weight: 600; font-size: 15px; color: #1f2937;">
                    {(string.IsNullOrWhiteSpace(c.Emoji) ? "" : $"{Escape(c.Emoji)} ")}{Escape(c.Name)} ×{c.Quantity}
                    <span style="font-size: 12px; color: #888; font-weight: normal; margin-left: 6px;">({Escape(c.Rarity)})</span>
                </div>
                {(string.IsNullOrWhiteSpace(c.Description) ? "" : $"<div style=\"font-size: 13px; color: #4b5563; margin-top: 4px; line-height: 1.5;\">{Escape(c.Description)}</div>")}
            </li>
            """));

        var html = $"""
            <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #374151; background: #ffffff; border: 1px solid #fce7f3; border-radius: 12px;">
                <h2 style="color: #e11d48; margin-top: 0; margin-bottom: 6px;">คุณได้รับของขวัญรัก 💝</h2>
                <p style="margin: 0 0 12px 0; font-size: 15px;"><b>{Escape(senderName)}</b> มอบของขวัญให้คุณ ({Escape(receiverName)})</p>
                {titleSection}
                {messageSection}
                <ul style="list-style: none; padding: 0; margin: 16px 0;">{items}</ul>
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">หมดอายุ: {expiresAt:yyyy-MM-dd}</p>
                <p style="margin: 0;"><a href="{app.FrontendUrl}/my-coupons" style="background: #e11d48; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">เปิดดูของขวัญและคูปองของฉัน</a></p>
            </div>
            """;
        return (subject, html);
    }

    /// <summary>Overload สำหรับความเข้ากันได้ย้อนหลัง</summary>
    public static (string Subject, string Html) CouponReceived(string receiverName, string senderName, IReadOnlyList<string> couponNames, DateTime expiresAt, AppOptions app)
        => CouponReceived(receiverName, senderName, null, null, couponNames.Select(n => new CouponEmailItem(n, null, 1, "COMMON", null)).ToList(), expiresAt, app);

    public static (string Subject, string Html) GiftPackReceived(
        string receiverName,
        string senderName,
        string packName,
        string? message,
        IReadOnlyList<string> details,
        DateTime expiresAt,
        AppOptions app)
    {
        var subject = $"{senderName} มอบชุดของขวัญ \"{packName}\" ให้คุณ 💝";
        var messageSection = string.IsNullOrWhiteSpace(message)
            ? ""
            : $"""
            <div style="background: #fdf2f8; border: 1px dashed #f472b6; border-radius: 8px; padding: 14px; margin: 14px 0; font-style: italic; color: #831843; line-height: 1.6;">
                “{Escape(message)}”
            </div>
            """;

        var items = string.Join("", details.Select(d => $"<li style=\"margin-bottom: 8px; color: #374151;\">{Escape(d)}</li>"));

        var html = $"""
            <div style="font-family: sans-serif; max-width: 540px; margin: 0 auto; padding: 24px; color: #374151; background: #ffffff; border: 1px solid #fce7f3; border-radius: 12px;">
                <h2 style="color: #e11d48; margin-top: 0; margin-bottom: 6px;">คุณได้รับซองของขวัญรัก 💝</h2>
                <p style="margin: 0 0 12px 0; font-size: 15px;"><b>{Escape(senderName)}</b> จัดชุดของขวัญให้คุณ ({Escape(receiverName)})</p>
                <h3 style="color: #b91c1c; margin: 12px 0 6px 0; font-size: 18px;">“{Escape(packName)}”</h3>
                {messageSection}
                <ul style="padding-left: 20px; margin: 16px 0;">{items}</ul>
                <p style="font-size: 13px; color: #6b7280; margin-bottom: 20px;">เลือกและใช้คูปองได้ถึง: {expiresAt:yyyy-MM-dd}</p>
                <p style="margin: 0;"><a href="{app.FrontendUrl}/packs" style="background: #e11d48; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">เปิดซองของขวัญของเรา</a></p>
            </div>
            """;
        return (subject, html);
    }

    public static (string Subject, string Html) RedemptionRequested(string approverName, string requesterName, string couponName, string rarity, string? message, int issuedCouponId, AppOptions app, string? targetName = null)
    {
        var link = $"{app.FrontendUrl}/requests?redemption={issuedCouponId}";
        var html = $"""
            <h2>มีคำขอใช้คูปอง</h2>
            <p><b>{Escape(requesterName)}</b> ขอใช้คูปอง <b>{Escape(couponName)}</b> ({rarity})</p>
            {(string.IsNullOrWhiteSpace(targetName) ? "" : $"<p>ใช้กับ: <b>{Escape(targetName)}</b></p>")}
            {(string.IsNullOrWhiteSpace(message) ? "" : $"<p>ข้อความ: \"{Escape(message)}\"</p>")}
            <p><a href="{link}">ดูคำขอและยืนยัน / ปฏิเสธ</a></p>
            """;
        return ($"{requesterName} ขอใช้คูปอง {couponName}", html);
    }

    public static (string Subject, string Html) RedemptionResolved(string requesterName, string approverName, string couponName, bool approved, AppOptions app)
    {
        var verdict = approved ? "ได้รับการอนุมัติ ✅" : "ถูกปฏิเสธ ❌";
        var html = $"""
            <h2>คำขอใช้คูปอง{verdict}</h2>
            <p>คูปอง <b>{Escape(couponName)}</b> ที่คุณ ({Escape(requesterName)}) ขอใช้ — {Escape(approverName)} {verdict}</p>
            <p><a href="{app.FrontendUrl}/history">ดูประวัติ</a></p>
            """;
        return ($"คำขอใช้คูปอง {couponName} {verdict}", html);
    }

    public static (string Subject, string Html) PasswordReset(string email, string token, AppOptions app)
    {
        var link = $"{app.FrontendUrl}/reset-password?email={HttpUtility.UrlEncode(email)}&token={HttpUtility.UrlEncode(token)}";
        var html = $"""
            <h2>รีเซ็ตรหัสผ่าน LOVE PASS</h2>
            <p><a href="{link}">ตั้งรหัสผ่านใหม่</a></p>
            <p>ลิงก์นี้ใช้ได้ครั้งเดียว หากไม่ได้ขอเองกรุณาละเลยอีเมลนี้</p>
            """;
        return ("รีเซ็ตรหัสผ่าน LOVE PASS", html);
    }

    private static string Escape(string? value) => HttpUtility.HtmlEncode(value ?? string.Empty);
}
