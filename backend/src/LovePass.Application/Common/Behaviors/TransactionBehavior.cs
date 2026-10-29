using LovePass.Application.Common.Abstractions;
using LovePass.Application.Common.Interfaces;
using MediatR;
using Microsoft.Extensions.Logging;

namespace LovePass.Application.Common.Behaviors;

/// <summary>หนึ่ง command = หนึ่ง transaction — commit เมื่อสำเร็จ, rollback เมื่อ handler โยน exception</summary>
public sealed class TransactionBehavior<TRequest, TResponse>(
    IApplicationDbContext context,
    ILogger<TransactionBehavior<TRequest, TResponse>> logger)
    : IPipelineBehavior<TRequest, TResponse> where TRequest : ICommand<TResponse>
{
    public async Task<TResponse> Handle(TRequest request, RequestHandlerDelegate<TResponse> next, CancellationToken cancellationToken)
    {
        await using var transaction = await context.BeginTransactionAsync(cancellationToken);
        try
        {
            var response = await next();
            await transaction.CommitAsync(cancellationToken);
            return response;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogInformation(ex, "Transaction rolled back for {RequestName}", typeof(TRequest).Name);
            throw;
        }
    }
}
