param serverName string
param outboundIpAddresses string

resource server 'Microsoft.Sql/servers@2023-08-01' existing = {
  name: serverName
}

var addresses = filter(union(split(outboundIpAddresses, ','), []), address => !empty(trim(address)) && trim(address) != '0.0.0.0')

resource rules 'Microsoft.Sql/servers/firewallRules@2023-08-01' = [for address in addresses: {
  parent: server
  name: 'api-${replace(trim(address), '.', '-')}'
  properties: {
    startIpAddress: trim(address)
    endIpAddress: trim(address)
  }
}]