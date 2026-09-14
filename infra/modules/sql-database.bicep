param name string
param serverName string
param location string
param tags object

resource server 'Microsoft.Sql/servers@2023-08-01' existing = {
  name: serverName
}

resource database 'Microsoft.Sql/servers/databases@2023-08-01' = {
  parent: server
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Basic'
    tier: 'Basic'
    capacity: 5
  }
  properties: {
    maxSizeBytes: 2147483648
    zoneRedundant: false
    requestedBackupStorageRedundancy: 'Local'
  }
}

output id string = database.id
output resourceName string = database.name