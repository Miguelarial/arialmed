provider "azurerm" {
  features {}
  subscription_id = "1890cf9c-0a50-462c-b7ea-a7acbb3f0125"
}

# Resource Group
resource "azurerm_resource_group" "app" {
  name     = var.resource_group_name
  location = var.location
}

# SSH Key for VM
resource "tls_private_key" "ssh" {
  algorithm = "RSA"
  rsa_bits  = 4096
}

# Virtual Network for the Appwrite VM
resource "azurerm_virtual_network" "app_network" {
  name                = "app-network"
  resource_group_name = azurerm_resource_group.app.name
  address_space       = ["10.0.0.0/16"]
  location            = var.location
}

# Subnet for the Appwrite VM
resource "azurerm_subnet" "app_subnet" {
  name                 = "app-subnet"
  resource_group_name  = azurerm_resource_group.app.name
  virtual_network_name = azurerm_virtual_network.app_network.name
  address_prefixes     = ["10.0.1.0/24"]
}

# Network Interface for Appwrite VM
resource "azurerm_network_interface" "appwrite_nic" {
  name                = "appwrite-nic"
  resource_group_name = azurerm_resource_group.app.name
  location            = var.location

  ip_configuration {
    name                          = "appwrite-ip-configuration"
    subnet_id                     = azurerm_subnet.app_subnet.id
    private_ip_address_allocation = "Dynamic"
    public_ip_address_id          = azurerm_public_ip.appwrite_public_ip.id
  }
}

# VM for Appwrite
resource "azurerm_linux_virtual_machine" "appwrite_vm" {
  name                            = "appwrite-vm"
  resource_group_name             = azurerm_resource_group.app.name
  location                        = var.location
  size                            = "Standard_B1ms"
  admin_username                  = "adminuser"
  disable_password_authentication = true

  network_interface_ids = [azurerm_network_interface.appwrite_nic.id]

  admin_ssh_key {
    username   = "adminuser"
    public_key = tls_private_key.ssh.public_key_openssh
  }

  os_disk {
    caching              = "ReadWrite"
    storage_account_type = "Standard_LRS"
  }

  source_image_reference {
    publisher = "Canonical"
    offer     = "UbuntuServer"
    sku       = "18.04-LTS"
    version   = "latest"
  }

  custom_data = base64encode(<<-EOF
              #!/bin/bash
              sudo apt-get update
              sudo apt-get install -y docker.io
              sudo docker run -d --name appwrite --restart=always -p 80:80 -p 443:443 appwrite/appwrite
              EOF
  )

  tags = {
    environment = "Development"
  }
}

# Public IP for Appwrite VM
resource "azurerm_public_ip" "appwrite_public_ip" {
  name              = "appwrite-public-ip"
  resource_group_name = azurerm_resource_group.app.name
  location          = var.location
  allocation_method = "Static"
  sku               = "Standard"
}

# Schedule VM to shut down during off-hours (using Azure Automation)
resource "azurerm_automation_account" "shutdown_scheduler" {
  name                = "vm-shutdown-scheduler"
  location            = var.location
  resource_group_name = azurerm_resource_group.app.name
  sku_name            = "Free"
}

# Static Website (Frontend)
resource "azurerm_static_web_app" "static_web_app" {
  name                = "${var.app_name}-frontend"
  resource_group_name = azurerm_resource_group.app.name
  location            = "westeurope"
  sku_tier                 = "Free"
}

# Storage Account for Terraform State
resource "azurerm_storage_account" "tfstate" {
  name                     = "arialmedstate"
  resource_group_name      = azurerm_resource_group.app.name
  location                 = var.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
}
