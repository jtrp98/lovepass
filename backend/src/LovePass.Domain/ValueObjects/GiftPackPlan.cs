using System.Text.Json;

namespace LovePass.Domain.ValueObjects;

public sealed record PackOption(int CouponTemplateId, int Limit, CouponTemplateSnapshot Coupon);
public sealed record PackDraw(Guid RequestId, int CouponTemplateId, string Rarity, bool Random);
public sealed record PackAction(Guid RequestId, string Fingerprint);

/// <summary>เงื่อนไขถูกตรึงตอนส่ง การเลือกหนึ่งครั้งใช้สิทธิ์ทันทีและย้อนสุ่มไม่ได้</summary>
public sealed class GiftPackPlan
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
    public string Name { get; set; } = "";
    public string SourceHash { get; set; } = "";
    public string Mode { get; set; } = "CHOICE";
    public DateTime ExpiresAt { get; set; }
    public DateTime? OpenedAt { get; set; }
    public List<string> OpenedTiers { get; set; } = [];
    public List<PackOption> Options { get; set; } = [];
    public Dictionary<string, int> Quotas { get; set; } = [];
    public List<PackDraw> Draws { get; set; } = [];
    public List<PackAction> Actions { get; set; } = [];

    public int Total => Mode == "FIXED" ? Options.Sum(o => o.Limit) : Quotas.Values.Sum();
    public int Remaining(string rarity) => Quotas.GetValueOrDefault(rarity) - Draws.Count(d => d.Rarity == rarity);
    public List<PackOption> Available(string rarity) => Remaining(rarity) <= 0 ? [] :
        Options.Where(o => o.Coupon.Rarity == rarity && Draws.Count(d => d.CouponTemplateId == o.CouponTemplateId) < o.Limit).ToList();

    public bool TryChoose(Guid requestId, string rarity, int templateId, bool random)
        => TryChooseMany(requestId, rarity, [templateId], random);

    public bool TryChooseMany(Guid requestId, string rarity, IReadOnlyList<int> templateIds, bool random)
    {
        if (Mode != "CHOICE" || OpenedAt is null || !OpenedTiers.Contains(rarity) || ExpiresAt <= DateTime.UtcNow
            || requestId == Guid.Empty || Draws.Any(d => d.RequestId == requestId)) return false;
        if (templateIds.Count is < 1 or > 100 || Remaining(rarity) < templateIds.Count) return false;
        foreach (var group in templateIds.GroupBy(id => id))
        {
            var option = Options.FirstOrDefault(o => o.CouponTemplateId == group.Key && o.Coupon.Rarity == rarity);
            if (option is null || Draws.Count(d => d.CouponTemplateId == group.Key) + group.Count() > option.Limit) return false;
        }
        Draws.AddRange(templateIds.Select(id => new PackDraw(requestId, id, rarity, random)));
        return true;
    }

    public string ToJson() => JsonSerializer.Serialize(this, JsonOptions);
    public static GiftPackPlan FromJson(string json) => JsonSerializer.Deserialize<GiftPackPlan>(json, JsonOptions)
        ?? throw new InvalidOperationException("Invalid gift pack");
}
