using LovePass.Application.Features.Redemptions;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/redemptions")]
[Authorize]
public sealed class RedemptionsController(ISender mediator) : ControllerBase
{
    /// <summary>ขอใช้คูปอง — ระบบกันสิทธิ์ 1 ใบไว้ระหว่างรอผู้มอบพิจารณา</summary>
    [HttpPost]
    public async Task<IActionResult> Request(RequestRedemptionCommand command, CancellationToken cancellationToken)
        => Ok(await mediator.Send(command, cancellationToken));

    /// <summary>direction=sent (คำขอที่ฉันส่ง) | received (คำขอที่ต้องพิจารณา)</summary>
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string direction = "sent", CancellationToken cancellationToken = default)
        => Ok(await mediator.Send(new GetRedemptionsQuery(direction), cancellationToken));

    [HttpPost("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new ApproveRedemptionCommand(id), cancellationToken));

    [HttpPost("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new RejectRedemptionCommand(id), cancellationToken));

    [HttpPost("{id:int}/cancel")]
    public async Task<IActionResult> Cancel(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new CancelRedemptionCommand(id), cancellationToken));
}
