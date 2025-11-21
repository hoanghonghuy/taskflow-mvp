# Multi-stage build for Taskflow backend WebApi (.NET 9)

# =====================
# Build stage
# =====================
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy solution structure
COPY ./src/WebApi/Taskflow.WebApi.csproj ./src/WebApi/
COPY ./src/Application/Taskflow.Application.csproj ./src/Application/
COPY ./src/Domain/Taskflow.Domain.csproj ./src/Domain/
COPY ./src/Infrastructure/Taskflow.Infrastructure.csproj ./src/Infrastructure/

RUN dotnet restore ./src/WebApi/Taskflow.WebApi.csproj

# Copy the rest of the source
COPY ./src ./src

# Publish app
RUN dotnet publish ./src/WebApi/Taskflow.WebApi.csproj -c Release -o /app/publish /p:UseAppHost=false

# =====================
# Runtime stage
# =====================
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
WORKDIR /app

# Environment variables (override at runtime as needed)
# ASPNETCORE_URLS: Kestrel binding
ENV ASPNETCORE_URLS=http://+:8080

# Gemini API key should be provided at runtime, e.g. -e GEMINI_API_KEY=... 
# ENV GEMINI_API_KEY=""

COPY --from=build /app/publish .

EXPOSE 8080

ENTRYPOINT ["dotnet", "Taskflow.WebApi.dll"]
