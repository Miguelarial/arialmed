output "appwrite_vm_public_ip" {
  value = azurerm_public_ip.appwrite_public_ip.ip_address
}

output "static_web_app_url" {
  value = azurerm_static_web_app.static_web_app.default_host_name
}

