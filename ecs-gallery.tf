# Simply specify the family to find the latest ACTIVE revision in that family.

module "gallery_ecs" {
  source = "./modules/mesh-task"
  family = "gallery_ecs"
  container_definitions = [
    {
      name      = "gallery"
      image     = "930819553298.dkr.ecr.eu-north-1.amazonaws.com/gallery:1.1.8"
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
  port = "8060"
  consul_service_tags = [
    "launcher.description=Image gallery of the pictures I take",
    "launcher.techDetails=I upload my images via a tool written in go which takes the masters (very large) and uploads two versions, one small and one large, into a s3 bucket. Then a vertically scalable webserver caches the images + and serves them along with the frontend, written in 'vanilla' js.",
    "launcher.name=gallery",
    "traefik.enable=true",
    "traefik.http.routers.gallery-https.tls=true",
    "traefik.http.routers.gallery-https.tls.certresolver=myresolver",
    "traefik.http.routers.gallery-https.tls.domains[0].main=lorentz.app",
    "traefik.http.routers.gallery-https.tls.domains[0].sans=*.lorentz.app",
    "traefik.http.routers.gallery-https.rule=Host(`gallery.lorentz.app`)",
  ]
  checks = [
    {
      checkId  = "server-http"
      name     = "HTTP health check on port 8080"
      http     = "http://localhost:8060/"
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

resource "aws_ecs_service" "gallery_ecs_task" {
  name            = "gallery_ecs_task"
  cluster         = aws_ecs_cluster.lapp-cluster.arn
  task_definition = module.gallery_ecs.task_definition_arn
  desired_count   = 1
  network_configuration {
    subnets         = module.vpc.private_subnets
    security_groups = [module.servers.security_group_id]
  }

  launch_type            = "FARGATE"
  propagate_tags         = "TASK_DEFINITION"
  enable_execute_command = true
}
