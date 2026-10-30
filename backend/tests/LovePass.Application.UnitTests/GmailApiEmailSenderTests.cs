using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using LovePass.Application.Common.Interfaces;
using LovePass.Infrastructure;
using LovePass.Infrastructure.Email;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using MimeKit;

namespace LovePass.Application.UnitTests;

public class GmailApiEmailSenderTests
{
    [Fact]
    public async Task RefreshesCredentialsAndSendsThaiMimeMessageToAnotherRecipient()
    {
        const string subject = "คุณได้รับคูปองรัก 💝 ";
        const string html = "<h2>ภูมิมอบคูปองให้มิ้นท์ 💝</h2><p>เปิดคลังคูปองของฉัน</p>";
        var longSubject = string.Concat(Enumerable.Repeat(subject, 20)).TrimEnd();
        var calls = 0;
        using var client = new HttpClient(new Handler(async request =>
        {
            calls++;
            if (calls == 1)
            {
                Assert.Equal("https://oauth2.googleapis.com/token", request.RequestUri!.AbsoluteUri);
                Assert.Equal(HttpMethod.Post, request.Method);
                Assert.Null(request.Headers.Authorization);
                var form = await request.Content!.ReadAsStringAsync();
                Assert.Contains("client_id=client-id", form);
                Assert.Contains("client_secret=client-secret", form);
                Assert.Contains("refresh_token=refresh-token", form);
                Assert.Contains("grant_type=refresh_token", form);
                return Json(HttpStatusCode.OK, new { access_token = "access-token" });
            }

            Assert.Equal("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", request.RequestUri!.AbsoluteUri);
            Assert.Equal("Bearer", request.Headers.Authorization!.Scheme);
            Assert.Equal("access-token", request.Headers.Authorization.Parameter);
            var json = await request.Content!.ReadFromJsonAsync<JsonElement>();
            var raw = json.GetProperty("raw").GetString()!;
            Assert.DoesNotContain("=", raw);
            Assert.DoesNotContain("+", raw);
            Assert.DoesNotContain("/", raw);
            var base64 = raw.Replace('-', '+').Replace('_', '/');
            base64 = base64.PadRight((base64.Length + 3) / 4 * 4, '=');
            using var bytes = new MemoryStream(Convert.FromBase64String(base64));
            using var message = MimeMessage.Load(bytes);
            Assert.Equal("sender@gmail.com", Assert.Single(message.From.Mailboxes).Address);
            Assert.Equal("LOVE PASS", Assert.Single(message.From.Mailboxes).Name);
            Assert.Equal("partner@example.com", Assert.Single(message.To.Mailboxes).Address);
            Assert.Equal(longSubject, message.Subject);
            Assert.Equal(html, message.HtmlBody?.TrimEnd('\r', '\n'));
            Assert.Empty(message.Bcc);
            Assert.DoesNotContain("refresh-token", Encoding.UTF8.GetString(bytes.ToArray()));
            return Json(HttpStatusCode.OK, new { id = "gmail-message-id" });
        }));

        await Sender(client).SendEmailAsync("partner@example.com", longSubject, html);
        Assert.Equal(2, calls);
    }

    [Fact]
    public async Task RevokedRefreshTokenDoesNotSendOrExposeGoogleResponse()
    {
        var calls = 0;
        using var client = new HttpClient(new Handler(_ =>
        {
            calls++;
            return Task.FromResult(Json(HttpStatusCode.BadRequest, new { error = "invalid_grant", secret = "sensitive-provider-data" }));
        }));
        var error = await Assert.ThrowsAsync<HttpRequestException>(() => Sender(client).SendEmailAsync("partner@example.com", "test", "<p>test</p>"));
        Assert.Equal(HttpStatusCode.BadRequest, error.StatusCode);
        Assert.Contains("Reconnect", error.Message);
        Assert.DoesNotContain("sensitive-provider-data", error.ToString());
        Assert.Equal(1, calls);
    }

