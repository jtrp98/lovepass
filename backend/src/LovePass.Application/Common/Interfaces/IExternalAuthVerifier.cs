namespace LovePass.Application.Common.Interfaces;

public sealed record ExternalUserInfo(string ProviderUserId, string Email, string DisplayName);

/// <summary>ยืนยัน token จาก external provider (เช่น Google ID token)</summary>
public interface IExternalAuthVerifier
{
    Task<ExternalUserInfo> VerifyGoogleTokenAsync(string idToken, CancellationToken cancellationToken = default);
}
