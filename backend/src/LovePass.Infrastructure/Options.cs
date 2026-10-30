using System.ComponentModel.DataAnnotations;

namespace LovePass.Infrastructure;

public sealed class JwtOptions
{
    public const string SectionName = "Jwt";

    public string Issuer { get; set; } = "lovepass-api";
    public string Audience { get; set; } = "lovepass-web";
    public string SigningKey { get; set; } = string.Empty;
    public int AccessTokenTtlMinutes { get; set; } = 15;
    public int RefreshTokenTtlDays { get; set; } = 30;
}

public sealed class ResendOptions
{
    public const string SectionName = "Resend";

    public string ApiKey { get; set; } = string.Empty;
    public string FromEmail { get; set; } = "LOVE PASS <onboarding@resend.dev>";
}

public sealed class GmailOptions
{
    public const string SectionName = "Gmail";

    [Required, EmailAddress]
    public string SenderEmail { get; set; } = string.Empty;

    [Required]
    public string ClientId { get; set; } = string.Empty;

    [Required]
    public string ClientSecret { get; set; } = string.Empty;

    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public sealed class SeedOptions
{
    public const string SectionName = "Seed";

    public string AdminEmail { get; set; } = "admin@lovepass.local";
    public string AdminPassword { get; set; } = "Admin@12345";
    public bool DemoTemplates { get; set; }
}

public sealed class CorsOptions
{
    public const string SectionName = "Cors";

    /// <summary>คั่นหลาย origin ด้วย ; เช่น http://localhost:3000;https://lovepass.example</summary>
    public string AllowedOrigins { get; set; } = "http://localhost:3000";

    public string[] Origins() =>
        AllowedOrigins.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
}

public sealed class GoogleAuthOptions
{
    public const string SectionName = "Authentication:Google";

    /// <summary>OAuth Client ID จาก Google Cloud Console — เว้นว่าง = ปิดใช้งาน Google Sign-in</summary>
    public string ClientId { get; set; } = string.Empty;
}
