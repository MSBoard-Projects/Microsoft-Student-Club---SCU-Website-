param vaultName string
param apiPrincipalId string
param runtimeSecretNames array

@minLength(36)
@maxLength(36)
param deployerObjectId string

@allowed(['User', 'ServicePrincipal', 'Group'])
param deployerPrincipalType string

resource vault 'Microsoft.KeyVault/vaults@2024-11-01' existing = {
  name: vaultName
}

var officerRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'b86a8fe4-44ce-4948-aee5-eccb2c155cd7')
var userRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')

resource deployerRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: vault
  name: guid(vault.id, deployerObjectId, officerRoleId)
  properties: {
    roleDefinitionId: officerRoleId
    principalId: deployerObjectId
    principalType: deployerPrincipalType
  }
}

resource runtimeSecrets 'Microsoft.KeyVault/vaults/secrets@2024-11-01' existing = [for secretName in runtimeSecretNames: {
  parent: vault
  name: secretName
}]

resource apiRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (secretName, secretIndex) in runtimeSecretNames: {
  scope: runtimeSecrets[secretIndex]
  name: guid(runtimeSecrets[secretIndex].id, apiPrincipalId, userRoleId)
  properties: {
    roleDefinitionId: userRoleId
    principalId: apiPrincipalId
    principalType: 'ServicePrincipal'
  }
}]