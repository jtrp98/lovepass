using LovePass.Domain.Common;

namespace LovePass.Domain.Entities;

public class RefreshToken : BaseEntity
{
    public int UserId { get; set; }
    public ApplicationUser? User { get; set; }
    public string TokenHash { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool Revoked { get; set; }
    public string? ReplacedByTokenHash { get; set; }

    public bool IsAlive => !Revoked && DateTime.UtcNow < ExpiresAt;
}
