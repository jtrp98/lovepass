using System.Security.Cryptography;
using System.Text.Json;
using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Gifts;

public sealed record PackOptionInput(int CouponTemplateId, int Limit);
public sealed record PackQuotaInput(string Rarity, int Quantity);
public sealed record PackOptionDto(int CouponTemplateId, int Limit, int Selected, CouponTemplateSnapshot Coupon);
public sealed record GiftPackDto(int Id, string Name, string Mode, string? Message, DateTime ExpiresAt,
    DateTime? OpenedAt, bool IsSender, int Total, List<PackQuotaInput> Quotas, List<PackOptionDto> Options, List<PackDraw> Draws, List<string> OpenedTiers);

public sealed record CreateGiftPackCommand(Guid RequestId, int ReceiverId, string Name, string Mode, DateTime ExpiresAt,
    string? Message, List<PackOptionInput> Options, List<PackQuotaInput> Quotas) : ICommand<GiftPackDto>;

public sealed class CreateGiftPackCommandValidator : AbstractValidator<CreateGiftPackCommand>
{
    public CreateGiftPackCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
        RuleFor(x => x.ReceiverId).GreaterThan(0);
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Mode).Must(m => m is "FIXED" or "CHOICE");
        RuleFor(x => x.ExpiresAt).Must(d => d > DateTime.UtcNow).WithMessage("เลือกวันหมดอายุในอนาคตนะ");
        RuleFor(x => x.Message).MaximumLength(500);
        RuleFor(x => x.Options).NotNull().Must(o => o is not null && o.Count <= 50 && o.All(i => i is not null) && o.Select(i => i.CouponTemplateId).Distinct().Count() == o.Count)
            .WithMessage("เลือกคูปองไม่ซ้ำกันได้ไม่เกิน 50 แบบ");
        RuleFor(x => x.Options).NotEmpty().When(x => x.Mode == "FIXED");
        RuleForEach(x => x.Options).NotNull().ChildRules(o =>
        {
            o.RuleFor(i => i.CouponTemplateId).GreaterThan(0);
            o.RuleFor(i => i.Limit).InclusiveBetween(1, 100);
        });
        RuleFor(x => x.Quotas).NotNull().Must(q => q is not null && q.Count <= 5 && q.All(i => i is not null) && q.Select(i => i.Rarity).Distinct().Count() == q.Count);
        RuleForEach(x => x.Quotas).NotNull().ChildRules(q =>
        {
            q.RuleFor(i => i.Rarity).Must(r => Enum.GetValues<Rarity>().Any(v => v.ToString().ToUpperInvariant() == r));
            q.RuleFor(i => i.Quantity).InclusiveBetween(1, 100);
        });
    }
}

