param vaultName string
param sqlServerHostname string
param databaseName string
param tags object

@secure()
param jwtKey string

resource vault 'Microsoft.KeyVault/vaults@2024-11-01' existing = {
  name: vaultName
}

resource sqlApplicationSecret 'Microsoft.KeyVault/vaults/secrets@2024-11-01' = {
  parent: vault
  name: 'sql-connection-string'
  tags: tags
  properties: {
    value: 'Server=tcp:${sqlServerHostname},1433;Initial Catalog=${databaseName};Authentication=Active Directory Managed Identity;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;MultipleActiveResultSets=True;'
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

output keyVaultName string = vault.name
output runtimeSecretNames array = [sqlApplicationSecret.name, jwtSecret.name]