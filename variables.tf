variable "ami_id" {
  description = "The ID of the AMI to run in the cluster."
  type        = string
  default     = "ami-074d12e4842e5c8fa"
}

variable "cluster_name" {
  description = "What to name the cluster and all of its associated resources"
  type        = string
  default     = "lorentz-app-cluster-server"
}

variable "server_instance_type" {
  description = "What kind of instance type to use for the nomad servers"
  type        = string
  default     = "t3.small"
}

variable "instance_type" {
  description = "What kind of instance type to use for the nomad clients"
  type        = string
  default     = "t3.small"
}

variable "num_servers" {
  description = "The number of server nodes to deploy. We strongly recommend using 3 or 5."
  type        = number
  default     = 1
}

variable "num_clients" {
  description = "The number of client nodes to deploy. You can deploy as many as you need to run your jobs."
  type        = number
  default     = 1
}

variable "cluster_tag_key" {
  description = "The tag the EC2 Instances will look for to automatically discover each other and form a cluster."
  type        = string
  default     = "nomad-servers"
}

variable "cluster_tag_value" {
  description = "Add a tag with key var.cluster_tag_key and this value to each Instance in the ASG. This can be used to automatically find other Consul nodes and form a cluster."
  type        = string
  default     = "auto-join"
}

variable "ssh_key_name" {
  description = "The name of an EC2 Key Pair that can be used to SSH to the EC2 Instances in this cluster. Set to an empty string to not associate a Key Pair."
  type        = string
  default     = "nomad-cluster-ec2-t3micro-eu-north-1"
}

variable "home_ip" {
  description = "String of home IP's in CIDR block form"
  type        = string
}

variable "ecs_iam_role_path" {
  description = "The path where ecs IAM roles will be created."
  type        = string
  default     = "/consul-ecs/"
}
