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
    int Id, string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl, bool IsActive, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreateCouponTemplateCommand(
    string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl) : ICommand<AdminCouponTemplateDto>;

public static class CouponTemplateValidationRules
{
    public static IRuleBuilderOptions<T, string> ValidRarity<T>(this IRuleBuilder<T, string> rule) =>
        rule.NotEmpty().Must(r => Enum.TryParse<Rarity>(r, ignoreCase: true, out _))
            .WithMessage("Rarity ต้องเป็น COMMON, RARE, EPIC หรือ LEGENDARY");
}

public sealed class CreateCouponTemplateCommandValidator : AbstractValidator<CreateCouponTemplateCommand>
{
    public CreateCouponTemplateCommandValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
        RuleFor(x => x.Description).MaximumLength(500);
        RuleFor(x => x.Terms).MaximumLength(1000);
        RuleFor(x => x.Rarity).ValidRarity();
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

    internal static AdminCouponTemplateDto Map(CouponTemplate t) => new(
        t.Id, t.Name, t.Description, t.Terms,
        t.Rarity.ToString().ToUpperInvariant(), t.Emoji, t.ImageUrl, t.IsActive, t.CreatedAt, t.UpdatedAt);
}

public sealed record UpdateCouponTemplateCommand(
    int Id, string Name, string Description, string Terms, string Rarity, string? Emoji, string? ImageUrl, bool IsActive)
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
