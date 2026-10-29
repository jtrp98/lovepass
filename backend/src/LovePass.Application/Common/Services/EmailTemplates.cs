using System.Web;
using LovePass.Application.Common.Models;

namespace LovePass.Application.Common.Services;

/// <summary>สร้าง subject + HTML body ของอีเมลแจ้งเตือนทุกชนิด (ลิงก์ชี้ไปที่ Frontend)</summary>
public static class EmailTemplates
{
    public static (string Subject, string Html) CouponReceived(string receiverName, string senderName, IReadOnlyList<string> couponNames, DateTime expiresAt, AppOptions app)
    {
        var items = string.Join("", couponNames.Select(n => $"<li>{Escape(n)}</li>"));
        var html = $"""
            <h2>คุณได้รับคูปองรัก 💝</h2>
            <p><b>{Escape(senderName)}</b> มอบคูปองให้คุณ ({Escape(receiverName)})</p>
            <ul>{items}</ul>
            <p>หมดอายุ: {expiresAt:yyyy-MM-dd}</p>
            <p><a href="{app.FrontendUrl}/my-coupons">เปิดคลังคูปองของฉัน</a></p>
            """;
        return ($"{senderName} มอบคูปองให้คุณ 💝", html);
    }

    public static (string Subject, string Html) RedemptionRequested(string approverName, string requesterName, string couponName, string rarity, string? message, int issuedCouponId, AppOptions app)
    {
        var link = $"{app.FrontendUrl}/requests?redemption={issuedCouponId}";
        var html = $"""
            <h2>มีคำขอใช้คูปอง</h2>
            <p><b>{Escape(requesterName)}</b> ขอใช้คูปอง <b>{Escape(couponName)}</b> ({rarity})</p>
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
