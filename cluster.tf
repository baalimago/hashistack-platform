data "aws_ami" "nomad_consul" {
  most_recent = true

  # If we change the AWS Account in which test are run, update this value.
  owners = ["930819553298"]

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "is-public"
    values = ["false"]
  }

  filter {
    name   = "name"
    values = ["nomad-consul-ubuntu*"]
  }
}

module "servers" {
  source = "./modules/consul-cluster"

  cluster_name  = var.cluster_name
  cluster_size  = var.num_servers
  instance_type = var.server_instance_type

  # The EC2 Instances will use these tags to automatically discover each other and form a cluster
  cluster_tag_key   = var.cluster_tag_key
  cluster_tag_value = var.cluster_tag_value

  ami_id    = var.ami_id == null ? data.aws_ami.nomad_consul.image_id : var.ami_id
  user_data = data.template_file.run_script.rendered

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.public_subnets

  # To make testing easier, we allow requests from any IP address here but in a production deployment, we strongly
  # recommend you limit this to the IP address ranges of known, trusted servers inside your VPC.
  allowed_ssh_cidr_blocks = [var.home_ip]

  allowed_inbound_cidr_blocks = ["10.0.1.0/24"]
  ssh_key_name                = var.ssh_key_name

  tags = [
    {
      key                 = "Environment"
      value               = "production"
      propagate_at_launch = true
    },
  ]
}

module "nomad_security_group_rules" {
  source = "./modules/nomad-security-group-rules"

  security_group_id = module.servers.security_group_id

  allowed_inbound_cidr_blocks = ["10.0.1.0/24"]
}

data "template_file" "run_script" {
  template = file("./run-scripts/start.sh")

  vars = {
    cluster_tag_key   = var.cluster_tag_key
    cluster_tag_value = var.cluster_tag_value
    num_servers       = var.num_servers
  }
}

module "consul_iam_policies" {
  source = "./modules/consul-iam-policies"

  iam_role_id = module.servers.iam_role_id
}
