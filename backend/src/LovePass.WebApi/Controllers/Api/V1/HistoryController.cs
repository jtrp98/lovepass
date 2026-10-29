using LovePass.Application.Features.History;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace LovePass.WebApi.Controllers.Api.V1;

[ApiController]
[Route("api/v1/history")]
[Authorize]
public sealed class HistoryController(ISender mediator) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> List(CancellationToken cancellationToken)
        => Ok(await mediator.Send(new GetHistoryQuery(), cancellationToken));
}
