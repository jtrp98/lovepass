using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Application.Common.Services;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LovePass.Application.Features.Gifts;

public sealed record GiftItemInput(int CouponTemplateId, int Quantity);

public sealed record GiftItemDto(int CouponTemplateId, string Name, string? Emoji, string Rarity, int Quantity);

public sealed record GiftDto(int GiftBatchId, string? Title, string? Message, int TotalCoupons, DateTime ExpiresAt, List<GiftItemDto> Items);

public sealed record CreateGiftCommand(
    int ReceiverId,
    DateTime ExpiresAt,
    string? Title = null,
    string? Message = null,
    List<GiftItemInput>? Items = null,
    int? CouponSetId = null) : ICommand<GiftDto>;

public sealed class CreateGiftCommandValidator : AbstractValidator<CreateGiftCommand>
{
    public CreateGiftCommandValidator()
    {
        RuleFor(x => x.ReceiverId).NotEmpty();
        RuleFor(x => x.ExpiresAt)
            .Must(expiresAt => expiresAt > DateTime.UtcNow)
            .WithMessage("วันหมดอายุต้องอยู่ในอนาคต");
        RuleFor(x => x.Title).MaximumLength(100);
        RuleFor(x => x.Message).MaximumLength(500);

        RuleFor(x => x.Items).NotEmpty()
            .When(x => x.CouponSetId is null)
            .WithMessage("ต้องเลือกคูปองอย่างน้อย 1 รายการ");
        RuleFor(x => x.Items!.Count).LessThanOrEqualTo(50)
            .When(x => x.Items is not null)
            .WithMessage("เลือกคูปองได้ไม่เกิน 50 รายการต่อครั้ง");
        RuleForEach(x => x.Items).ChildRules(item =>
        {
            item.RuleFor(i => i.CouponTemplateId).NotEmpty();
            item.RuleFor(i => i.Quantity).InclusiveBetween(1, 100);
        });
    }
}

