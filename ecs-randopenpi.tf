# Simply specify the family to find the latest ACTIVE revision in that family.

module "randopenpi_ecs" {
  source = "./modules/mesh-task"
  family = "randopenpi_ecs"
  container_definitions = [
    {
      name      = "randopenpi"
      image     = "930819553298.dkr.ecr.eu-north-1.amazonaws.com/randopenpi:0.1.3"
      essential = true
      cpu       = 64
    }
  ]

  log_configuration = {
    "logDriver" : "awslogs",
    "options" : {
      "awslogs-region" : "eu-north-1",
      "awslogs-group" : "lapp-log-grp",
      "awslogs-stream-prefix" : "lapp-ecs"
    }
  }
  acls = false
  port = "8080"
  consul_service_tags = [
    "launcher.description=App which takes two public APIs and generates a task from it",
    "launcher.techDetails=ChatGPT is prompted with a list of APIs 5 apis, then it returns the response. Frontend is React, backend is Spring Boot.",
    "launcher.name=randopenpi",
    "traefik.enable=true",
    "traefik.http.routers.randopenpi-https.tls=true",
    "traefik.http.routers.randopenpi-https.tls.certresolver=myresolver",
    "traefik.http.routers.randopenpi-https.tls.domains[0].main=lorentz.app",
    "traefik.http.routers.randopenpi-https.tls.domains[0].sans=*.lorentz.app",
    "traefik.http.routers.randopenpi-https.rule=Host(`randopenpi.lorentz.app`)",
  ]
  checks = [
    {
      checkId  = "server-http"
      name     = "HTTP health check on port 8080"
      http     = "http://localhost:8080/"
      method   = "GET"
      timeout  = "10s"
      interval = "5s"
    }
  ]

  task_role      = aws_iam_role.task
  execution_role = aws_iam_role.execution

  retry_join        = ["provider=aws region=eu-north-1 tag_key=nomad-servers tag_value=auto-join"]
  consul_datacenter = "eu-north-1"
}

resource "aws_ecs_service" "randopenpi_ecs_task" {
  name            = "randopenpi_ecs_task"
  cluster         = aws_ecs_cluster.lapp-cluster.arn
  task_definition = module.randopenpi_ecs.task_definition_arn
  desired_count   = 1
  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [module.servers.security_group_id]
  }

  launch_type            = "FARGATE"
  propagate_tags         = "TASK_DEFINITION"
  enable_execute_command = true
}