public sealed class CreateGiftPackCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<CreateGiftPackCommand, GiftPackDto>
{
    public async Task<GiftPackDto> Handle(CreateGiftPackCommand request, CancellationToken ct)
    {
        var userId = currentUser.RequiredUserId();
        var hash = Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(request)));
        var existing = await db.GiftBatches.FirstOrDefaultAsync(b => b.PackKey == request.RequestId, ct);
        if (existing is not null)
        {
            if (existing.SenderId != userId) throw new ForbiddenAccessException();
            if (GiftPackPlan.FromJson(existing.PackPlan!).SourceHash != hash)
                throw new ConflictException("คำขอส่งซองนี้มีข้อมูลเปลี่ยนไป กรุณาเริ่มส่งซองใหม่");
            return GiftPackMapping.Map(existing, userId);
        }
        var coupleId = await db.CoupleMembers.Where(m => m.UserId == userId && m.Couple!.Status == CoupleStatus.Active
                && m.Couple.Members.Any(p => p.UserId == request.ReceiverId && p.UserId != userId))
            .Select(m => m.CoupleId).FirstOrDefaultAsync(ct);
        if (coupleId == 0) throw new ForbiddenAccessException();

        var options = request.Options;
        var ids = options.Select(o => o.CouponTemplateId).ToList();
        var automaticPool = request.Mode == "CHOICE" && options.Count == 0;
        var tiers = request.Quotas.Select(q => Enum.Parse<Rarity>(q.Rarity, true)).ToList();
        var templates = await db.CouponTemplates.Where(t => t.IsActive && (automaticPool ? tiers.Contains(t.Rarity) : ids.Contains(t.Id)))
            .OrderBy(t => t.Id).ToDictionaryAsync(t => t.Id, ct);
        if (automaticPool)
        {
            options = templates.Values.Select(t => new PackOptionInput(t.Id,
                request.Quotas.Single(q => q.Rarity == t.Rarity.ToString().ToUpperInvariant()).Quantity)).ToList();
            if (request.Quotas.Any(q => !templates.Values.Any(t => t.Rarity.ToString().ToUpperInvariant() == q.Rarity)))
                throw new ConflictException("บางระดับยังไม่มีคูปองให้รับ กรุณาเลือกระดับอื่นก่อนนะ");
        }
        else if (templates.Count != ids.Count) throw new ConflictException("มีคูปองที่ไม่พร้อมมอบแล้ว กรุณาเลือกรายการใหม่");
        var plan = new GiftPackPlan
        {
            SourceHash = hash, Name = request.Name.Trim(), Mode = request.Mode, ExpiresAt = request.ExpiresAt,
            Options = options.Select(o => new PackOption(o.CouponTemplateId, o.Limit, CouponTemplateSnapshot.Of(templates[o.CouponTemplateId]))).ToList(),
            Quotas = request.Quotas.ToDictionary(q => q.Rarity, q => q.Quantity)
        };
        if (plan.Total is < 1 or > 100 || (plan.Mode == "FIXED" && plan.Quotas.Count != 0))
            throw new ConflictException("หนึ่งซองมอบได้ 1–100 ใบ กรุณาตรวจจำนวนอีกครั้ง");
        if (plan.Mode == "CHOICE" && plan.Quotas.Any(q => plan.Options.Where(o => o.Coupon.Rarity == q.Key).Sum(o => o.Limit) < q.Value))
            throw new ConflictException("ตัวเลือกบางระดับมีไม่พอให้เลือกครบสิทธิ์ กรุณาเพิ่มตัวเลือกหรือลดจำนวนใบ");
        if (plan.Mode == "CHOICE" && plan.Options.Any(o => !plan.Quotas.ContainsKey(o.Coupon.Rarity)))
            throw new ConflictException("กำหนดจำนวนสิทธิ์ให้ครบทุกระดับที่เลือกไว้ก่อนนะ");

        var batch = new GiftBatch { SenderId = userId, ReceiverId = request.ReceiverId, CoupleId = coupleId,
            Message = request.Message, PackKey = request.RequestId, PackPlan = plan.ToJson() };
        db.GiftBatches.Add(batch);
        await db.SaveChangesAsync(ct);
        return GiftPackMapping.Map(batch, userId);
    }
}

public sealed record GetGiftPacksQuery() : IQuery<List<GiftPackDto>>;
public sealed class GetGiftPacksQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetGiftPacksQuery, List<GiftPackDto>>
{
    public async Task<List<GiftPackDto>> Handle(GetGiftPacksQuery request, CancellationToken ct)
    {
        var id = currentUser.RequiredUserId();
        // ซองผูกกับผู้ให้ — เลิกกันแล้วไม่แสดงซองของอีกฝ่าย (จับคู่ใหม่กับคนเดิมแล้วกลับมาเห็น)
        var partnerIds = await Coupons.GetMyCouponsQueryHandler.ActivePartnerIds(db, id, ct);
        var batches = await db.GiftBatches.AsNoTracking().Where(b => b.PackPlan != null
                && ((b.ReceiverId == id && partnerIds.Contains(b.SenderId)) || (b.SenderId == id && partnerIds.Contains(b.ReceiverId))))
            .OrderByDescending(b => b.CreatedAt).Take(200).ToListAsync(ct);
        return batches.Select(b => GiftPackMapping.Map(b, id)).ToList();
    }
}

public sealed record OpenGiftPackCommand(int Id) : ICommand<GiftPackDto>;
public sealed class OpenGiftPackCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<OpenGiftPackCommand, GiftPackDto>
{
    public async Task<GiftPackDto> Handle(OpenGiftPackCommand request, CancellationToken ct)
    {
        var batch = await GiftPackMapping.ForReceiver(db, currentUser.RequiredUserId(), request.Id, ct);
        var plan = GiftPackPlan.FromJson(batch.PackPlan!);
        if (plan.OpenedAt is not null) return GiftPackMapping.Map(batch, batch.ReceiverId);
        if (plan.ExpiresAt <= DateTime.UtcNow) throw new ConflictException("ซองนี้หมดอายุแล้ว ลองขอให้แฟนส่งซองใหม่ให้นะ");
        plan.OpenedAt = DateTime.UtcNow;
        if (plan.Mode == "FIXED")
            foreach (var option in plan.Options)
            {
                batch.Coupons.Add(GiftPackMapping.Issue(batch, plan, option, option.Limit));
                for (var i = 0; i < option.Limit; i++)
                    plan.Draws.Add(new PackDraw(Guid.NewGuid(), option.CouponTemplateId, option.Coupon.Rarity, false));
            }
        batch.PackPlan = plan.ToJson();
        await db.SaveChangesAsync(ct);
        return GiftPackMapping.Map(batch, batch.ReceiverId);
    }
}

