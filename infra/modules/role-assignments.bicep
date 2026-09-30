param vaultName string
param apiPrincipalId string
param storageAccountName string
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
var delegatorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'db58b8e5-c6ad-4a2a-8342-4190687cbf4a')
var contributorRoleId = subscriptionResourceId('Microsoft.Authorization/roleDefinitions', 'ba92f5b4-2d11-453d-a403-e96b0029c9fe')
var containerNames = ['member-images', 'event-images', 'certificates']

resource storage 'Microsoft.Storage/storageAccounts@2025-01-01' existing = {
  name: storageAccountName
}

resource blobService 'Microsoft.Storage/storageAccounts/blobServices@2025-01-01' existing = {
  parent: storage
  name: 'default'
}

resource containers 'Microsoft.Storage/storageAccounts/blobServices/containers@2025-01-01' existing = [for containerName in containerNames: {
  parent: blobService
  name: containerName
}]

resource apiDelegator 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  scope: storage
  name: guid(storage.id, apiPrincipalId, delegatorRoleId)
  properties: {
    roleDefinitionId: delegatorRoleId
    principalId: apiPrincipalId
    principalType: 'ServicePrincipal'
  }
}

resource apiBlobRoles 'Microsoft.Authorization/roleAssignments@2022-04-01' = [for (containerName, containerIndex) in containerNames: {
  scope: containers[containerIndex]
  name: guid(containers[containerIndex].id, apiPrincipalId, contributorRoleId)
  properties: {
    roleDefinitionId: contributorRoleId
    principalId: apiPrincipalId
    principalType: 'ServicePrincipal'
  }
}]

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