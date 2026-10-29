using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace LovePass.Infrastructure.Data;

public class CoupleConfiguration : IEntityTypeConfiguration<Couple>
{
    public void Configure(EntityTypeBuilder<Couple> builder)
    {
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasMany(c => c.Members).WithOne(m => m.Couple!).HasForeignKey(m => m.CoupleId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class CoupleMemberConfiguration : IEntityTypeConfiguration<CoupleMember>
{
    public void Configure(EntityTypeBuilder<CoupleMember> builder)
    {
        builder.HasIndex(m => m.UserId);
        // user หนึ่งคนอยู่ใน couple เดียวที่ยัง Active
        builder.HasIndex(m => new { m.UserId, m.CoupleId }).IsUnique();
    }
}

public class CoupleInvitationConfiguration : IEntityTypeConfiguration<CoupleInvitation>
{
    public void Configure(EntityTypeBuilder<CoupleInvitation> builder)
    {
        builder.Property(i => i.InviteToken).HasMaxLength(128);
        builder.HasIndex(i => i.InviteToken).IsUnique();
        builder.Property(i => i.Status).HasConversion<string>().HasMaxLength(20);
    }
}

public class ApplicationUserConfiguration : IEntityTypeConfiguration<ApplicationUser>
{
    public void Configure(EntityTypeBuilder<ApplicationUser> builder)
    {
        // user ที่ถูก soft delete จะหายจากทุก query รวมถึง UserManager (ล็อกอินไม่ได้)
        builder.HasQueryFilter(u => !u.IsDeleted);
    }
}

public class CouponTemplateConfiguration : IEntityTypeConfiguration<CouponTemplate>
{
    public void Configure(EntityTypeBuilder<CouponTemplate> builder)
    {
        builder.Property(t => t.Name).HasMaxLength(100);
        builder.Property(t => t.Description).HasMaxLength(500);
        builder.Property(t => t.Terms).HasMaxLength(1000);
        builder.Property(t => t.Rarity).HasConversion<string>().HasMaxLength(20);
        builder.Property(t => t.Category).HasConversion<string>().HasMaxLength(20).HasDefaultValue(LovePass.Domain.Enums.CouponCategory.Other);
        builder.Property(t => t.Emoji).HasMaxLength(16);
        builder.HasQueryFilter(t => !t.IsDeleted);
    }
}

public class CouponSetConfiguration : IEntityTypeConfiguration<CouponSet>
{
    public void Configure(EntityTypeBuilder<CouponSet> builder)
    {
        builder.Property(s => s.Name).HasMaxLength(100);
        builder.Property(s => s.Description).HasMaxLength(500);
        builder.HasMany(s => s.Items).WithOne(i => i.Set!).HasForeignKey(i => i.SetId).OnDelete(DeleteBehavior.Cascade);
        builder.HasQueryFilter(s => !s.IsDeleted);
    }
}

public class CouponSetItemConfiguration : IEntityTypeConfiguration<CouponSetItem>
{
    public void Configure(EntityTypeBuilder<CouponSetItem> builder)
    {
        builder.HasIndex(i => new { i.SetId, i.CouponTemplateId }).IsUnique();
        builder.HasOne(i => i.Template).WithMany(t => t.SetItems).HasForeignKey(i => i.CouponTemplateId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class GiftBatchConfiguration : IEntityTypeConfiguration<GiftBatch>
{
    public void Configure(EntityTypeBuilder<GiftBatch> builder)
    {
        builder.Property(b => b.Message).HasMaxLength(500);
        builder.HasMany(b => b.Coupons).WithOne(c => c.GiftBatch!).HasForeignKey(c => c.GiftBatchId).OnDelete(DeleteBehavior.Cascade);
    }
}

public class IssuedCouponConfiguration : IEntityTypeConfiguration<IssuedCoupon>
{
    public void Configure(EntityTypeBuilder<IssuedCoupon> builder)
    {
        builder.Property(c => c.TemplateSnapshot).HasColumnType("jsonb");
        builder.Property(c => c.Status).HasConversion<string>().HasMaxLength(20);
        builder.Property(c => c.RowVersion).IsRowVersion();

        builder.HasIndex(c => new { c.ReceiverId, c.ExpiresAt });
        builder.HasIndex(c => new { c.SenderId, c.ExpiresAt });

        builder.HasOne(c => c.GiftBatch).WithMany(b => b.Coupons).HasForeignKey(c => c.GiftBatchId);
        builder.HasOne(c => c.Template).WithMany(t => t.IssuedCoupons).HasForeignKey(c => c.CouponTemplateId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Sender).WithMany().HasForeignKey(c => c.SenderId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(c => c.Receiver).WithMany().HasForeignKey(c => c.ReceiverId).OnDelete(DeleteBehavior.Restrict);
    }
}

public class RedemptionConfiguration : IEntityTypeConfiguration<Redemption>
{
    public void Configure(EntityTypeBuilder<Redemption> builder)
    {
        builder.Property(r => r.Message).HasMaxLength(500);
        builder.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(r => new { r.Status, r.ApproverId });

        builder.HasOne(r => r.IssuedCoupon).WithMany().HasForeignKey(r => r.IssuedCouponId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.Requester).WithMany().HasForeignKey(r => r.RequesterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(r => r.Approver).WithMany().HasForeignKey(r => r.ApproverId).OnDelete(DeleteBehavior.SetNull);
    }
}

public class RefreshTokenConfiguration : IEntityTypeConfiguration<RefreshToken>
{
    public void Configure(EntityTypeBuilder<RefreshToken> builder)
    {
        builder.Property(t => t.TokenHash).HasMaxLength(128);
        builder.HasIndex(t => t.TokenHash).IsUnique();
        builder.HasOne(t => t.User).WithMany().HasForeignKey(t => t.UserId).OnDelete(DeleteBehavior.Cascade);
    }
}
