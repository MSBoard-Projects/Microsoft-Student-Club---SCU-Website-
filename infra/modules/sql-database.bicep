param name string
param serverName string
param location string
param tags object
param skuName string = 'Basic'
param skuTier string = 'Basic'
param capacity int = 5
param maxSizeBytes int = 2147483648
param backupStorageRedundancy string = 'Local'

resource server 'Microsoft.Sql/servers@2023-08-01' existing = {
  name: serverName
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: server
  name: name
  location: location
  tags: tags
  sku: {
    name: skuName
    tier: skuTier
    capacity: capacity
  }
  properties: {
    maxSizeBytes: maxSizeBytes
    zoneRedundant: false
    requestedBackupStorageRedundancy: backupStorageRedundancy
  }
}

output id string = database.id
output resourceName string = database.name