variable "location" {
  description = "Location for all resources"
  default     = "UK South"  // Change this from "East US" to "UK South"
}

variable "app_name" {
  description = "Base name for app"
  default     = "arialmed"
}

variable "resource_group_name" {
  description = "Name for the resource group"
  default     = "arialmed-resources"
}

# Additional environment variables
variable "api_key" {
  description = "API key for backend services"
}

variable "public_key" {
  description = "Public key for backend services"
}

variable "database_id" {
  description = "Database ID for the Appwrite database"
}

variable "patient_collection_id" {
  description = "Collection ID for patient data"
}

variable "doctor_collection_id" {
  description = "Collection ID for doctor data"
}

variable "appointment_collection_id" {
  description = "Collection ID for appointment data"
}

variable "bucket_id" {
  description = "Bucket ID for Appwrite storage"
}

variable "api_endpoint" {
  description = "Appwrite API endpoint"
}

variable "admin_passkey" {
  description = "Admin passkey for Appwrite"
}

variable "service_id" {
  description = "Email service ID"
}

variable "template_id" {
  description = "Email template ID"
}

variable "email_api_key" {
  description = "API key for the email service"
}

variable "sentry_auth_token" {
  description = "Sentry authentication token"
}
