param name string
param location string
param tags object
param skuName string = 'B1'
param skuTier string = 'Basic'
param capacity int = 1

resource plan 'Microsoft.Web/serverfarms@2024-11-01' = {
  name: name
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: skuName
    tier: skuTier
    capacity: capacity
  }
  properties: {
    reserved: true
    zoneRedundant: false
  }
}

output id string = plan.id