using FluentValidation;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Admin;

public sealed record AdminSetItemInput(int CouponTemplateId, int Quantity);

public sealed record AdminCouponSetDto(int Id, string Name, string Description, bool IsActive, List<AdminSetItemDto> Items, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record AdminSetItemDto(int CouponTemplateId, string TemplateName, int Quantity);

public sealed record CreateCouponSetCommand(string Name, string Description, List<AdminSetItemInput> Items) : ICommand<AdminCouponSetDto>;

public sealed class SetItemsValidator : AbstractValidator<List<AdminSetItemInput>>
{
    public SetItemsValidator()
    {
        RuleFor(items => items).NotEmpty().WithMessage("Set ต้องมีคูปองอย่างน้อย 1 รายการ");
        RuleForEach(items => items).ChildRules(item =>
        {
            item.RuleFor(i => i.CouponTemplateId).NotEmpty();
            item.RuleFor(i => i.Quantity).InclusiveBetween(1, 100);
        });
    }
}

public sealed class CreateCouponSetCommandValidator : AbstractValidator<CreateCouponSetCommand>
{
    public CreateCouponSetCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Items).SetValidator(new SetItemsValidator());
    }
}

public sealed class CreateCouponSetCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateCouponSetCommand, AdminCouponSetDto>
{
    public async Task<AdminCouponSetDto> Handle(CreateCouponSetCommand request, CancellationToken cancellationToken)
    {
        await EnsureTemplatesExistAsync(db, request.Items.Select(i => i.CouponTemplateId), cancellationToken);

        var set = new CouponSet
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            IsActive = true
        };

        foreach (var item in request.Items)
            set.Items.Add(new CouponSetItem { CouponTemplateId = item.CouponTemplateId, Quantity = item.Quantity });

        db.CouponSets.Add(set);
        await db.SaveChangesAsync(cancellationToken);
        return Map(set);
    }

    internal static async Task EnsureTemplatesExistAsync(IApplicationDbContext db, IEnumerable<int> templateIds, CancellationToken cancellationToken)
    {
        var required = templateIds.Distinct().ToList();
        var existing = await db.CouponTemplates
            .Where(t => required.Contains(t.Id))
            .Select(t => t.Id)
            .ToListAsync(cancellationToken);

        if (existing.Count != required.Count)
            throw new ConflictException("มี Coupon Template บางรายการที่ไม่มีในระบบ");
    }

    internal static AdminCouponSetDto Map(CouponSet set) => new(
        set.Id,
        set.Name,
        set.Description,
        set.IsActive,
        [.. set.Items.OrderBy(i => i.Id).Select(i => new AdminSetItemDto(i.CouponTemplateId, i.Template?.Name ?? "(ลบแล้ว)", i.Quantity))],
        set.CreatedAt,
        set.UpdatedAt);
}

public sealed record UpdateCouponSetCommand(int Id, string Name, string Description, List<AdminSetItemInput> Items, bool IsActive) : ICommand<AdminCouponSetDto>;

public sealed class UpdateCouponSetCommandValidator : AbstractValidator<UpdateCouponSetCommand>
{
    public UpdateCouponSetCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Items).SetValidator(new SetItemsValidator());
    }
}

public sealed class UpdateCouponSetCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCouponSetCommand, AdminCouponSetDto>
{
    public async Task<AdminCouponSetDto> Handle(UpdateCouponSetCommand request, CancellationToken cancellationToken)
    {
        var set = await db.CouponSets
            .Include(s => s.Items)
            .FirstOrDefaultAsync(s => s.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CouponSet), request.Id);

        await CreateCouponSetCommandHandler.EnsureTemplatesExistAsync(db, request.Items.Select(i => i.CouponTemplateId), cancellationToken);

        set.Name = request.Name.Trim();
        set.Description = request.Description?.Trim() ?? string.Empty;
        set.IsActive = request.IsActive;
        set.UpdatedAt = DateTime.UtcNow;
        set.Items.Clear();
        foreach (var item in request.Items)
            set.Items.Add(new CouponSetItem { CouponTemplateId = item.CouponTemplateId, Quantity = item.Quantity });

        await db.SaveChangesAsync(cancellationToken);

        var loaded = await db.CouponSets.AsNoTracking()
            .Include(s => s.Items).ThenInclude(i => i.Template)
            .FirstAsync(s => s.Id == set.Id, cancellationToken);
        return CreateCouponSetCommandHandler.Map(loaded);
    }
}

public sealed record GetAdminCouponSetsQuery() : IQuery<List<AdminCouponSetDto>>;

public sealed class GetAdminCouponSetsQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminCouponSetsQuery, List<AdminCouponSetDto>>
{
    public async Task<List<AdminCouponSetDto>> Handle(GetAdminCouponSetsQuery request, CancellationToken cancellationToken)
    {
        var sets = await db.CouponSets.AsNoTracking()
            .Include(s => s.Items).ThenInclude(i => i.Template)
            .OrderByDescending(s => s.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. sets.Select(CreateCouponSetCommandHandler.Map)];
    }
}
