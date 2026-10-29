using LovePass.Application.Features.Auth;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/auth")]
[EnableRateLimiting("auth")]
public sealed class AuthController(ISender mediator) : ControllerBase
{
    [HttpPost("register")]
    [AllowAnonymous]
    public async Task<IActionResult> Register(RegisterCommand command, CancellationToken cancellationToken)
        => Ok(await mediator.Send(command, cancellationToken));

    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<IActionResult> Login(LoginCommand command, CancellationToken cancellationToken)
        => Ok(await mediator.Send(command, cancellationToken));

    /// <summary>สมัคร/เข้าสู่ระบบด้วย Google — ส่ง Google ID token (credential) จาก Google Identity Services</summary>
    [HttpPost("google")]
    [AllowAnonymous]
    public async Task<IActionResult> Google(GoogleLoginCommand command, CancellationToken cancellationToken)
        => Ok(await mediator.Send(command, cancellationToken));

    [HttpPost("refresh")]
    [AllowAnonymous]
    public async Task<IActionResult> Refresh(RefreshTokenCommand command, CancellationToken cancellationToken)
        => Ok(await mediator.Send(command, cancellationToken));

    [HttpPost("forgot-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ForgotPassword(ForgotPasswordCommand command, CancellationToken cancellationToken)
    {
        await mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpPost("reset-password")]
    [AllowAnonymous]
    public async Task<IActionResult> ResetPassword(ResetPasswordCommand command, CancellationToken cancellationToken)
    {
        await mediator.Send(command, cancellationToken);
        return NoContent();
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetCurrentUserQuery(), cancellationToken));
}
