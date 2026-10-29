namespace LovePass.Application.Common.Models;

public sealed record CurrentUserDto(int Id, string Email, string DisplayName, bool IsAdmin, DateTime CreatedAt);

public sealed record UserListItemDto(int Id, string Email, string DisplayName, string Role, DateTime CreatedAt);
