using LovePass.Domain.Common;
using LovePass.Domain.Enums;

namespace LovePass.Domain.Entities;

public class CoupleInvitation : BaseEntity
{
    public int InviterId { get; set; }
    public ApplicationUser? Inviter { get; set; }
    public string InviteToken { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;

    public bool IsExpired => DateTime.UtcNow >= ExpiresAt;
}
