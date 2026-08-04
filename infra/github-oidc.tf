resource "azuread_application" "github" {
  display_name = "github-actions-online-market"
}

resource "azuread_service_principal" "github" {
  client_id = azuread_application.github.client_id
}

resource "azuread_application_federated_identity_credential" "main_branch" {
  application_id = azuread_application.github.id
  display_name   = "github-main"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_repository}:ref:refs/heads/main"
}

resource "azuread_application_federated_identity_credential" "pull_request" {
  application_id = azuread_application.github.id
  display_name   = "github-pr"
  audiences      = ["api://AzureADTokenExchange"]
  issuer         = "https://token.actions.githubusercontent.com"
  subject        = "repo:${var.github_repository}:pull_request"
}

resource "azurerm_role_assignment" "github_rg_contributor" {
  scope                = azurerm_resource_group.main.id
  role_definition_name = "Contributor"
  principal_id         = azuread_service_principal.github.object_id
}

data "azurerm_storage_account" "tfstate" {
  name                = "stonlinemarkettfstate"
  resource_group_name = "rg-terraform-state"
}

resource "azurerm_role_assignment" "github_tfstate_blob_contributor" {
  scope                = data.azurerm_storage_account.tfstate.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azuread_service_principal.github.object_id
}
