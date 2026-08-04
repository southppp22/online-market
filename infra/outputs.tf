output "app_fqdn" {
  value = azurerm_container_app.api.ingress[0].fqdn
}

output "acr_login_server" {
  value = azurerm_container_registry.main.login_server
}

output "migration_job_name" {
  value = azurerm_container_app_job.migration.name
}

output "github_actions_client_id" {
  value = azuread_application.github.client_id
}
