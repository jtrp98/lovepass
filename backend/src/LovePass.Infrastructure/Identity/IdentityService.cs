using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Infrastructure.Identity;

public sealed class IdentityService(UserManager<ApplicationUser> userManager) : IIdentityService
{
    public async Task<int> RegisterAsync(string email, string password, string displayName, CancellationToken cancellationToken = default)
    {
        var existing = await userManager.FindByEmailAsync(email);
        if (existing is not null)
            throw new ConflictException("อีเมลนี้ถูกใช้สมัครแล้ว");

        var user = new ApplicationUser
        {
            UserName = email,
            Email = email,
            DisplayName = displayName.Trim(),
            EmailConfirmed = true,
            CreatedAt = DateTime.UtcNow
        };

        var result = await userManager.CreateAsync(user, password);
        if (!result.Succeeded)
            throw new ConflictException(string.Join(" ", result.Errors.Select(e => e.Description)));

        await userManager.AddToRoleAsync(user, ApplicationUser.UserRole);
        return user.Id;
    }

    public async Task<int> ValidateCredentialsAsync(string email, string password, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        if (user is null || !await userManager.CheckPasswordAsync(user, password))
            throw new UnauthorizedException("อีเมลหรือรหัสผ่านไม่ถูกต้อง");

        return user.Id;
    }

    public async Task<string> GeneratePasswordResetTokenAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User", userId);
        return await userManager.GeneratePasswordResetTokenAsync(user);
    }

    public async Task ResetPasswordAsync(string email, string token, string newPassword, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email)
            ?? throw new ConflictException("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ");

        var result = await userManager.ResetPasswordAsync(user, token, newPassword);
        if (!result.Succeeded)
            throw new ConflictException("ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุ");
    }

    public async Task<CurrentUserDto> GetUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User", userId);

        return await ToDtoAsync(user);
    }

    public async Task<CurrentUserDto?> FindUserByEmailAsync(string email, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email);
        return user is null ? null : await ToDtoAsync(user);
    }

    public async Task<int> GetOrCreateExternalUserAsync(string provider, string providerUserId, string email, string displayName, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByEmailAsync(email);

        if (user is null)
        {
            user = new ApplicationUser
            {
                UserName = email,
                Email = email,
                DisplayName = displayName.Trim(),
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow
            };

            var result = await userManager.CreateAsync(user); // ไม่มีรหัสผ่าน — ใช้ external login อย่างเดียว
            if (!result.Succeeded)
                throw new ConflictException(string.Join(" ", result.Errors.Select(e => e.Description)));

            await userManager.AddToRoleAsync(user, ApplicationUser.UserRole);
        }

        // ลิงก์ provider ไว้ใน AspNetUserLogins (ถ้ายังไม่เคย)
        var logins = await userManager.GetLoginsAsync(user);
        if (logins.All(l => l.LoginProvider != provider || l.ProviderKey != providerUserId))
            await userManager.AddLoginAsync(user, new UserLoginInfo(provider, providerUserId, provider));

        return user.Id;
    }

    public async Task SoftDeleteUserAsync(int userId, CancellationToken cancellationToken = default)
    {
        var user = await userManager.FindByIdAsync(userId.ToString())
            ?? throw new NotFoundException("User", userId);

        user.IsDeleted = true;
        user.UpdatedAt = DateTime.UtcNow;
        var result = await userManager.UpdateAsync(user);
        if (!result.Succeeded)
            throw new ConflictException(string.Join(" ", result.Errors.Select(e => e.Description)));
    }

    public async Task<IReadOnlyList<UserListItemDto>> GetUsersAsync(CancellationToken cancellationToken = default)
    {
        var users = await userManager.Users.AsNoTracking().OrderBy(u => u.Id).ToListAsync(cancellationToken);
        var list = new List<UserListItemDto>();

        foreach (var user in users)
        {
            var roles = await userManager.GetRolesAsync(user);
            list.Add(new UserListItemDto(user.Id, user.Email ?? string.Empty, user.DisplayName,
                roles.Contains(ApplicationUser.AdminRole) ? ApplicationUser.AdminRole : ApplicationUser.UserRole,
                user.CreatedAt));
        }

        return list;
    }

    public Task<int> CountUsersAsync(CancellationToken cancellationToken = default)
        => userManager.Users.CountAsync(cancellationToken);

    private async Task<CurrentUserDto> ToDtoAsync(ApplicationUser user)
    {
        var roles = await userManager.GetRolesAsync(user);
        return new CurrentUserDto(user.Id, user.Email ?? string.Empty, user.DisplayName,
            roles.Contains(ApplicationUser.AdminRole), user.CreatedAt);
    }
}
