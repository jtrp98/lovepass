namespace LovePass.Application.Common.Models;

public sealed record TokenPair(string AccessToken, string RefreshToken, int ExpiresInSeconds);