public sealed record OpenGiftPackTierCommand(int Id, string Rarity) : ICommand<GiftPackDto>;
public sealed class OpenGiftPackTierCommandValidator : AbstractValidator<OpenGiftPackTierCommand>
{
    public OpenGiftPackTierCommandValidator() => RuleFor(x => x.Rarity)
        .Must(r => Enum.GetValues<Rarity>().Any(v => v.ToString().ToUpperInvariant() == r));
}
public sealed class OpenGiftPackTierCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<OpenGiftPackTierCommand, GiftPackDto>
{
    public async Task<GiftPackDto> Handle(OpenGiftPackTierCommand request, CancellationToken ct)
    {
        var batch = await GiftPackMapping.ForReceiver(db, currentUser.RequiredUserId(), request.Id, ct);
        var plan = GiftPackPlan.FromJson(batch.PackPlan!);
        if (plan.Mode != "CHOICE" || plan.OpenedAt is null || !plan.Quotas.ContainsKey(request.Rarity))
            throw new ConflictException("ไม่พบซองระดับนี้ในของขวัญ ลองเปิดการ์ดแล้วตรวจชุดของขวัญอีกครั้งนะ");
        if (plan.OpenedTiers.Contains(request.Rarity)) return GiftPackMapping.Map(batch, batch.ReceiverId);
        if (plan.ExpiresAt <= DateTime.UtcNow) throw new ConflictException("ซองนี้หมดอายุแล้ว ขอให้แฟนจัดชุดใหม่ให้นะ");
        plan.OpenedTiers.Add(request.Rarity);
        batch.PackPlan = plan.ToJson();
        await db.SaveChangesAsync(ct);
        return GiftPackMapping.Map(batch, batch.ReceiverId);
    }
}

public sealed record DrawGiftPackCommand(int Id, Guid RequestId, string Rarity, int? CouponTemplateId = null,
    int? ExpectedDrawCount = null, int Quantity = 1, List<int>? CouponTemplateIds = null) : ICommand<GiftPackDto>;
