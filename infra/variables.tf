variable "subscription_id" {
  type = string
}

variable "location" {
  type    = string
  default = "koreacentral"
}

# GitHub OIDC sub claim의 rename-safe 형식(owner@id/repo@id)과 일치해야 한다
variable "github_repository" {
  type    = string
  default = "southppp22@68219675/online-market@1316776326"
}