    [Fact]
    public async Task SendRejectionIsReportedWithoutRetryingOrExposingTheResponse()
    {
        var calls = 0;
        using var client = new HttpClient(new Handler(_ => Task.FromResult(++calls == 1
            ? Json(HttpStatusCode.OK, new { access_token = "access-token" })
            : Json(HttpStatusCode.Forbidden, new { error = "sensitive-provider-data" }))));
        var error = await Assert.ThrowsAsync<HttpRequestException>(() => Sender(client).SendEmailAsync("partner@example.com", "test", "test"));
        Assert.Equal(HttpStatusCode.Forbidden, error.StatusCode);
        Assert.DoesNotContain("sensitive-provider-data", error.ToString());
        Assert.Equal(2, calls);
    }

    [Theory]
    [InlineData("partner@example.com\r\nBcc: other@example.com", "test")]
    [InlineData("partner@example.com", "test\nBcc: other@example.com")]
    [InlineData("not an email", "test")]
    public async Task InvalidHeadersNeverReachGoogle(string to, string subject)
    {
        var called = false;
        using var client = new HttpClient(new Handler(_ =>
        {
            called = true;
            throw new InvalidOperationException("Must not call Google");
        }));
        await Assert.ThrowsAnyAsync<Exception>(() => Sender(client).SendEmailAsync(to, subject, "test"));
        Assert.False(called);
    }

    [Fact]
    public async Task CancellationStopsBeforeSending()
    {
        using var client = new HttpClient(new Handler(_ => throw new InvalidOperationException("Must not call Google")));
        using var cancellation = new CancellationTokenSource();
        cancellation.Cancel();
        await Assert.ThrowsAnyAsync<OperationCanceledException>(() => Sender(client).SendEmailAsync("partner@example.com", "test", "test", cancellation.Token));
    }

    [Theory]
    [InlineData(null, typeof(ResendEmailSender))]
    [InlineData("Resend", typeof(ResendEmailSender))]
    [InlineData("Gmail", typeof(GmailApiEmailSender))]
    [InlineData("gmail", typeof(GmailApiEmailSender))]
    public void ConfigurationSelectsTheSender(string? provider, Type expectedType)
    {
        using var services = Services(provider).BuildServiceProvider();
        Assert.IsType(expectedType, services.GetRequiredService<IEmailSender>());
    }

    [Fact]
    public void GmailRequiresAllCredentialsAndAValidSender()
    {
        var services = Services("Gmail");
        services.Configure<GmailOptions>(options => { options.RefreshToken = ""; options.SenderEmail = "invalid"; });
        using var provider = services.BuildServiceProvider();
        Assert.Throws<OptionsValidationException>(() => provider.GetRequiredService<IOptions<GmailOptions>>().Value);
    }

    [Fact]
    public void InvalidProviderFailsClearly()
        => Assert.Throws<InvalidOperationException>(() => Services("unknown"));

    private static ServiceCollection Services(string? provider)
    {
        var config = new ConfigurationBuilder().AddInMemoryCollection(new Dictionary<string, string?>
        {
            ["Email:Provider"] = provider,
            ["Gmail:SenderEmail"] = "sender@gmail.com",
            ["Gmail:ClientId"] = "client-id",
            ["Gmail:ClientSecret"] = "client-secret",
            ["Gmail:RefreshToken"] = "refresh-token"
        }).Build();
        var services = new ServiceCollection();
        services.AddSingleton<IConfiguration>(config);
        services.AddLogging();
        services.AddInfrastructure(config);
        return services;
    }

    private static GmailApiEmailSender Sender(HttpClient client) => new(client, Options.Create(new GmailOptions
    {
        SenderEmail = "sender@gmail.com", ClientId = "client-id", ClientSecret = "client-secret", RefreshToken = "refresh-token"
    }), NullLogger<GmailApiEmailSender>.Instance);

    private static HttpResponseMessage Json(HttpStatusCode status, object body) => new(status) { Content = JsonContent.Create(body) };

    private sealed class Handler(Func<HttpRequestMessage, Task<HttpResponseMessage>> handle) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
            => handle(request);
    }
}
