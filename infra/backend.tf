terraform {
  backend "azurerm" {
    resource_group_name  = "rg-terraform-state"
    storage_account_name = "stonlinemarkettfstate"
    container_name       = "tfstate"
    key                  = "prod.terraform.tfstate"
  }
}
