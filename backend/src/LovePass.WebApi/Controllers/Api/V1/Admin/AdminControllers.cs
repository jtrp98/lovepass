using LovePass.Application.Features.Admin;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1.Admin;

[ApiController]
[Route("api/v1/admin/coupon-templates")]
[Authorize(Roles = "Admin")]
public sealed class AdminCouponTemplatesController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminCouponTemplatesQuery(), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateCouponTemplateCommand command, CancellationToken cancellationToken)
        => StatusCode(StatusCodes.Status201Created, await mediator.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateCouponTemplateCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id) return BadRequest(new { title = "Id ใน path และ body ไม่ตรงกัน" });
        return Ok(await mediator.Send(command, cancellationToken));
    }

    /// <summary>Soft delete — คูปองที่มอบไปแล้วคงเงื่อนไขเดิมตาม snapshot</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteCouponTemplateCommand(id), cancellationToken);
        return NoContent();
    }
}

[ApiController]
[Route("api/v1/admin/coupon-sets")]
[Authorize(Roles = "Admin")]
public sealed class AdminCouponSetsController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminCouponSetsQuery(), cancellationToken));

    [HttpPost]
    public async Task<IActionResult> Create(CreateCouponSetCommand command, CancellationToken cancellationToken)
        => StatusCode(StatusCodes.Status201Created, await mediator.Send(command, cancellationToken));

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateCouponSetCommand command, CancellationToken cancellationToken)
    {
        if (id != command.Id) return BadRequest(new { title = "Id ใน path และ body ไม่ตรงกัน" });
        return Ok(await mediator.Send(command, cancellationToken));
    }

    /// <summary>Soft delete set</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteCouponSetCommand(id), cancellationToken);
        return NoContent();
    }
}

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Roles = "Admin")]
public sealed class AdminUsersController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminUsersQuery(), cancellationToken));

    /// <summary>Soft delete user — ล็อกอินไม่ได้ทันที ลบได้เฉพาะคนที่ไม่เคยจับคู่ (409 ถ้าเคย)</summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DeleteUserCommand(id), cancellationToken);
        return NoContent();
    }
}

[ApiController]
[Route("api/v1/admin/couples")]
[Authorize(Roles = "Admin")]
public sealed class AdminCouplesController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminCouplesQuery(), cancellationToken));

    /// <summary>ยกเลิกคู่ — ไม่ลบข้อมูล ประวัติและความทรงจำคงเดิม</summary>
    [HttpPost("{id:int}/dissolve")]
    public async Task<IActionResult> Dissolve(int id, CancellationToken cancellationToken)
    {
        await mediator.Send(new DissolveCoupleCommand(id), cancellationToken);
        return NoContent();
    }
}

[ApiController]
[Route("api/v1/admin")]
[Authorize(Roles = "Admin")]
public sealed class AdminDashboardController(ISender mediator) : ControllerBase
{
    [HttpGet("dashboard/stats")]
    public async Task<IActionResult> Stats(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminStatsQuery(), cancellationToken));

    [HttpGet("gifts")]
    public async Task<IActionResult> Gifts(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminGiftsQuery(), cancellationToken));

    [HttpGet("redemptions")]
    public async Task<IActionResult> Redemptions(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetAdminRedemptionsQuery(), cancellationToken));
}
