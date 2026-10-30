using System.Text.Json;
using FluentValidation;
using LovePass.Application.Common.Exceptions;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace LovePass.WebApi.Middleware;

/// <summary>แปลง exception เป็น RFC 7807 ProblemDetails — controller ไม่ต้องจัดการ error เอง</summary>
public sealed class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception ex)
        {
            await HandleAsync(context, ex);
        }
    }

    private async Task HandleAsync(HttpContext context, Exception exception)
    {
        var (status, title, errors) = exception switch
        {
            ValidationException validation => (StatusCodes.Status400BadRequest, "One or more validation errors occurred.",
                validation.Errors.GroupBy(e => e.PropertyName).ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray())),
            NotFoundException => (StatusCodes.Status404NotFound, "Resource not found.", null),
            ForbiddenAccessException => (StatusCodes.Status403Forbidden, "Access forbidden.", null),
            UnauthorizedException => (StatusCodes.Status401Unauthorized, "Unauthorized.", null),
            ConflictException => (StatusCodes.Status409Conflict, exception.Message, null),
            DbUpdateException { InnerException: PostgresException { SqlState: "23505", ConstraintName: "IX_GiftBatches_PackKey" } } =>
                (StatusCodes.Status409Conflict, "ซองนี้กำลังถูกส่งอยู่ ลองคำขอเดิมอีกครั้งเพื่อดูผลนะ", null),
            DbUpdateConcurrencyException => (StatusCodes.Status409Conflict, "ข้อมูลถูกแก้โดย request อื่น กรุณาลองใหม่", null),
            OperationCanceledException => (StatusCodes.Status499ClientClosedRequest, "Client closed request.", null),
            _ => (StatusCodes.Status500InternalServerError, "An unexpected error occurred.", null)
        };

        if (status == StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Unhandled exception on {Method} {Path}", context.Request.Method, context.Request.Path);
        else
            logger.LogInformation("{ExceptionType} on {Method} {Path}: {Message}", exception.GetType().Name, context.Request.Method, context.Request.Path, exception.Message);

        if (context.Response.HasStarted) return;

        context.Response.Clear();
        context.Response.StatusCode = status;
        context.Response.ContentType = "application/problem+json";

        var problem = new Dictionary<string, object?>
        {
            ["type"] = $"https://httpstatuses.com/{status}",
            ["title"] = title,
            ["status"] = status
        };
        if (errors is not null)
            problem["errors"] = errors;

        await context.Response.WriteAsync(JsonSerializer.Serialize(problem, JsonOptions));
    }
}
