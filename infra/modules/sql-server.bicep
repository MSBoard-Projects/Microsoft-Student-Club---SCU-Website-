param name string
param location string
param tags object
param administratorLogin string

@secure()
@minLength(16)
@maxLength(128)
param administratorPassword string

resource server 'Microsoft.Sql/servers@2023-08-01' = {
  name: name
  location: location
  tags: tags
  properties: {
    version: '12.0'
    administratorLogin: administratorLogin
    administratorLoginPassword: administratorPassword
    minimalTlsVersion: '1.2'
    publicNetworkAccess: 'Enabled'
  }
}

output id string = server.id
output resourceName string = server.name
output fullyQualifiedDomainName string = server.properties.fullyQualifiedDomainName