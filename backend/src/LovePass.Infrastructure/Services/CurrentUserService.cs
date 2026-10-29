using System.Security.Claims;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using Microsoft.AspNetCore.Http;

namespace LovePass.Infrastructure.Services;

public sealed class CurrentUserService(IHttpContextAccessor httpContextAccessor) : ICurrentUserService
{
    private ClaimsPrincipal? Principal => httpContextAccessor.HttpContext?.User;

    public int? UserId =>
        int.TryParse(Principal?.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : null;

    public string? Email => Principal?.FindFirstValue(ClaimTypes.Email);

    public bool IsAdmin => Principal?.IsInRole(ApplicationUser.AdminRole) ?? false;
}
