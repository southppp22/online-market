resource "azurerm_managed_redis" "main" {
  name                      = "redis-online-market-prod"
  resource_group_name       = azurerm_resource_group.main.name
  location                  = azurerm_resource_group.main.location
  sku_name                  = "Balanced_B0"
  high_availability_enabled = false
  public_network_access     = "Disabled"

  default_database {
    clustering_policy                  = "EnterpriseCluster"
    access_keys_authentication_enabled = true
  }
}

resource "azurerm_private_endpoint" "redis" {
  name                = "pe-redis-online-market"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
  subnet_id           = azurerm_subnet.pe.id

  private_service_connection {
    name                           = "redis"
    private_connection_resource_id = azurerm_managed_redis.main.id
    subresource_names              = ["redisEnterprise"]
    is_manual_connection           = false
  }

  private_dns_zone_group {
    name                 = "redis"
    private_dns_zone_ids = [azurerm_private_dns_zone.redis.id]
  }
}
