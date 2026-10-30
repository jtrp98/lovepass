using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Catalog;

public sealed record CouponTemplateDto(int Id, string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl, string Category = "OTHER", string Effect = "NONE");

public sealed record CouponSetItemDto(int CouponTemplateId, string Name, string? Emoji, string Rarity, int Quantity);

public sealed record CouponSetDto(int Id, string Name, string Description, List<CouponSetItemDto> Items)
{
    public int TotalCoupons => Items.Sum(i => i.Quantity);
}

public sealed record GetCouponTemplatesQuery(string? Rarity = null) : IQuery<List<CouponTemplateDto>>;

public sealed class GetCouponTemplatesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCouponTemplatesQuery, List<CouponTemplateDto>>
{
    public async Task<List<CouponTemplateDto>> Handle(GetCouponTemplatesQuery request, CancellationToken cancellationToken)
    {
        var query = db.CouponTemplates.AsNoTracking().Where(t => t.IsActive);

        if (!string.IsNullOrWhiteSpace(request.Rarity) && Enum.TryParse<Rarity>(request.Rarity, ignoreCase: true, out var rarity))
            query = query.Where(t => t.Rarity == rarity);

        return await query
            .OrderBy(t => t.Name)
            .Select(t => new CouponTemplateDto(t.Id, t.Name, t.Description, t.Terms, t.Rarity.ToString().ToUpperInvariant(), t.Emoji, t.ImageUrl, t.Category.ToString().ToUpperInvariant(), t.Effect.ToString().ToUpperInvariant()))
            .ToListAsync(cancellationToken);
    }
}

public sealed record GetCouponTemplateQuery(int Id) : IQuery<CouponTemplateDto>;

public sealed class GetCouponTemplateQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCouponTemplateQuery, CouponTemplateDto>
{
    public async Task<CouponTemplateDto> Handle(GetCouponTemplateQuery request, CancellationToken cancellationToken)
    {
        var template = await db.CouponTemplates.AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == request.Id && t.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(CouponTemplate), request.Id);

        return new CouponTemplateDto(template.Id, template.Name, template.Description, template.Terms,
            template.Rarity.ToString().ToUpperInvariant(), template.Emoji, template.ImageUrl, template.Category.ToString().ToUpperInvariant(), template.Effect.ToString().ToUpperInvariant());
    }
}

public sealed record GetCouponSetsQuery() : IQuery<List<CouponSetDto>>;

public sealed class GetCouponSetsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCouponSetsQuery, List<CouponSetDto>>
{
    public async Task<List<CouponSetDto>> Handle(GetCouponSetsQuery request, CancellationToken cancellationToken)
    {
        var sets = await db.CouponSets.AsNoTracking()
            .Include(s => s.Items).ThenInclude(i => i.Template)
            .Where(s => s.IsActive)
            .OrderBy(s => s.Name)
            .ToListAsync(cancellationToken);

        return sets.Select(s => s.ToDto()).ToList();
    }
}

public sealed record GetCouponSetQuery(int Id) : IQuery<CouponSetDto>;

public sealed class GetCouponSetQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetCouponSetQuery, CouponSetDto>
{
    public async Task<CouponSetDto> Handle(GetCouponSetQuery request, CancellationToken cancellationToken)
    {
        var set = await db.CouponSets.AsNoTracking()
            .Include(s => s.Items).ThenInclude(i => i.Template)
            .FirstOrDefaultAsync(s => s.Id == request.Id && s.IsActive, cancellationToken)
            ?? throw new NotFoundException(nameof(CouponSet), request.Id);

        return set.ToDto();
    }
}

file static class CouponSetMapper
{
    public static CouponSetDto ToDto(this CouponSet set) => new(
        set.Id,
        set.Name,
        set.Description,
        [.. set.Items
            .OrderBy(i => i.Id)
            .Select(i => new CouponSetItemDto(
                i.CouponTemplateId,
                i.Template?.Name ?? "(คูปองถูกลบ)",
                i.Template?.Emoji,
                (i.Template?.Rarity ?? Rarity.Common).ToString().ToUpperInvariant(),
                i.Quantity))]);
}
