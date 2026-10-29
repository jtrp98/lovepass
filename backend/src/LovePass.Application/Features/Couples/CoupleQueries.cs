using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Couples;

public sealed record CoupleDto(int CoupleId, int PartnerUserId, string PartnerDisplayName, string PartnerEmail, DateTime CoupledSince);

public sealed record GetMyCoupleQuery() : IQuery<CoupleDto?>;

public sealed class GetMyCoupleQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetMyCoupleQuery, CoupleDto?>
{
    public async Task<CoupleDto?> Handle(GetMyCoupleQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();

        var membership = await db.CoupleMembers
            .Include(m => m.Couple!.Members)
            .ThenInclude(m => m.User)
            .Where(m => m.UserId == userId && m.Couple!.Status == CoupleStatus.Active)
            .Select(m => m.Couple!)
            .FirstOrDefaultAsync(cancellationToken);

        if (membership is null) return null;

        var partner = membership.Members.FirstOrDefault(m => m.UserId != userId);
        if (partner is null) return null;

        return new CoupleDto(
            membership.Id,
            partner.UserId,
            partner.User?.DisplayName ?? string.Empty,
            partner.User?.Email ?? string.Empty,
            membership.CreatedAt);
    }
}
