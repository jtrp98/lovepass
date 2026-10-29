namespace LovePass.Application.Common.Interfaces;

public interface IEmailSender
{
    Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken cancellationToken = default);
}
