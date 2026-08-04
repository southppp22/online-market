resource "azurerm_log_analytics_workspace" "main" {
  name                = "log-online-market-prod"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "main" {
  name                       = "cae-online-market-prod"
  resource_group_name        = azurerm_resource_group.main.name
  location                   = azurerm_resource_group.main.location
  log_analytics_workspace_id = azurerm_log_analytics_workspace.main.id
  infrastructure_subnet_id   = azurerm_subnet.aca.id

  workload_profile {
    name                  = "Consumption"
    workload_profile_type = "Consumption"
    minimum_count         = 0
    maximum_count         = 0
  }
}

resource "azurerm_container_app" "api" {
  name                         = "online-market-api"
  resource_group_name          = azurerm_resource_group.main.name
  container_app_environment_id = azurerm_container_app_environment.main.id
  revision_mode                = "Single"
  workload_profile_name        = "Consumption"

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.app.id
  }

  secret {
    name                = "db-password"
    identity            = azurerm_user_assigned_identity.app.id
    key_vault_secret_id = azurerm_key_vault_secret.db_password.versionless_id
  }

  secret {
    name                = "redis-access-key"
    identity            = azurerm_user_assigned_identity.app.id
    key_vault_secret_id = azurerm_key_vault_secret.redis_access_key.versionless_id
  }

  ingress {
    external_enabled = true
    target_port      = 3000

    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    min_replicas = 1
    max_replicas = 3

    container {
      name   = "online-market-api"
      image  = "mcr.microsoft.com/k8se/quickstart:latest"
      cpu    = 0.5
      memory = "1Gi"

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "DB_HOST"
        value = azurerm_mysql_flexible_server.main.fqdn
      }

      env {
        name  = "DB_PORT"
        value = "3306"
      }

      env {
        name  = "DB_USERNAME"
        value = azurerm_mysql_flexible_server.main.administrator_login
      }

      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "DB_DATABASE"
        value = azurerm_mysql_flexible_database.main.name
      }

      env {
        name  = "DB_SSL"
        value = "true"
      }

      env {
        name  = "REDIS_HOST"
        value = azurerm_managed_redis.main.hostname
      }

      env {
        name  = "REDIS_PORT"
        value = tostring(azurerm_managed_redis.main.default_database[0].port)
      }

      env {
        name  = "REDIS_TLS"
        value = "true"
      }

      env {
        name        = "REDIS_PASSWORD"
        secret_name = "redis-access-key"
      }

      liveness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health"
      }

      readiness_probe {
        transport = "HTTP"
        port      = 3000
        path      = "/api/health"
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}

resource "azurerm_container_app_job" "migration" {
  name                         = "online-market-migration"
  resource_group_name          = azurerm_resource_group.main.name
  location                     = azurerm_resource_group.main.location
  container_app_environment_id = azurerm_container_app_environment.main.id
  workload_profile_name        = "Consumption"

  replica_timeout_in_seconds = 600
  replica_retry_limit        = 0

  manual_trigger_config {
    parallelism              = 1
    replica_completion_count = 1
  }

  identity {
    type         = "UserAssigned"
    identity_ids = [azurerm_user_assigned_identity.app.id]
  }

  registry {
    server   = azurerm_container_registry.main.login_server
    identity = azurerm_user_assigned_identity.app.id
  }

  secret {
    name                = "db-password"
    identity            = azurerm_user_assigned_identity.app.id
    key_vault_secret_id = azurerm_key_vault_secret.db_password.versionless_id
  }

  template {
    container {
      name    = "migration"
      image   = "mcr.microsoft.com/k8se/quickstart:latest"
      cpu     = 0.5
      memory  = "1Gi"
      command = ["node", "node_modules/typeorm/cli.js", "migration:run", "-d", "dist/src/config/typeorm.datasource.js"]

      env {
        name  = "DB_HOST"
        value = azurerm_mysql_flexible_server.main.fqdn
      }

      env {
        name  = "DB_PORT"
        value = "3306"
      }

      env {
        name  = "DB_USERNAME"
        value = azurerm_mysql_flexible_server.main.administrator_login
      }

      env {
        name        = "DB_PASSWORD"
        secret_name = "db-password"
      }

      env {
        name  = "DB_DATABASE"
        value = azurerm_mysql_flexible_database.main.name
      }

      env {
        name  = "DB_SSL"
        value = "true"
      }
    }
  }

  lifecycle {
    ignore_changes = [template[0].container[0].image]
  }
}
