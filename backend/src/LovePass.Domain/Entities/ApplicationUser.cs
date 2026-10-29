using LovePass.Domain.Common;
using Microsoft.AspNetCore.Identity;

namespace LovePass.Domain.Entities;

public class ApplicationUser : IdentityUser<int>, ISoftDeletable
{
    public const string AdminRole = "Admin";
    public const string UserRole = "User";

    public string DisplayName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }

    public bool IsDeleted { get; set; }
}
