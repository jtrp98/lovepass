namespace LovePass.Application.Common.Models;

public sealed class AppOptions
{
    public const string SectionName = "App";

    public string FrontendUrl { get; set; } = "http://localhost:3000";
}
