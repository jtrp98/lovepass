using LovePass.Application.Features.Catalog;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/coupon-templates")]
[Authorize]
public sealed class CouponTemplatesController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List([FromQuery] string? rarity, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetCouponTemplatesQuery(rarity), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetCouponTemplateQuery(id), cancellationToken));
}

[ApiController]
[Route("api/v1/coupon-sets")]
[Authorize]
public sealed class CouponSetsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetCouponSetsQuery(), cancellationToken));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetCouponSetQuery(id), cancellationToken));
}
