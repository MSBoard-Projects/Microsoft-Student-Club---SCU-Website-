param name string
param location string
param tags object

@minLength(36)
@maxLength(36)
param principalId string

@minLength(1)
param principalName string

@allowed(['User', 'Group', 'Application'])
param principalType string

resource server 'Microsoft.Sql/servers@2023-08-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    version: '12.0'
    administrators: {
      administratorType: 'ActiveDirectory'
      principalType: principalType
      login: principalName
      sid: principalId
      tenantId: subscription().tenantId
      azureADOnlyAuthentication: true
    }
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

output id string = server.id
output resourceName string = server.name
output fullyQualifiedDomainName string = server.properties.fullyQualifiedDomainName