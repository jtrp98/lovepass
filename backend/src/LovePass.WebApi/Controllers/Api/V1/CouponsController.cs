using LovePass.Application.Features.Coupons;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/coupons")]
[Authorize]
public sealed class CouponsController(ISender mediator) : ControllerBase
{
    [HttpGet("my")]
    public async Task<IActionResult> My([FromQuery] string? rarity, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetMyCouponsQuery(rarity), cancellationToken));

    [HttpGet("dashboard")]
    public async Task<IActionResult> Dashboard(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetDashboardQuery(), cancellationToken));

    /// <summary>คูปองที่คูปองพลังพิเศษใบนี้เลือกเป็นเป้าหมายได้</summary>
    [HttpGet("{id:int}/meta-targets")]
    public async Task<IActionResult> MetaTargets(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetMetaTargetsQuery(id), cancellationToken));
}
