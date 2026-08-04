resource "random_password" "mysql" {
  length           = 32
  special          = true
  override_special = "!#$%&*()-_=+"
}

resource "azurerm_mysql_flexible_server" "main" {
  name                   = "mysql-online-market-prod"
  resource_group_name    = azurerm_resource_group.main.name
  location               = azurerm_resource_group.main.location
  administrator_login    = "marketadmin"
  administrator_password = random_password.mysql.result
  sku_name               = "B_Standard_B1ms"
  version                = "8.0.21"
  delegated_subnet_id    = azurerm_subnet.mysql.id
  private_dns_zone_id    = azurerm_private_dns_zone.mysql.id

  storage {
    size_gb = 20
  }

  depends_on = [azurerm_private_dns_zone_virtual_network_link.mysql]
}

resource "azurerm_mysql_flexible_database" "main" {
  name                = "online_market"
  resource_group_name = azurerm_resource_group.main.name
  server_name         = azurerm_mysql_flexible_server.main.name
  charset             = "utf8mb4"
  collation           = "utf8mb4_unicode_ci"
}
