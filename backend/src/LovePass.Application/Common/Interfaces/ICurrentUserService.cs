using LovePass.Application.Common.Exceptions;

namespace LovePass.Application.Common.Interfaces;

public interface ICurrentUserService
{
    int? UserId { get; }
    string? Email { get; }
    bool IsAdmin { get; }

    int RequiredUserId()
        => UserId ?? throw new UnauthorizedException();
}
