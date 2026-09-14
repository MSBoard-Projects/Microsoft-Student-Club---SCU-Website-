param name string
param location string
param tags object
param planId string
param vaultName string
param frontendOrigin string
param applicationInsightsConnectionString string
param scmBasicPublishingEnabled bool

var settings = {
  ASPNETCORE_ENVIRONMENT: 'Production'
  WEBSITE_RUN_FROM_PACKAGE: '1'
  SCM_DO_BUILD_DURING_DEPLOYMENT: 'false'
  ConnectionStrings__DefaultConnection: '@Microsoft.KeyVault(VaultName=${vaultName};SecretName=sql-connection-string)'
  Jwt__Key: '@Microsoft.KeyVault(VaultName=${vaultName};SecretName=jwt-key)'
  Jwt__Issuer: 'MSC.WebAPI'
  Jwt__Audience: 'MSC.WebApp'
  Jwt__ExpiresInHours: '1'
  Cors__AllowedOrigins__0: frontendOrigin
  Azure__BlobStorage__ConnectionString: '@Microsoft.KeyVault(VaultName=${vaultName};SecretName=blob-connection-string)'
  Azure__BlobStorage__Containers__MemberImages: 'member-images'
  Azure__BlobStorage__Containers__EventImages: 'event-images'
  Azure__BlobStorage__Containers__Certificates: 'certificates'
  APPLICATIONINSIGHTS_CONNECTION_STRING: applicationInsightsConnectionString
  Azure__ApplicationInsights__ConnectionString: applicationInsightsConnectionString
  Serilog__Using__0: 'Serilog.Sinks.ApplicationInsights'
  Serilog__MinimumLevel__Default: 'Information'
  Serilog__MinimumLevel__Override__Microsoft: 'Warning'
  Serilog__WriteTo__0__Name: 'ApplicationInsights'
  Serilog__WriteTo__0__Args__connectionString: applicationInsightsConnectionString
  Serilog__WriteTo__0__Args__telemetryConverter: 'Serilog.Sinks.ApplicationInsights.TelemetryConverters.TraceTelemetryConverter, Serilog.Sinks.ApplicationInsights'
}

resource app 'Microsoft.Web/sites@2024-11-01' = {
  name: name
  location: location
  tags: tags
  kind: 'app,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: planId
    httpsOnly: true
    clientAffinityEnabled: false
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'DOTNETCORE|8.0'
      alwaysOn: true
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      scmMinTlsVersion: '1.2'
      http20Enabled: true
      appSettings: [for setting in items(settings): {
        name: setting.key
        value: setting.value
      }]
    }
  }
}

resource scmPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-11-01' = {
  parent: app
  name: 'scm'
  properties: {
    allow: scmBasicPublishingEnabled
  }
}

resource ftpPolicy 'Microsoft.Web/sites/basicPublishingCredentialsPolicies@2024-11-01' = {
  parent: app
  name: 'ftp'
  properties: {
    allow: false
  }
}

output id string = app.id
output url string = 'https://${app.properties.defaultHostName}'
output principalId string = app.identity.principalId
output outboundIpAddresses string = app.properties.outboundIpAddresses