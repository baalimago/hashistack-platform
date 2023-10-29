terraform {
  required_version = ">= 0.13.1"
}

data "aws_region" "current" {}

provider "aws" {
  region = "eu-north-1"
}
# Uncomment to setup 
# terraform {
#   backend "s3" {
#     bucket = "<bucket-name>"
#     key    = "network/terraform.tfstate"
#     region = "<preferred-region>"
#   }
# }

