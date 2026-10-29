using FluentValidation;
using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Exceptions;
using LovePass.Application.Common.Interfaces;
using LovePass.Application.Common.Models;
using LovePass.Application.Common.Services;
using MediatR;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LovePass.Application.Features.Auth;

// ---------------- Register ----------------

public sealed record RegisterCommand(string Email, string Password, string DisplayName) : ICommand<TokenPair>;

public sealed class RegisterCommandValidator : AbstractValidator<RegisterCommand>
{
    public RegisterCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(256);
        RuleFor(x => x.Password).NotEmpty().MinimumLength(8).MaximumLength(128);
        RuleFor(x => x.DisplayName).NotEmpty().MaximumLength(50);
    }
}

public sealed class RegisterCommandHandler(IIdentityService identity, ITokenService tokens)
    : IRequestHandler<RegisterCommand, TokenPair>
{
    public async Task<TokenPair> Handle(RegisterCommand request, CancellationToken cancellationToken)
    {
        var userId = await identity.RegisterAsync(request.Email, request.Password, request.DisplayName, cancellationToken);
        return await tokens.IssueTokensAsync(userId, cancellationToken);
    }
}

// ---------------- Login ----------------

public sealed record LoginCommand(string Email, string Password) : ICommand<TokenPair>;

public sealed class LoginCommandValidator : AbstractValidator<LoginCommand>
{
    public LoginCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Password).NotEmpty();
    }
}

public sealed class LoginCommandHandler(IIdentityService identity, ITokenService tokens)
    : IRequestHandler<LoginCommand, TokenPair>
{
    public async Task<TokenPair> Handle(LoginCommand request, CancellationToken cancellationToken)
    {
        var userId = await identity.ValidateCredentialsAsync(request.Email, request.Password, cancellationToken);
        return await tokens.IssueTokensAsync(userId, cancellationToken);
    }
}

// ---------------- Refresh ----------------

public sealed record RefreshTokenCommand(string RefreshToken) : ICommand<TokenPair>;

public sealed class RefreshTokenCommandValidator : AbstractValidator<RefreshTokenCommand>
{
    public RefreshTokenCommandValidator()
        => RuleFor(x => x.RefreshToken).NotEmpty();
}

public sealed class RefreshTokenCommandHandler(ITokenService tokens)
    : IRequestHandler<RefreshTokenCommand, TokenPair>
{
    public async Task<TokenPair> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
        => await tokens.RefreshTokensAsync(request.RefreshToken, cancellationToken);
}

// ---------------- Forgot / Reset password ----------------

public sealed record ForgotPasswordCommand(string Email) : ICommand<Unit>;

public sealed class ForgotPasswordCommandValidator : AbstractValidator<ForgotPasswordCommand>
{
    public ForgotPasswordCommandValidator()
        => RuleFor(x => x.Email).NotEmpty().EmailAddress();
}

/// <summary>ตอบเหมือนกันเสมอไม่ว่าอีเมลมีจริงหรือไม่ — กัน enumeration attack</summary>
public sealed class ForgotPasswordCommandHandler(
    IIdentityService identity,
    IEmailSender emailSender,
    IOptions<AppOptions> appOptions,
    ILogger<ForgotPasswordCommandHandler> logger)
    : IRequestHandler<ForgotPasswordCommand, Unit>
{
    public async Task<Unit> Handle(ForgotPasswordCommand request, CancellationToken cancellationToken)
    {
        var user = await identity.FindUserByEmailAsync(request.Email, cancellationToken);
        if (user is null) return Unit.Value;

        try
        {
            var token = await identity.GeneratePasswordResetTokenAsync(user.Id, cancellationToken);
            var (subject, html) = EmailTemplates.PasswordReset(user.Email, token, appOptions.Value);
            await emailSender.SendEmailAsync(user.Email, subject, html, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send password reset email to {Email}", request.Email);
        }

        return Unit.Value;
    }
}

public sealed record ResetPasswordCommand(string Email, string Token, string NewPassword) : ICommand<Unit>;

public sealed class ResetPasswordCommandValidator : AbstractValidator<ResetPasswordCommand>
{
    public ResetPasswordCommandValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.Token).NotEmpty();
        RuleFor(x => x.NewPassword).NotEmpty().MinimumLength(8).MaximumLength(128);
    }
}

public sealed class ResetPasswordCommandHandler(IIdentityService identity)
    : IRequestHandler<ResetPasswordCommand, Unit>
{
    public async Task<Unit> Handle(ResetPasswordCommand request, CancellationToken cancellationToken)
    {
        await identity.ResetPasswordAsync(request.Email, request.Token, request.NewPassword, cancellationToken);
        return Unit.Value;
    }
}

// ---------------- Google Sign-In ----------------

/// <summary>สมัคร/เข้าสู่ระบบด้วย Google — FE ส่ง Google ID token มายืนยัน แล้วออก JWT ของระบบ</summary>
public sealed record GoogleLoginCommand(string IdToken) : ICommand<TokenPair>;

public sealed class GoogleLoginCommandValidator : AbstractValidator<GoogleLoginCommand>
{
    public GoogleLoginCommandValidator()
        => RuleFor(x => x.IdToken).NotEmpty();
}

public sealed class GoogleLoginCommandHandler(IExternalAuthVerifier verifier, IIdentityService identity, ITokenService tokens)
    : IRequestHandler<GoogleLoginCommand, TokenPair>
{
    public async Task<TokenPair> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        var info = await verifier.VerifyGoogleTokenAsync(request.IdToken, cancellationToken);
        var userId = await identity.GetOrCreateExternalUserAsync("Google", info.ProviderUserId, info.Email, info.DisplayName, cancellationToken);
        return await tokens.IssueTokensAsync(userId, cancellationToken);
    }
}

// ---------------- Current user ----------------

public sealed record GetCurrentUserQuery() : IQuery<CurrentUserDto>;

public sealed class GetCurrentUserQueryHandler(ICurrentUserService currentUser, IIdentityService identity)
    : IRequestHandler<GetCurrentUserQuery, CurrentUserDto>
{
    public async Task<CurrentUserDto> Handle(GetCurrentUserQuery request, CancellationToken cancellationToken)
        => await identity.GetUserAsync(currentUser.RequiredUserId(), cancellationToken);
}
