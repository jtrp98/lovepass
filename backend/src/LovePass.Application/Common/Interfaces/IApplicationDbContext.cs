using LovePass.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Common.Interfaces;

public interface ITransactionScope : IAsyncDisposable
{
    Task CommitAsync(CancellationToken cancellationToken = default);
    Task RollbackAsync(CancellationToken cancellationToken = default);
}

public interface IApplicationDbContext
{
    DbSet<Couple> Couples { get; }
    DbSet<CoupleMember> CoupleMembers { get; }
    DbSet<CoupleInvitation> CoupleInvitations { get; }
    DbSet<CouponTemplate> CouponTemplates { get; }
    DbSet<CouponSet> CouponSets { get; }
    DbSet<CouponSetItem> CouponSetItems { get; }
    DbSet<GiftBatch> GiftBatches { get; }
    DbSet<IssuedCoupon> IssuedCoupons { get; }
    DbSet<Redemption> Redemptions { get; }
    DbSet<RefreshToken> RefreshTokens { get; }

    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
    Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default);
}
