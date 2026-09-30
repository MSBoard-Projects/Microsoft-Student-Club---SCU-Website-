param name string
param location string
param tags object
param skuName string = 'Standard'
param skuTier string = 'Standard'

resource staticWebApp 'Microsoft.Web/staticSites@2024-11-01' = {
  name: name
  location: location
  tags: tags
  identity: {
    type: 'SystemAssigned'
  }
  sku: {
    name: skuName
    tier: skuTier
  }
  properties: {}
}

output id string = staticWebApp.id
output url string = 'https://${staticWebApp.properties.defaultHostname}'