public sealed class CreateGiftCommandHandler(
    IApplicationDbContext db,
    ICurrentUserService currentUser,
    IIdentityService identity,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    ILogger<CreateGiftCommandHandler> logger)
    : IRequestHandler<CreateGiftCommand, GiftDto>
{
    public async Task<GiftDto> Handle(CreateGiftCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();

        if (request.ReceiverId == userId)
            throw new ConflictException("ไม่สามารถมอบคูปองให้ตัวเองได้");

        // ผู้รับต้องเป็นแฟนของผู้ส่งเท่านั้น
        var coupleId = await db.CoupleMembers
            .Where(m => m.UserId == userId && m.Couple!.Status == CoupleStatus.Active
                && m.Couple.Members.Any(other => other.UserId == request.ReceiverId))
            .Select(m => m.CoupleId)
            .FirstOrDefaultAsync(cancellationToken);

        if (coupleId == 0)
            throw new ForbiddenAccessException();

        // รวมรายการ: จาก Set สำเร็จรูป หรือ custom items
        var items = request.CouponSetId is null
            ? MergeItems(request.Items ?? [])
            : await ExpandSetAsync(db, request.CouponSetId.Value, cancellationToken);

        if (items.Count == 0)
            throw new ConflictException("ไม่พบคูปองที่พร้อมมอบในรายการ");

        var templateIds = items.Select(i => i.CouponTemplateId).ToList();
        var templates = await db.CouponTemplates
            .Where(t => t.IsActive && templateIds.Contains(t.Id))
            .ToDictionaryAsync(t => t.Id, cancellationToken);

        if (templates.Count != items.Select(i => i.CouponTemplateId).Distinct().Count())
            throw new ConflictException("มีคูปองบางรายการที่ไม่พร้อมใช้งาน");

        var batch = new GiftBatch
        {
            SenderId = userId,
            ReceiverId = request.ReceiverId,
            CoupleId = coupleId,
            Title = request.Title?.Trim(),
            Message = request.Message?.Trim()
        };

        foreach (var (templateId, quantity) in items)
        {
            var template = templates[templateId];
            batch.Coupons.Add(new IssuedCoupon
            {
                CouponTemplateId = templateId,
                SenderId = userId,
                ReceiverId = request.ReceiverId,
                Quantity = quantity,
                RemainingQuantity = quantity,
                ReservedQuantity = 0,
                ExpiresAt = request.ExpiresAt,
                TemplateSnapshot = CouponTemplateSnapshot.Of(template).ToJson()
            });
        }

        db.GiftBatches.Add(batch);
        await db.SaveChangesAsync(cancellationToken);

        await TryNotifyReceiverAsync(request, batch, cancellationToken);

        return new GiftDto(
            batch.Id,
            batch.Title,
            batch.Message,
            batch.Coupons.Sum(c => c.Quantity),
            request.ExpiresAt,
            [.. batch.Coupons.Select(c =>
            {
                var snapshot = c.ReadSnapshot();
                return new GiftItemDto(c.CouponTemplateId, snapshot.Name, snapshot.Emoji, snapshot.Rarity, c.Quantity);
            })]);
    }

    private static List<GiftItemInput> MergeItems(IEnumerable<GiftItemInput> items) =>
        [.. items
            .GroupBy(i => i.CouponTemplateId)
            .Select(g => new GiftItemInput(g.Key, Math.Min(g.Sum(i => i.Quantity), 100)))];

    private static async Task<List<GiftItemInput>> ExpandSetAsync(IApplicationDbContext db, int setId, CancellationToken cancellationToken)
    {
        var setItems = await db.CouponSetItems.AsNoTracking()
            .Where(i => i.SetId == setId && i.Set!.IsActive)
            .ToListAsync(cancellationToken);

        return [.. setItems.Select(i => new GiftItemInput(i.CouponTemplateId, i.Quantity))];
    }

    private async Task TryNotifyReceiverAsync(CreateGiftCommand request, GiftBatch batch, CancellationToken cancellationToken)
    {
        try
        {
            var senderName = (await identity.GetUserAsync(currentUser.RequiredUserId(), cancellationToken)).DisplayName;
            var receiver = await identity.GetUserAsync(request.ReceiverId, cancellationToken);
            var couponItems = batch.Coupons.Select(c =>
            {
                var s = c.ReadSnapshot();
                return new CouponEmailItem(s.Name, s.Description, c.Quantity, s.Rarity, s.Emoji);
            }).ToList();
            var (subject, html) = EmailTemplates.CouponReceived(receiver.DisplayName, senderName, batch.Title, batch.Message, couponItems, request.ExpiresAt, appOptions.Value);
            await emailSender.SendEmailAsync(receiver.Email, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send gift notification email for batch {GiftBatchId}", batch.Id);
        }
    }
}

public sealed record SentGiftCouponDto(string Name, string Description, string? Emoji, string Rarity, int Quantity, int Remaining, DateTime ExpiresAt, string Category = "OTHER");

public sealed record SentGiftDto(int Id, string? Title, string? Message, DateTime CreatedAt, List<SentGiftCouponDto> Coupons);

public sealed record GetSentGiftsQuery() : IQuery<List<SentGiftDto>>;

public sealed class GetSentGiftsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser)
    : IRequestHandler<GetSentGiftsQuery, List<SentGiftDto>>
{
    public async Task<List<SentGiftDto>> Handle(GetSentGiftsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();

        var partnerIds = await Coupons.GetMyCouponsQueryHandler.ActivePartnerIds(db, userId, cancellationToken);
        var batches = await db.GiftBatches.AsNoTracking()
            .Include(b => b.Coupons)
            .Where(b => b.SenderId == userId && b.PackPlan == null && partnerIds.Contains(b.ReceiverId))
            .OrderByDescending(b => b.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        return batches.Select(b => new SentGiftDto(
            b.Id,
            b.Title,
            b.Message,
            b.CreatedAt,
            [.. b.Coupons.OrderBy(c => c.ExpiresAt).Select(c =>
            {
                var s = c.ReadSnapshot();
                return new SentGiftCouponDto(s.Name, s.Description, s.Emoji, s.Rarity, c.Quantity, c.RemainingQuantity, c.ExpiresAt, s.Category);
            })])).ToList();
    }
}

public sealed record ReceivedGiftCouponDto(string Name, string Description, string? Emoji, string Rarity, int Quantity, int Remaining, DateTime ExpiresAt, string Category = "OTHER");

public sealed record ReceivedGiftDto(int Id, string SenderName, string? Title, string? Message, DateTime CreatedAt, DateTime? OpenedAt, List<ReceivedGiftCouponDto> Coupons);

public sealed record GetReceivedGiftsQuery() : IQuery<List<ReceivedGiftDto>>;

public sealed class GetReceivedGiftsQueryHandler(IApplicationDbContext db, ICurrentUserService currentUser, IIdentityService identity)
    : IRequestHandler<GetReceivedGiftsQuery, List<ReceivedGiftDto>>
{
    public async Task<List<ReceivedGiftDto>> Handle(GetReceivedGiftsQuery request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var partnerIds = await Coupons.GetMyCouponsQueryHandler.ActivePartnerIds(db, userId, cancellationToken);
        var batches = await db.GiftBatches.AsNoTracking()
            .Include(b => b.Coupons)
            .Where(b => b.ReceiverId == userId && b.PackPlan == null && partnerIds.Contains(b.SenderId))
            .OrderByDescending(b => b.CreatedAt)
            .Take(200)
            .ToListAsync(cancellationToken);

        var senderIds = batches.Select(b => b.SenderId).Distinct().ToList();
        var senderNames = new Dictionary<int, string>();
        foreach (var senderId in senderIds)
        {
            var user = await identity.GetUserAsync(senderId, cancellationToken);
            senderNames[senderId] = user.DisplayName;
        }

        return batches.Select(b => new ReceivedGiftDto(
            b.Id,
            senderNames.GetValueOrDefault(b.SenderId, "แฟนของคุณ"),
            b.Title,
            b.Message,
            b.CreatedAt,
            b.OpenedAt,
            [.. b.Coupons.OrderBy(c => c.ExpiresAt).Select(c =>
            {
                var s = c.ReadSnapshot();
                return new ReceivedGiftCouponDto(s.Name, s.Description, s.Emoji, s.Rarity, c.Quantity, c.RemainingQuantity, c.ExpiresAt, s.Category);
            })])).ToList();
    }
}

public sealed record OpenGiftBatchCommand(int Id) : ICommand<ReceivedGiftDto>;

public sealed class OpenGiftBatchCommandHandler(IApplicationDbContext db, ICurrentUserService currentUser, IIdentityService identity)
    : IRequestHandler<OpenGiftBatchCommand, ReceivedGiftDto>
{
    public async Task<ReceivedGiftDto> Handle(OpenGiftBatchCommand request, CancellationToken cancellationToken)
    {
        var userId = currentUser.RequiredUserId();
        var batch = await db.GiftBatches
            .Include(b => b.Coupons)
            .FirstOrDefaultAsync(b => b.Id == request.Id && b.ReceiverId == userId && b.PackPlan == null, cancellationToken)
            ?? throw new NotFoundException("GiftBatch", request.Id);

        var partnerIds = await Coupons.GetMyCouponsQueryHandler.ActivePartnerIds(db, userId, cancellationToken);
        if (!partnerIds.Contains(batch.SenderId))
            throw new ConflictException("คุณสองคนไม่ได้จับคู่กันแล้ว ไม่สามารถเปิดของขวัญนี้ได้");

        if (batch.OpenedAt is null)
        {
            batch.OpenedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(cancellationToken);
        }

        var sender = await identity.GetUserAsync(batch.SenderId, cancellationToken);
        return new ReceivedGiftDto(
            batch.Id,
            sender.DisplayName,
            batch.Title,
            batch.Message,
            batch.CreatedAt,
            batch.OpenedAt,
            [.. batch.Coupons.OrderBy(c => c.ExpiresAt).Select(c =>
            {
                var s = c.ReadSnapshot();
                return new ReceivedGiftCouponDto(s.Name, s.Description, s.Emoji, s.Rarity, c.Quantity, c.RemainingQuantity, c.ExpiresAt, s.Category);
            })]);
    }
}
