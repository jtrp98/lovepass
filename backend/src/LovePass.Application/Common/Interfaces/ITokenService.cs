using LovePass.Application.Common.Models;

namespace LovePass.Application.Common.Interfaces;

public interface ITokenService
{
    Task<TokenPair> IssueTokensAsync(int userId, CancellationToken cancellationToken = default);
    Task<TokenPair> RefreshTokensAsync(string refreshToken, CancellationToken cancellationToken = default);
}
