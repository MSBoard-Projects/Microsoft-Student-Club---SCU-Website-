param vaultName string
param storageAccountName string
param sqlServerHostname string
param databaseName string
param tags object

@secure()
param sqlAdministratorPassword string

@secure()
param sqlApplicationPassword string

@secure()
param jwtKey string

resource vault 'Microsoft.KeyVault/vaults@2024-11-01' existing = {
  name: vaultName
}

resource storage 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageAccountName
}

resource sqlAdminSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'sql-administrator-password'
  tags: tags
  properties: {
    value: sqlAdministratorPassword
  }
}

resource sqlApplicationSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'sql-connection-string'
  tags: tags
  properties: {
    value: 'Server=tcp:${sqlServerHostname},1433;Initial Catalog=${databaseName};User ID=msc_app;Password="${replace(sqlApplicationPassword, '"', '""')}";Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;MultipleActiveResultSets=True;'
  }
}

resource jwtSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'jwt-key'
  tags: tags
  properties: {
    value: jwtKey
  }
}

resource blobSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'blob-connection-string'
  tags: tags
  properties: {
    value: 'DefaultEndpointsProtocol=https;AccountName=${storage.name};AccountKey=${storage.listKeys().keys[0].value};EndpointSuffix=${environment().suffixes.storage}'
  }
}

output keyVaultName string = vault.name
output runtimeSecretNames array = [sqlApplicationSecret.name, jwtSecret.name, blobSecret.name]