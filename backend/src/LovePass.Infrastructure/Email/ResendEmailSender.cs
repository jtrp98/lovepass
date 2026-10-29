using System.Net.Http.Headers;
using System.Net.Http.Json;
using LovePass.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LovePass.Infrastructure.Email;

/// <summary>ส่งอีเมลผ่าน Resend HTTP API — ถ้าไม่ได้ตั้ง ApiKey จะข้ามและ log แทน (สำหรับ dev)</summary>
public sealed class ResendEmailSender(HttpClient httpClient, IOptions<ResendOptions> options, ILogger<ResendEmailSender> logger) : IEmailSender
{
    private readonly ResendOptions _options = options.Value;

    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            logger.LogInformation("[EMAIL SKIPPED — no Resend API key] to={To} subject={Subject}", to, subject);
            return;
        }

        httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", _options.ApiKey);

        var response = await httpClient.PostAsJsonAsync("emails", new
        {
            from = _options.FromEmail,
            to = new[] { to },
            subject,
            html = htmlBody
        }, cancellationToken);

        if (!response.IsSuccessStatusCode)
        {
            var body = await response.Content.ReadAsStringAsync(cancellationToken);
            throw new HttpRequestException($"Resend failed ({(int)response.StatusCode}): {body}");
        }
    }
}
