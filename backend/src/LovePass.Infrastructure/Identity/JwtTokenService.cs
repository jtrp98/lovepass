using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;

namespace LovePass.Infrastructure.Identity;

public sealed class JwtTokenService(
    UserManager<ApplicationUser> userManager,
    IApplicationDbContext db,
    IOptions<JwtOptions> options) : ITokenService
{
    private readonly JwtOptions _options = options.Value;

    public async Task<TokenPair> IssueTokensAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User", userId);

        return await IssueCoreAsync(user, cancellationToken);
    }

    public async Task<TokenPair> RefreshTokensAsync(string refreshToken, CancellationToken cancellationToken = default)
    {
        var hash = HashToken(refreshToken);

        var stored = await db.RefreshTokens
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.TokenHash == hash, cancellationToken)
            ?? throw new UnauthorizedException("Refresh token ไม่ถูกต้องหรือหมดอายุ");

        if (!stored.IsAlive)
            throw new UnauthorizedException("Refresh token ไม่ถูกต้องหรือหมดอายุ");

        var pair = await IssueCoreAsync(stored.User!, cancellationToken);
        stored.Revoked = true;
        stored.ReplacedByTokenHash = HashToken(pair.RefreshToken);
        await db.SaveChangesAsync(cancellationToken);

        return pair;
    }

    private async Task<TokenPair> IssueCoreAsync(ApplicationUser user, CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var roles = await userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email ?? string.Empty),
            new(ClaimTypes.Name, user.DisplayName),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(_options.SigningKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _options.Issuer,
            audience: _options.Audience,
            claims: claims,
            notBefore: now,
            expires: now.AddMinutes(_options.AccessTokenTtlMinutes),
            signingCredentials: credentials);

        var accessToken = new JwtSecurityTokenHandler().WriteToken(token);
        var refreshToken = GenerateRefreshToken();

        db.RefreshTokens.Add(new RefreshToken
        {
            UserId = user.Id,
            TokenHash = HashToken(refreshToken),
            ExpiresAt = now.AddDays(_options.RefreshTokenTtlDays)
        });
        await db.SaveChangesAsync(cancellationToken);

        return new TokenPair(accessToken, refreshToken, _options.AccessTokenTtlMinutes * 60);
    }

    private static string GenerateRefreshToken()
    {
        var bytes = RandomNumberGenerator.GetBytes(64);
        return Convert.ToBase64String(bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_');
    }

    private static string HashToken(string token) =>
        Convert.ToHexString(SHA256.HashData(System.Text.Encoding.UTF8.GetBytes(token)));
}
