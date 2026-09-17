FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Nexora.Domain/Nexora.Domain.csproj Nexora.Domain/
COPY Nexora.Application/Nexora.Application.csproj Nexora.Application/
COPY Nexora.Infrastructure/Nexora.Infrastructure.csproj Nexora.Infrastructure/
COPY Nexora.Api/Nexora.Api.csproj Nexora.Api/
RUN dotnet restore Nexora.Api/Nexora.Api.csproj

COPY . .
RUN dotnet publish Nexora.Api/Nexora.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

# Non-root: containers run as a dedicated user, not root.
RUN useradd --create-home nexora
USER nexora

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "Nexora.Api.dll"]
