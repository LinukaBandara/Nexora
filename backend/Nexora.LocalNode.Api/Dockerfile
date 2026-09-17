FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Nexora.Domain/Nexora.Domain.csproj Nexora.Domain/
COPY Nexora.Application/Nexora.Application.csproj Nexora.Application/
COPY Nexora.Infrastructure/Nexora.Infrastructure.csproj Nexora.Infrastructure/
COPY Nexora.Api/Nexora.Api.csproj Nexora.Api/
COPY Nexora.LocalNode.Api/Nexora.LocalNode.Api.csproj Nexora.LocalNode.Api/
RUN dotnet restore Nexora.LocalNode.Api/Nexora.LocalNode.Api.csproj

COPY . .
RUN dotnet publish Nexora.LocalNode.Api/Nexora.LocalNode.Api.csproj -c Release -o /app --no-restore

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app

RUN useradd --create-home nexora
USER nexora

COPY --from=build /app .

ENV ASPNETCORE_URLS=http://+:8081
EXPOSE 8081

ENTRYPOINT ["dotnet", "Nexora.LocalNode.Api.dll"]
