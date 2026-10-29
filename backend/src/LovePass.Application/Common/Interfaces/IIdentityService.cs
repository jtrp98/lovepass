using LovePass.Application.Common.Models;

namespace LovePass.Application.Common.Interfaces;

public interface IIdentityService
{
    Task<int> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken = default);
    Task<int> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken = default);
    Task<string> GeneratePasswordResetTokenAsync(int userId, CancellationToken cancellationToken = default);
    Task ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default);
    Task<CurrentUserDto> GetUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<CurrentUserDto?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default);
    Task<int> GetOrCreateExternalUserAsync(string provider, string providerUserId, string email, string displayName, CancellationToken cancellationToken = default);
    Task SoftDeleteUserAsync(int userId, CancellationToken cancellationToken = default);
    Task<IReadOnlyList<UserListItemDto>> GetUsersAsync(CancellationToken cancellationToken = default);
    Task<int> CountUsersAsync(CancellationToken cancellationToken = default);
}
