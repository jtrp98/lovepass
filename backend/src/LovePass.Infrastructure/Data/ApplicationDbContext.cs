using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Common;
using LovePass.Domain.Entities;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Infrastructure.Data;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
    : IdentityDbContext<ApplicationUser, IdentityRole<int>, int>(options), IApplicationDbContext
{
    public DbSet<Couple> Couples => Set<Couple>();
    public DbSet<CoupleMember> CoupleMembers => Set<CoupleMember>();
    public DbSet<CoupleInvitation> CoupleInvitations => Set<CoupleInvitation>();
    public DbSet<CouponTemplate> CouponTemplates => Set<CouponTemplate>();
    public DbSet<CouponSet> CouponSets => Set<CouponSet>();
    public DbSet<CouponSetItem> CouponSetItems => Set<CouponSetItem>();
    public DbSet<GiftBatch> GiftBatches => Set<GiftBatch>();
    public DbSet<IssuedCoupon> IssuedCoupons => Set<IssuedCoupon>();
    public DbSet<Redemption> Redemptions => Set<Redemption>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();

    public async Task<ITransactionScope> BeginTransactionAsync(CancellationToken cancellationToken = default)
        => new DbTransactionScope(await Database.BeginTransactionAsync(cancellationToken));

    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Added && entry.Entity.CreatedAt == default)
                entry.Entity.CreatedAt = DateTime.UtcNow;
        }

        return base.SaveChangesAsync(cancellationToken);
    }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);
        builder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}

file sealed class DbTransactionScope(Microsoft.EntityFrameworkCore.Storage.IDbContextTransaction transaction) : ITransactionScope
{
    public Task CommitAsync(CancellationToken cancellationToken = default) => transaction.CommitAsync(cancellationToken);
    public Task RollbackAsync(CancellationToken cancellationToken = default) => transaction.RollbackAsync(cancellationToken);
    public ValueTask DisposeAsync() => transaction.DisposeAsync();
}
