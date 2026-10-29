using LovePass.Application.Features.Couples;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/couples")]
[Authorize]
public sealed class CouplesController(ISender mediator) : ControllerBase
{
    [HttpPost("invitations")]
    public async Task<IActionResult> CreateInvitation(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new CreateInvitationCommand(), cancellationToken));

    [HttpPost("invitations/accept")]
    public async Task<IActionResult> AcceptInvitation(AcceptInvitationCommand command, CancellationToken cancellationToken)
        => Ok(await mediator.Send(command, cancellationToken));

    [HttpGet("me")]
    public async Task<IActionResult> GetMyCouple(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetMyCoupleQuery(), cancellationToken));
}
