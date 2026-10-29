using System.Text;
using System.Threading.RateLimiting;
using LovePass.Application;
using LovePass.Infrastructure;
using LovePass.Infrastructure.Data;
using LovePass.WebApi;
using LovePass.WebApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;

// โหลด backend/.env ก่อนสร้าง host — มีสถานะเทียบเท่า env var (แพ้ env var จริงที่ตั้งไว้แล้ว)
foreach (var candidate in new[]
{
    Path.Combine(Directory.GetCurrentDirectory(), ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", ".env"),
    Path.Combine(Directory.GetCurrentDirectory(), "..", "..", ".env"),
})
{
    EnvFile.Load(candidate);
}

var builder = WebApplication.CreateBuilder(args);

// Services
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddControllers();

var jwt = builder.Configuration.GetSection(JwtOptions.SectionName).Get<JwtOptions>() ?? new JwtOptions();
builder.Services
    .AddAuthentication(options =>
    {
        // override default ของ AddIdentity (cookie) — API นี้ใช้ JWT ล้วน
        options.DefaultScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt.Issuer,
            ValidAudience = jwt.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt.SigningKey)),
            ClockSkew = TimeSpan.FromSeconds(30)
        };
    });

builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RequireAdmin", policy => policy.RequireRole("Admin"));
    options.FallbackPolicy = new Microsoft.AspNetCore.Authorization.AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
});

var corsOptions = builder.Configuration.GetSection(CorsOptions.SectionName).Get<CorsOptions>() ?? new CorsOptions();
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy
        .WithOrigins(corsOptions.Origins())
        .AllowAnyHeader()
        .AllowAnyMethod());
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.AddPolicy("auth", context =>
        RateLimitPartition.GetFixedWindowLimiter(
            context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
            _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 20,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo { Title = "LOVE PASS API", Version = "v1" });
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "ใส่ JWT access token"
    });
    options.AddSecurityRequirement(_ => new OpenApiSecurityRequirement
    {
        [new OpenApiSecuritySchemeReference("Bearer")] = []
    });
});

var app = builder.Build();

// Pipeline
app.UseMiddleware<ExceptionHandlingMiddleware>();
app.UseCors("Frontend");
app.UseRateLimiter();

if (app.Environment.IsDevelopment() || app.Environment.IsStaging())
{
    app.UseSwagger();
    app.UseSwaggerUI(options => options.SwaggerEndpoint("/swagger/v1/swagger.json", "LOVE PASS API v1"));
}

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// health check สำหรับ Render (ต้อง Anonymous เพราะ FallbackPolicy บังคับ auth)
app.MapGet("/health", () => Results.Ok(new { status = "ok" })).AllowAnonymous();

// ทำ migrate + seed ตอน startup (fail-soft: ถ้า DB ยังไม่พร้อม จะ log error แต่ API ยังเปิดให้ดู Swagger ได้)
using (var scope = app.Services.CreateScope())
{
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        await dbContext.Database.MigrateAsync();
        await scope.ServiceProvider.GetRequiredService<DataSeeder>().SeedAsync();
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Database migrate/seed failed — ตรวจ ConnectionStrings__DefaultConnection ใน backend/.env และว่า PostgreSQL รันอยู่ (docker compose up -d)");
    }
}

app.Run();
