param name string
param location string
param tags object

resource staticWebApp 'Microsoft.Web/staticSites@2024-11-01' = {
  name: name
  location: location
  tags: tags
  sku: {
    name: 'Standard'
    tier: 'Standard'
  }
  properties: {}
}

output id string = staticWebApp.id
output url string = 'https://${staticWebApp.properties.defaultHostname}'