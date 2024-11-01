# Launcher microservice

This is an example microservice.
There is a [nomad deployment file](./launcher.nomad) which specifies the required resources, networking and metadata about the service which should get deployed.

## How it works

It's a normal go service at core.
Local development is done via `go run main.go`, with mocked external services (consul is not a requirement, but it automatically 'justworks' if found at localhost:8500)

## Deployment

The deployment of this microservice is the same for all, there's about 6-8 of them (depending on quality), of different languages and sorts, with different dependencies. The steps are:

1. Build a docker image
1. Push the docker image to the microservice's dedicated ECR (scripted, not shown in this project)
1. For nomad deployment:
  1. Port forward to the cluster via ssh to expose nomad (scripted)
  1. Update AWS ECR password in [the nomad file](./launcher.nomad) manually (there was no way to automatically set this up, back in my day)
  1. Update the version tag in the nomad file
  1. `nomad run launcher.nomad`
  1. Done!
1. For ECS (Fargate) deployment:
  1. Update the version tag to the latest in the task definition specification
  1. `terraform apply`
  1. Done!
