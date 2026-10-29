# LOVE PASS Web API — ใช้กับ Render (และใช้ได้กับ Docker ทั่วไป)
# Build context = repo root: docker build -f backend/Dockerfile .

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY backend/LovePass.sln ./
COPY backend/src/LovePass.Domain/LovePass.Domain.csproj src/LovePass.Domain/
COPY backend/src/LovePass.Application/LovePass.Application.csproj src/LovePass.Application/
COPY backend/src/LovePass.Infrastructure/LovePass.Infrastructure.csproj src/LovePass.Infrastructure/
COPY backend/src/LovePass.WebApi/LovePass.WebApi.csproj src/LovePass.WebApi/
RUN dotnet restore

COPY backend/src ./src
RUN dotnet publish src/LovePass.WebApi -c Release -o /app/publish --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_ENVIRONMENT=Production
EXPOSE 8080

# Render กำหนด PORT env — bind ตามค่านั้น (local ใช้ 8080)
CMD ["sh", "-c", "dotnet LovePass.WebApi.dll --urls http://+:${PORT:-8080}"]
