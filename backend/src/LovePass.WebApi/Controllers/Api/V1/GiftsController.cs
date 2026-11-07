using LovePass.Application.Features.Gifts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/gifts")]
[Authorize]
public sealed class GiftsController(ISender mediator) : ControllerBase
{
    /// <summary>มอบคูปองให้แฟน — Single / Predefined Set (couponSetId) / Custom Set (items)</summary>
    [HttpPost]
    public async Task<IActionResult> Create(CreateGiftCommand command, CancellationToken cancellationToken)
    {
        var gift = await mediator.Send(command, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, gift);
    }

    [HttpGet("sent")]
    public async Task<IActionResult> Sent(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetSentGiftsQuery(), cancellationToken));

    /// <summary>รายการของขวัญที่ได้รับจากแฟน</summary>
    [HttpGet("received")]
    public async Task<IActionResult> Received(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetReceivedGiftsQuery(), cancellationToken));

    /// <summary>เปิดดูของขวัญที่ได้รับจากแฟน (บันทึกเวลาเปิดซอง)</summary>
    [HttpPost("{id:int}/open")]
    public async Task<IActionResult> Open(int id, CancellationToken cancellationToken)
        => Ok(await mediator.Send(new OpenGiftBatchCommand(id), cancellationToken));
}
