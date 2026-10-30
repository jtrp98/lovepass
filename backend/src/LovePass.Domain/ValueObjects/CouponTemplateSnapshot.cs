using System.Text.Json;
using LovePass.Domain.Entities;

namespace LovePass.Domain.ValueObjects;

/// <summary>
/// สำเนารายละเอียดคูปอง ณ วันที่มอบ — แก้ไข Template ภายหลังไม่กระทบคูปองที่ออกไปแล้ว
/// </summary>
public sealed record CouponTemplateSnapshot(
    string Name,
    string Description,
    string Terms,
    string Rarity,
    string? Emoji,
    string? ImageUrl,
    string Category = "OTHER",
    string Effect = "NONE",
    bool MetaLocked = false)
{
    private static readonly JsonSerializerOptions Options = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public string ToJson() => JsonSerializer.Serialize(this, Options);

    public static CouponTemplateSnapshot FromJson(string json) =>
        JsonSerializer.Deserialize<CouponTemplateSnapshot>(json, Options) ?? throw new InvalidOperationException("Invalid template snapshot");

    public static CouponTemplateSnapshot Of(CouponTemplate template) => new(
        template.Name,
        template.Description,
        template.Terms,
        template.Rarity.ToString().ToUpperInvariant(),
        template.Emoji,
        template.ImageUrl,
        template.Category.ToString().ToUpperInvariant(),
        template.Effect.ToString().ToUpperInvariant(),
        template.MetaLocked);
}
