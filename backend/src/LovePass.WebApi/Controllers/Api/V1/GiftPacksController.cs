using LovePass.Application.Features.Gifts;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Authorize]
[Route("api/v1/gift-packs")]
public sealed class GiftPacksController(ISender mediator) : ControllerBase
{
    /// <summary>ดูซองคูปองที่ได้รับและส่ง</summary>
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken ct) => Ok(await mediator.Send(new GetGiftPacksQuery(), ct));

    /// <summary>จัดซองคูปองให้แฟน</summary>
    [HttpPost]
    public async Task<IActionResult> Create(CreateGiftPackCommand command, CancellationToken ct) => Ok(await mediator.Send(command, ct));

    /// <summary>เปิดซองคูปองที่ได้รับ</summary>
    [HttpPost("{id:int}/open")]
    public async Task<IActionResult> Open(int id, CancellationToken ct) => Ok(await mediator.Send(new OpenGiftPackCommand(id), ct));

    /// <summary>เปิดซองสิทธิ์ตามระดับ แยกจากการ์ดส่งของขวัญ</summary>
    [HttpPost("{id:int}/tiers/{rarity}/open")]
    public async Task<IActionResult> OpenTier(int id, string rarity, CancellationToken ct) => Ok(await mediator.Send(new OpenGiftPackTierCommand(id, rarity), ct));

    /// <summary>เลือกหรือสุ่มหนึ่งถึงหลายใบ ใช้สิทธิ์ตามจำนวนในครั้งเดียว</summary>
    [HttpPost("{id:int}/draws")]
    public async Task<IActionResult> Draw(int id, DrawGiftPackCommand command, CancellationToken ct) => Ok(await mediator.Send(command with { Id = id }, ct));
}
