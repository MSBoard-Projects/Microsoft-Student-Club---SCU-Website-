param name string
param location string
param tags object
param frontendOrigin string

resource storage 'Microsoft.Storage/storageAccounts@2025-01-01' = {
  name: name
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    accessTier: 'Hot'
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    allowSharedKeyAccess: true
    publicNetworkAccess: 'Enabled'
    networkAcls: {
      bypass: 'None'
      defaultAction: 'Allow'
    }
  }
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2025-01-01' = {
  parent: storage
  name: 'default'
  properties: {
    cors: {
      corsRules: [
        {
          allowedOrigins: [frontendOrigin]
          allowedMethods: ['PUT', 'GET', 'HEAD', 'OPTIONS']
          allowedHeaders: ['content-type', 'x-ms-*']
          exposedHeaders: ['ETag', 'x-ms-request-id']
          maxAgeInSeconds: 3600
        }
      ]
    }
  }
}

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' = [for containerName in ['member-images', 'event-images', 'certificates']: {
  parent: blobService
  name: containerName
  properties: {
    publicAccess: 'None'
  }
}]

output id string = storage.id
output resourceName string = storage.name
output blobEndpoint string = storage.properties.primaryEndpoints.blob