targetScope = 'subscription'

@allowed(['mscscu-prod-0617'])
param environmentName string

@allowed(['italynorth'])
param location string

@allowed(['westeurope'])
param frontendLocation string

param resourceGroupName string
param staticWebAppName string
param appServicePlanName string
param webAppName string
param serverName string
param sqlDatabaseName string
param storageAccountName string
param vaultName string
param workspaceName string
param insightsName string

param sessionId string
param deployedBy string
param createdAt string

@description('Verified object ID in the target tenant. Empty parameter-file placeholder intentionally fails validation.')
@minLength(36)
@maxLength(36)
param deployerObjectId string

@allowed(['User', 'ServicePrincipal', 'Group'])
param deployerPrincipalType string

@secure()
@minLength(16)
@maxLength(128)
param sqlAdministratorPassword string

@secure()
@minLength(16)
@maxLength(128)
param sqlApplicationPassword string

@secure()
@minLength(32)
param jwtKey string

@description('Temporary publishing access. Set false after the approved package upload and retain false on later deployments.')
param scmBasicPublishingEnabled bool = true

var tags = {
  'app-onboard-skill': 'true'
  'app-onboard-session-id': sessionId
  'created-at': createdAt
  environment: environmentName
  'deployed-by': deployedBy
}

resource resourceGroup 'Microsoft.Resources/resourceGroups@2025-04-01' = {
  name: resourceGroupName
  location: location
  tags: tags
}

module staticWebApp './modules/static-web-app.bicep' = {
  name: 'static-web-app'
  scope: resourceGroup
  params: {
    name: staticWebAppName
    location: frontendLocation
    tags: tags
  }
}

module appServicePlan './modules/app-service-plan.bicep' = {
  name: 'app-service-plan'
  scope: resourceGroup
  params: {
    name: appServicePlanName
    location: location
    tags: tags
  }
}

module keyVault './modules/key-vault.bicep' = {
  name: 'key-vault'
  scope: resourceGroup
  params: {
    name: vaultName
    location: location
    tags: tags
  }
}

module sqlServer './modules/sql-server.bicep' = {
  name: 'sql-server'
  scope: resourceGroup
  params: {
    name: serverName
    location: location
    tags: tags
    administratorLogin: 'msc_admin'
    administratorPassword: sqlAdministratorPassword
  }
}

module sqlDatabase './modules/sql-database.bicep' = {
  name: 'sql-database'
  scope: resourceGroup
  params: {
    name: sqlDatabaseName
    serverName: sqlServer.outputs.resourceName
    location: location
    tags: tags
  }
}

module blobStorage './modules/blob-storage.bicep' = {
  name: 'blob-storage'
  scope: resourceGroup
  params: {
    name: storageAccountName
    location: location
    tags: tags
    frontendOrigin: staticWebApp.outputs.url
  }
}

module logAnalytics './modules/log-analytics.bicep' = {
  name: 'log-analytics'
  scope: resourceGroup
  params: {
    name: workspaceName
    location: location
    tags: tags
  }
}

module applicationInsights './modules/application-insights.bicep' = {
  name: 'application-insights'
  scope: resourceGroup
  params: {
    name: insightsName
    location: location
    tags: tags
    workspaceId: logAnalytics.outputs.id
  }
}

module secrets './modules/secrets.bicep' = {
  name: 'secrets'
  scope: resourceGroup
  params: {
    vaultName: keyVault.outputs.resourceName
    storageAccountName: blobStorage.outputs.resourceName
    sqlServerHostname: sqlServer.outputs.fullyQualifiedDomainName
    databaseName: sqlDatabase.outputs.resourceName
    tags: tags
    sqlAdministratorPassword: sqlAdministratorPassword
    sqlApplicationPassword: sqlApplicationPassword
    jwtKey: jwtKey
  }
}

module appService './modules/app-service.bicep' = {
  name: 'app-service'
  scope: resourceGroup
  params: {
    name: webAppName
    location: location
    tags: tags
    planId: appServicePlan.outputs.id
    vaultName: secrets.outputs.keyVaultName
    frontendOrigin: staticWebApp.outputs.url
    applicationInsightsConnectionString: applicationInsights.outputs.connectionString
    scmBasicPublishingEnabled: scmBasicPublishingEnabled
  }
}

module roleAssignments './modules/role-assignments.bicep' = {
  name: 'role-assignments'
  scope: resourceGroup
  params: {
    vaultName: keyVault.outputs.resourceName
    apiPrincipalId: appService.outputs.principalId
    runtimeSecretNames: secrets.outputs.runtimeSecretNames
    deployerObjectId: deployerObjectId
    deployerPrincipalType: deployerPrincipalType
  }
}

module sqlFirewall './modules/sql-firewall.bicep' = {
  name: 'sql-firewall'
  scope: resourceGroup
  params: {
    serverName: sqlServer.outputs.resourceName
    outboundIpAddresses: appService.outputs.outboundIpAddresses
  }
}

output resourceGroupId string = resourceGroup.id
output frontendUrl string = staticWebApp.outputs.url
output apiUrl string = appService.outputs.url
output frontendBuildEnvironment object = {
  REACT_APP_API_URL: '${appService.outputs.url}/api'
  REACT_APP_CONTENT_SOURCE: 'api'
}
output keyVaultName string = keyVault.outputs.resourceName
output sqlServerHostname string = sqlServer.outputs.fullyQualifiedDomainName
output databaseName string = sqlDatabase.outputs.resourceName
output blobEndpoint string = blobStorage.outputs.blobEndpoint
output apiPrincipalId string = appService.outputs.principalId
output apiOutboundIpAddresses string = appService.outputs.outboundIpAddresses