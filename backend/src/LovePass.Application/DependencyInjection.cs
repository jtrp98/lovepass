using FluentValidation;
using LovePass.Application.Common.Behaviors;
using LovePass.Application.Common.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LovePass.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = typeof(DependencyInjection).Assembly;

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddOpenBehavior(typeof(ValidationBehavior<,>));
            cfg.AddOpenBehavior(typeof(TransactionBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly);
        services.AddOptions<AppOptions>().BindConfiguration(AppOptions.SectionName);

        return services;
    }
}
