# Launcher microservice

This is an example microservice.
There is a [nomad deployment file](./launcher.nomad) which specifies the required resources, networking and metadata about the service which should get deployed.

## How it works
The different microservices all works differently.
They're written in a wide array of languages, depending on what I wanted to experiment with (Go, Rust, Quarkus).

The principles they all follow is the need for isolated deployment, and local development.
Although most have external dependencies, none are required for development.
I explore this topic a bit closer here in [my blogpost about service isolation](https://lorentz.app/blog-item.html?id=service-isolation).

So, to try out this launcher, simply run `go run .`, and you'll see what the launcher (and therefore `https://lorentz.app`) used to looked like.

## Deployment

The deployment of this microservice is the same for all, even though they all have quite different dependencies and configurations. The steps are:

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
