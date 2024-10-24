terraform {
  backend "azurerm" {
    resource_group_name   = "arialmed-backend"
    storage_account_name  = "arialmeddb"
    container_name        = "tfstate"
    key                   = "terraform.tfstate"
  }
}
