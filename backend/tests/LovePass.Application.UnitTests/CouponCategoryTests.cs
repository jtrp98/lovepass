using LovePass.Application.Features.Admin;
using LovePass.Domain.Entities;
using LovePass.Domain.Enums;
using LovePass.Domain.ValueObjects;

namespace LovePass.Application.UnitTests;

public class CouponCategoryTests
{
    [Fact]
    public void LegacySnapshotDefaultsToOther()
    {
        var snapshot = CouponTemplateSnapshot.FromJson("""{"name":"เดิม","description":"","terms":"","rarity":"COMMON","emoji":null,"imageUrl":null}""");
        Assert.Equal("OTHER", snapshot.Category);
    }

    [Fact]
    public void IssuedCategorySurvivesTemplateEdits()
    {
        var template = new CouponTemplate { Name = "ชื่ออะไรก็ได้", Category = CouponCategory.Wish };
        var saved = CouponTemplateSnapshot.Of(template).ToJson();
        template.Category = CouponCategory.Food;
        Assert.Equal("WISH", CouponTemplateSnapshot.FromJson(saved).Category);
        Assert.Equal("FOOD", CouponTemplateSnapshot.Of(template).Category);
    }

    [Theory]
    [InlineData("AFFECTION")]
    [InlineData("TOGETHER")]
    [InlineData("FOOD")]
    [InlineData("CARE")]
    [InlineData("WISH")]
    [InlineData("ADVENTURE")]
    [InlineData("OTHER")]
    [InlineData("wish")]
    public void CreateAndUpdateAcceptNamedCategories(string category)
    {
        Assert.True(new CreateCouponTemplateCommandValidator().Validate(new CreateCouponTemplateCommand("ชื่อ", "", "", "COMMON", null, null, category)).IsValid);
        Assert.True(new UpdateCouponTemplateCommandValidator().Validate(new UpdateCouponTemplateCommand(1, "ชื่อ", "", "", "EPIC", null, null, true, category)).IsValid);
    }

    [Theory]
    [InlineData("0")]
    [InlineData("999")]
    [InlineData("WISH,FOOD")]
    [InlineData("../../external.svg")]
    [InlineData("")]
    [InlineData(null)]
    public void RejectsUnrecognizedCategories(string? category)
    {
        Assert.False(new CreateCouponTemplateCommandValidator().Validate(new CreateCouponTemplateCommand("ชื่อ", "", "", "COMMON", null, null, category!)).IsValid);
        if (category is not null)
            Assert.False(new UpdateCouponTemplateCommandValidator().Validate(new UpdateCouponTemplateCommand(1, "ชื่อ", "", "", "COMMON", null, null, true, category)).IsValid);
    }

    [Fact]
    public void LegacyUpdateCanOmitCategory()
    {
        var command = new UpdateCouponTemplateCommand(1, "ชื่อ", "", "", "COMMON", null, null, true);
        Assert.Null(command.Category);
        Assert.True(new UpdateCouponTemplateCommandValidator().Validate(command).IsValid);
    }
}
