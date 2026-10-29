using System.Security.Claims;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.JsonWebTokens;
using Microsoft.IdentityModel.Protocols;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;

namespace LovePass.Infrastructure.Identity;

/// <summary>
/// ตรวจ Google ID token กับ JWKS ของ Google โดยตรง (openid-configuration)
/// บังคับ audience = ClientId ของเรา + ตรวจอายุ token และ email_verified
/// </summary>
public sealed class GoogleTokenVerifier(IOptions<GoogleAuthOptions> options) : IExternalAuthVerifier
{
    private static readonly string[] ValidIssuers = ["https://accounts.google.com", "accounts.google.com"];

    // แคช signing keys ของ Google ไว้ใช้ร่วมกัน ( ConfigurationManager หมุนเอา keys ใหม่เมื่อหมดอายุ)
    private static readonly ConfigurationManager<OpenIdConnectConfiguration> Configuration = new(
        "https://accounts.google.com/.well-known/openid-configuration",
        new OpenIdConnectConfigurationRetriever());

    private readonly GoogleAuthOptions _options = options.Value;

    public async Task<ExternalUserInfo> VerifyGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ClientId))
            throw new ConflictException("ยังไม่ได้เปิดใช้งานการสมัครด้วย Google (ตั้งค่า Authentication:Google:ClientId)");

        OpenIdConnectConfiguration config;
        try
        {
            config = await Configuration.GetConfigurationAsync(cancellationToken);
        }
        catch (Exception)
        {
            throw new UnauthorizedException("ดึงข้อมูลยืนยันจาก Google ไม่สำเร็จ ลองใหม่อีกครั้ง");
        }

        var handler = new JsonWebTokenHandler();
        var result = await handler.ValidateTokenAsync(idToken, new TokenValidationParameters
        {
            ValidIssuers = ValidIssuers,
            ValidAudiences = [_options.ClientId],
            IssuerSigningKeys = config.SigningKeys,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true
        });

        if (!result.IsValid)
            throw new UnauthorizedException("Google token ไม่ถูกต้องหรือหมดอายุ");

        var identity = result.ClaimsIdentity;
        var sub = identity.FindFirst(Microsoft.IdentityModel.JsonWebTokens.JwtRegisteredClaimNames.Sub)?.Value
            ?? throw new UnauthorizedException("Google token ไม่มีรหัสผู้ใช้");

        var email = identity.FindFirst(ClaimTypes.Email)?.Value
            ?? identity.FindFirst("email")?.Value
            ?? throw new UnauthorizedException("Google token ไม่มีอีเมล");

        if (identity.FindFirst("email_verified")?.Value == "false")
            throw new UnauthorizedException("อีเมล Google ยังไม่ได้ยืนยัน");

        var displayName = identity.FindFirst("name")?.Value;
        if (string.IsNullOrWhiteSpace(displayName))
            displayName = email.Split('@')[0];

        return new ExternalUserInfo($"google:{sub}", email, displayName);
    }
}
