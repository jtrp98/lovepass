using LovePass.Application.Common.Interfaces;
using LovePass.Domain.Entities;
using LovePass.Infrastructure.Data;
using LovePass.Infrastructure.Email;
using LovePass.Infrastructure.Identity;
using LovePass.Infrastructure.Services;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace LovePass.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<ApplicationDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        services.AddIdentity<ApplicationUser, IdentityRole<int>>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.User.RequireUniqueEmail = true;
                options.SignIn.RequireConfirmedEmail = false;
            })
            .AddEntityFrameworkStores<ApplicationDbContext>()
            .AddDefaultTokenProviders();

        services.AddOptions<JwtOptions>().BindConfiguration(JwtOptions.SectionName).ValidateDataAnnotations();
        services.AddOptions<ResendOptions>().BindConfiguration(ResendOptions.SectionName);
        services.AddOptions<SeedOptions>().BindConfiguration(SeedOptions.SectionName);
        services.AddOptions<CorsOptions>().BindConfiguration(CorsOptions.SectionName);
        services.AddOptions<GoogleAuthOptions>().BindConfiguration(GoogleAuthOptions.SectionName);

        services.AddTransient<IIdentityService, IdentityService>();
        services.AddTransient<ITokenService, JwtTokenService>();
        services.AddTransient<IExternalAuthVerifier, GoogleTokenVerifier>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<DataSeeder>();

        var emailProvider = configuration["Email:Provider"] ?? "Resend";
        if (emailProvider.Equals("Gmail", StringComparison.OrdinalIgnoreCase))
        {
            services.AddOptions<GmailOptions>().BindConfiguration(GmailOptions.SectionName)
                .ValidateDataAnnotations().ValidateOnStart();
            services.AddHttpClient<IEmailSender, GmailApiEmailSender>(client =>
                client.Timeout = TimeSpan.FromSeconds(20));
        }
        else if (emailProvider.Equals("Resend", StringComparison.OrdinalIgnoreCase))
        {
            services.AddHttpClient<IEmailSender, ResendEmailSender>(client =>
            {
                client.BaseAddress = new Uri("https://api.resend.com");
                client.Timeout = TimeSpan.FromSeconds(10);
            });
        }
        else
        {
            throw new InvalidOperationException("Email:Provider must be Gmail or Resend.");
        }

        return services;
    }
}