public sealed class DrawGiftPackCommandValidator : AbstractValidator<DrawGiftPackCommand>
{
    public DrawGiftPackCommandValidator()
    {
        RuleFor(x => x.RequestId).NotEmpty();
        RuleFor(x => x.Rarity).Must(r => Enum.GetValues<Rarity>().Any(v => v.ToString().ToUpperInvariant() == r));
        RuleFor(x => x.CouponTemplateId).GreaterThan(0).When(x => x.CouponTemplateId.HasValue);
        RuleFor(x => x.ExpectedDrawCount).InclusiveBetween(0, 100).When(x => x.ExpectedDrawCount.HasValue);
        RuleFor(x => x.Quantity).InclusiveBetween(1, 100);
        RuleFor(x => x.CouponTemplateIds).Must(ids => ids is null || (ids.Count is > 0 and <= 100 && ids.All(id => id > 0)));
        RuleFor(x => x).Must(x => x.CouponTemplateIds is null || (x.CouponTemplateId is null && x.CouponTemplateIds.Count == x.Quantity))
            .WithMessage("จำนวนคูปองที่เลือกต้องตรงกับจำนวนใบที่จะรับ");
    }
}
public sealed class DrawGiftPackCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<DrawGiftPackCommand, GiftPackDto>
{
    public async Task<GiftPackDto> Handle(DrawGiftPackCommand request, CancellationToken ct)
    {
        var batch = await GiftPackMapping.ForReceiver(db, currentUser.RequiredUserId(), request.Id, ct);
        var plan = GiftPackPlan.FromJson(batch.PackPlan!);
        var fingerprint = Convert.ToHexString(SHA256.HashData(JsonSerializer.SerializeToUtf8Bytes(request)));
        var prior = plan.Actions.FirstOrDefault(a => a.RequestId == request.RequestId);
        if (prior is not null)
        {
            if (prior.Fingerprint != fingerprint)
                throw new ConflictException("คำขอนี้เคยใช้เลือกคูปองอื่นแล้ว กรุณาโหลดซองอีกครั้ง");
            return GiftPackMapping.Map(batch, batch.ReceiverId);
        }
        if (plan.Draws.Any(d => d.RequestId == request.RequestId))
            throw new ConflictException("คำขอเดิมนี้บันทึกแล้ว กรุณาโหลดของขวัญล่าสุดก่อนเลือกต่อ");
        if (request.ExpectedDrawCount is not null && request.ExpectedDrawCount != plan.Draws.Count)
            throw new ConflictException("มีการรับคูปองจากซองนี้แล้ว กรุณาโหลดซองล่าสุดก่อนเลือกต่อ");
        if (!plan.OpenedTiers.Contains(request.Rarity) || plan.Remaining(request.Rarity) < request.Quantity)
            throw new ConflictException("เปิดซองระดับนี้ก่อน และเลือกจำนวนไม่เกินสิทธิ์ที่เหลือนะ");
        var random = request.CouponTemplateId is null && request.CouponTemplateIds is null;
        var chosen = request.CouponTemplateIds?.ToList() ?? [];
        if (request.CouponTemplateId is not null)
            chosen = Enumerable.Repeat(request.CouponTemplateId.Value, request.Quantity).ToList();
        if (random)
            for (var i = 0; i < request.Quantity; i++)
            {
                var available = plan.Available(request.Rarity)
                    .Where(o => plan.Draws.Count(d => d.CouponTemplateId == o.CouponTemplateId) + chosen.Count(id => id == o.CouponTemplateId) < o.Limit).ToList();
                if (available.Count == 0) throw new ConflictException("ตัวเลือกไม่พอสำหรับจำนวนนี้ ลองลดจำนวนแล้วเลือกใหม่นะ");
                chosen.Add(available[RandomNumberGenerator.GetInt32(available.Count)].CouponTemplateId);
            }
        if (!plan.TryChooseMany(request.RequestId, request.Rarity, chosen, random))
            throw new ConflictException("เลือกใบนี้ไม่ได้แล้ว กรุณาตรวจวันหมดอายุและสิทธิ์ที่เหลือ");
        foreach (var group in chosen.GroupBy(id => id))
            batch.Coupons.Add(GiftPackMapping.Issue(batch, plan, plan.Options.Single(o => o.CouponTemplateId == group.Key), group.Count()));
        plan.Actions.Add(new PackAction(request.RequestId, fingerprint));
        batch.PackPlan = plan.ToJson();
        await db.SaveChangesAsync(ct);
        return GiftPackMapping.Map(batch, batch.ReceiverId);
    }
}

internal static class GiftPackMapping
{
    public static GiftPackDto Map(GiftBatch batch, int userId)
    {
        var plan = GiftPackPlan.FromJson(batch.PackPlan!);
        var show = batch.SenderId == userId || plan.OpenedAt is not null;
        return new(batch.Id, plan.Name, plan.Mode, batch.Message, plan.ExpiresAt, plan.OpenedAt,
            batch.SenderId == userId, plan.Total, plan.Quotas.OrderBy(q => Enum.Parse<Rarity>(q.Key, true)).Select(q => new PackQuotaInput(q.Key, q.Value)).ToList(),
            show ? plan.Options.Where(o => batch.SenderId == userId || plan.Mode == "FIXED" || plan.OpenedTiers.Contains(o.Coupon.Rarity))
                .Select(o => new PackOptionDto(o.CouponTemplateId, o.Limit,
                plan.Draws.Count(d => d.CouponTemplateId == o.CouponTemplateId), o.Coupon)).ToList() : [], show ? plan.Draws : [], plan.OpenedTiers);
    }

    public static async Task<GiftBatch> ForReceiver(IApplicationDbContext db, int userId, int id, CancellationToken ct)
    {
        var batch = await db.GiftBatches.FirstOrDefaultAsync(b => b.Id == id && b.PackPlan != null, ct)
            ?? throw new NotFoundException("GiftPack", id);
        if (batch.ReceiverId != userId) throw new ForbiddenAccessException();
        if (!(await Coupons.GetMyCouponsQueryHandler.ActivePartnerIds(db, userId, ct)).Contains(batch.SenderId))
            throw new ConflictException("คุณสองคนไม่ได้จับคู่กันแล้ว ซองนี้เปิดหรือเลือกเพิ่มไม่ได้");
        return batch;
    }

    public static IssuedCoupon Issue(GiftBatch batch, GiftPackPlan plan, PackOption option, int quantity) => new()
    {
        CouponTemplateId = option.CouponTemplateId, SenderId = batch.SenderId, ReceiverId = batch.ReceiverId,
        Quantity = quantity, RemainingQuantity = quantity, ExpiresAt = plan.ExpiresAt, TemplateSnapshot = option.Coupon.ToJson()
    };
}
