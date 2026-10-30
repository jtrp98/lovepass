using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using LovePass.Application.Common.Interfaces;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;

namespace LovePass.Infrastructure.Email;

public sealed class GmailApiEmailSender(
    HttpClient httpClient, IOptions<GmailOptions> options, ILogger<GmailApiEmailSender> logger) : IEmailSender
{
    public async Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(to);
        if (to.IndexOfAny(['\r', '\n']) >= 0 || subject.IndexOfAny(['\r', '\n']) >= 0)
            throw new ArgumentException("Email headers cannot contain line breaks.");

        var settings = options.Value;
        using var message = new MimeMessage();
        message.From.Add(new MailboxAddress("LOVE PASS", settings.SenderEmail));
        message.To.Add(MailboxAddress.Parse(to));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = htmlBody };

        using var stream = new MemoryStream();
        await message.WriteToAsync(stream, cancellationToken);
        var raw = Convert.ToBase64String(stream.ToArray()).TrimEnd('=').Replace('+', '-').Replace('/', '_');

        // shortcut: refresh per email; cache access tokens if notification volume grows.
        using var tokenResponse = await httpClient.PostAsync("https://oauth2.googleapis.com/token",
            new FormUrlEncodedContent(new Dictionary<string, string>
            {
                ["client_id"] = settings.ClientId,
                ["client_secret"] = settings.ClientSecret,
                ["refresh_token"] = settings.RefreshToken,
                ["grant_type"] = "refresh_token"
            }), cancellationToken);
        if (!tokenResponse.IsSuccessStatusCode)
            throw new HttpRequestException("Gmail authorization failed. Reconnect with scripts/setup-gmail.mjs.",
                null, tokenResponse.StatusCode);

        using var token = JsonDocument.Parse(await tokenResponse.Content.ReadAsStringAsync(cancellationToken));
        var accessToken = token.RootElement.GetProperty("access_token").GetString();
        if (string.IsNullOrWhiteSpace(accessToken))
            throw new HttpRequestException("Google did not return an access token.");

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://gmail.googleapis.com/gmail/v1/users/me/messages/send");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", accessToken);
        request.Content = JsonContent.Create(new { raw });
        using var response = await httpClient.SendAsync(request, cancellationToken);
        if (!response.IsSuccessStatusCode)
            throw new HttpRequestException("Gmail could not send the notification email.", null, response.StatusCode);

        using var result = JsonDocument.Parse(await response.Content.ReadAsStringAsync(cancellationToken));
        var messageId = result.RootElement.GetProperty("id").GetString();
        if (string.IsNullOrWhiteSpace(messageId))
            throw new HttpRequestException("Gmail did not return a message ID.");
        logger.LogInformation("Gmail accepted notification email {MessageId}", messageId);
    }
}
