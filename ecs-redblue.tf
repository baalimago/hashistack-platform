# Simply specify the family to find the latest ACTIVE revision in that family.

module "redblue_ecs" {
  source = "./modules/mesh-task"
  family = "redblue_ecs"
  container_definitions = [
    {
      name      = "redblue"
      image     = "930819553298.dkr.ecr.eu-north-1.amazonaws.com/redblue:0.1.4"
      essential = true
      cpu       = 128
    }
  ]
  acls = false
  port = "8082"
  consul_service_tags = [
    "launcher.description=Intended as dynamic scrensaver.",
    "launcher.subdomain=redblue",
    "launcher.techDetails=This service is ECS. A standardization of one of the playground projects. Each particle uses it's previous coordinate colour to calulate it's new rotation. Then, it leaves an circle with opacity depending on it's current turn degree, left is red, right is blue.",
    "launcher.name=redblue",
    "traefik.enable=true",
    "traefik.http.routers.redblue-https.tls=true",
    "traefik.http.routers.redblue-https.tls.certresolver=myresolver",
    "traefik.http.routers.redblue-https.tls.domains[0].main=lorentz.app",
    "traefik.http.routers.redblue-https.tls.domains[0].sans=*.lorentz.app",
    "traefik.http.routers.redblue-https.rule=Host(`redblue.lorentz.app`)",
  ]
  checks = [
    {
      checkId  = "server-http"
      name     = "HTTP health check on port 8082"
      http     = "http://localhost:8082/"
      method   = "GET"
      timeout  = "10s"
      interval = "5s"
    }
  ]
  retry_join        = ["provider=aws region=eu-north-1 tag_key=nomad-servers tag_value=auto-join"]
  consul_datacenter = "eu-north-1"
}

resource "aws_ecs_service" "redblue_ecs_task" {
  name            = "redblue_ecs_task"
  cluster         = aws_ecs_cluster.lapp-cluster.arn
  task_definition = module.redblue_ecs.task_definition_arn
  desired_count   = 1
  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [module.servers.security_group_id]
  }

  launch_type            = "FARGATE"
  propagate_tags         = "TASK_DEFINITION"
  enable_execute_command = true
}
