module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "4.0.1"

  name            = var.cluster_name
  cidr            = "10.0.0.0/16"
  azs             = ["eu-north-1a"]
  private_subnets = ["10.0.11.0/24"]
  public_subnets  = ["10.0.1.0/24"]

  create_igw = true

  enable_dns_hostnames = true
  enable_nat_gateway   = true
  single_nat_gateway   = true

  vpc_tags = {
    Name = "lorentz-app-vpc-v3"
  }
}

resource "aws_security_group_rule" "allow_tls" {
  type      = "ingress"
  from_port = 443
  to_port   = 443

  cidr_blocks = ["0.0.0.0/0"]

  protocol = "tcp"

  security_group_id = module.servers.security_group_id
}

resource "aws_security_group_rule" "allow_ephemeral_ports" {
  type                     = "ingress"
  from_port                = 1024
  to_port                  = 65535
  protocol                 = "tcp"
  source_security_group_id = module.servers.security_group_id
  security_group_id        = module.servers.security_group_id
}
