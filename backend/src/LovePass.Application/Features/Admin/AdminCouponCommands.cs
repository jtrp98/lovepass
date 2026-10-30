using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace LovePass.Application.Features.Admin;

public sealed record AdminCouponTemplateDto(
    int Id, string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl, bool IsActive, DateTime CreatedAt, DateTime? UpdatedAt, string Category = "OTHER",
    string Effect = "NONE", bool MetaLocked = false);

public sealed record CreateCouponTemplateCommand(
    string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl, string Category = "OTHER",
    string Effect = "NONE", bool MetaLocked = false) : ICommand<AdminCouponTemplateDto>;

public static class CouponTemplateValidationRules
{
    public static IRuleBuilderOptions<T, string> ValidCategory<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(value => Enum.GetNames<CouponCategory>().Contains(value, StringComparer.OrdinalIgnoreCase))
            .WithMessage("กรุณาเลือกหมวดหมู่คูปองที่มีในรายการ");

    public static IRuleBuilderOptions<T, string> ValidRarity<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().Must(r => Enum.TryParse<Rarity>(r, ignoreCase: true, out _))
            .WithMessage("Rarity ต้องเป็น COMMON, RARE, EPIC, LEGENDARY หรือ MYTHIC");

    public static IRuleBuilderOptions<T, string> ValidEffect<T>(this IRuleBuilder<T, string> rule) =>
        rule.Must(value => Enum.GetNames<CouponEffect>().Contains(value, StringComparer.OrdinalIgnoreCase))
            .WithMessage("กรุณาเลือกพลังพิเศษที่มีในรายการ หรือ NONE สำหรับคูปองปกติ");
}

public sealed class CreateCouponTemplateCommandValidator : AbstractValidator<CreateCouponTemplateCommand>
{
    public CreateCouponTemplateCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Terms).MaximumLength(1000);
        RuleFor(x => x.Rarity).ValidRarity();
        RuleFor(x => x.Category).ValidCategory();
        RuleFor(x => x.Effect).ValidEffect();
        RuleFor(x => x.Emoji).MaximumLength(16);
    }
}

public sealed class CreateCouponTemplateCommandHandler(IApplicationDbContext db)
    : IRequestHandler<CreateCouponTemplateCommand, AdminCouponTemplateDto>
{
    public async Task<AdminCouponTemplateDto> Handle(CreateCouponTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = new CouponTemplate
        {
            Name = request.Name.Trim(),
            Description = request.Description?.Trim() ?? string.Empty,
            Terms = request.Terms?.Trim() ?? string.Empty,
            Rarity = ParseRarity(request.Rarity),
            Category = ParseCategory(request.Category),
            Effect = ParseEffect(request.Effect),
            MetaLocked = request.MetaLocked,
            Emoji = request.Emoji,
            ImageUrl = request.ImageUrl,
            IsActive = true
        };

        db.CouponTemplates.Add(template);
        await db.SaveChangesAsync(cancellationToken);
        return Map(template);
    }

    internal static Rarity ParseRarity(string rarity) =>
        Enum.TryParse<Rarity>(rarity, ignoreCase: true, out var parsed) ? parsed
            : throw new ConflictException("Rarity ไม่ถูกต้อง");

    internal static CouponCategory ParseCategory(string category) =>
        Enum.GetNames<CouponCategory>().Contains(category, StringComparer.OrdinalIgnoreCase)
            ? Enum.Parse<CouponCategory>(category, ignoreCase: true)
            : throw new ConflictException("หมวดหมู่คูปองไม่ถูกต้อง");

    internal static CouponEffect ParseEffect(string effect) =>
        Enum.GetNames<CouponEffect>().Contains(effect, StringComparer.OrdinalIgnoreCase)
            ? Enum.Parse<CouponEffect>(effect, ignoreCase: true)
            : throw new ConflictException("พลังพิเศษไม่ถูกต้อง");

    internal static AdminCouponTemplateDto Map(CouponTemplate t) => new(
        t.Id, t.Name, t.Description, t.Terms,
        t.Rarity.ToString().ToUpperInvariant(), t.Emoji, t.ImageUrl, t.IsActive, t.CreatedAt, t.UpdatedAt, t.Category.ToString().ToUpperInvariant(),
        t.Effect.ToString().ToUpperInvariant(), t.MetaLocked);
}

/// <summary>Category, Effect และ MetaLocked ที่เป็น null คงค่าเดิม เพื่อให้ client รุ่นเก่าไม่ลบการตั้งค่าโดยไม่ตั้งใจ</summary>
public sealed record UpdateCouponTemplateCommand(
    int Id, string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl, bool IsActive, string? Category = null,
    string? Effect = null, bool? MetaLocked = null)
    : ICommand<AdminCouponTemplateDto>;

public sealed class UpdateCouponTemplateCommandValidator : AbstractValidator<UpdateCouponTemplateCommand>
{
    public UpdateCouponTemplateCommandValidator()
    {
        RuleFor(x => x.Id).NotEmpty();
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Terms).MaximumLength(1000);
        RuleFor(x => x.Rarity).ValidRarity();
        RuleFor(x => x.Category!).ValidCategory().When(x => x.Category is not null);
        RuleFor(x => x.Effect!).ValidEffect().When(x => x.Effect is not null);
        RuleFor(x => x.Emoji).MaximumLength(16);
    }
}

public sealed class UpdateCouponTemplateCommandHandler(IApplicationDbContext db)
    : IRequestHandler<UpdateCouponTemplateCommand, AdminCouponTemplateDto>
{
    public async Task<AdminCouponTemplateDto> Handle(UpdateCouponTemplateCommand request, CancellationToken cancellationToken)
    {
        var template = await db.CouponTemplates
            .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken)
            ?? throw new NotFoundException(nameof(CouponTemplate), request.Id);

        template.Name = request.Name.Trim();
        template.Description = request.Description?.Trim() ?? string.Empty;
        template.Terms = request.Terms?.Trim() ?? string.Empty;
        template.Rarity = CreateCouponTemplateCommandHandler.ParseRarity(request.Rarity);
        if (request.Category is not null)
            template.Category = CreateCouponTemplateCommandHandler.ParseCategory(request.Category);
        if (request.Effect is not null)
            template.Effect = CreateCouponTemplateCommandHandler.ParseEffect(request.Effect);
        if (request.MetaLocked is not null)
            template.MetaLocked = request.MetaLocked.Value;
        template.Emoji = request.Emoji;
        template.ImageUrl = request.ImageUrl;
        template.IsActive = request.IsActive;
        template.UpdatedAt = DateTime.UtcNow;

        await db.SaveChangesAsync(cancellationToken);
        return CreateCouponTemplateCommandHandler.Map(template);
    }
}

public sealed record GetAdminCouponTemplatesQuery() : IQuery<List<AdminCouponTemplateDto>>;

public sealed class GetAdminCouponTemplatesQueryHandler(IApplicationDbContext db)
    : IRequestHandler<GetAdminCouponTemplatesQuery, List<AdminCouponTemplateDto>>
{
    public async Task<List<AdminCouponTemplateDto>> Handle(GetAdminCouponTemplatesQuery request, CancellationToken cancellationToken)
    {
        var templates = await db.CouponTemplates.AsNoTracking()
            .OrderByDescending(t => t.CreatedAt)
            .ToListAsync(cancellationToken);

        return [.. templates.Select(CreateCouponTemplateCommandHandler.Map)];
    }
}
