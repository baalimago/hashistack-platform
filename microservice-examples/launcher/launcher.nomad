job "launcher" {
  datacenters = ["eu-north-1a"]

  group "webservers" {
    count = 1

    spread {
      attribute = node.datacenter
    }

    network {
      mode = "host"
      port "http" {
        static = 8070
      }

      port "metrics" {
        static = 8071
      }
    }

    task "server" {
      driver = "docker"
      config {
        image        = "930819553298.dkr.ecr.eu-north-1.amazonaws.com/launcher:0.3.10"
        ports        = ["http"]
        network_mode = "host"

        auth {
          username = "AWS"
          password = "<temporary-password-from-aws-cli>"
        }
      }

      resources {
        cpu    = 20
        memory = 32
      }
    }

    service {
      name = "launcher"
      port = "http"
      tags = [
        "traefik.enable=true",
        "traefik.consulcatalog.connect=false",
        "traefik.http.routers.launcher-https.tls=true",
        "traefik.http.routers.launcher-https.tls.certresolver=myresolver",
        "traefik.http.routers.launcher-https.tls.domains[0].main=lorentz.app",
        "traefik.http.routers.launcher-https.tls.domains[0].sans=*.lorentz.app",
        "traefik.http.routers.launcher-https.rule=Host(`www.lorentz.app`) || Host(`lorentz.app`)",
      ]

      check {
        port     = "http"
        type     = "http"
        path     = "/"
        interval = "10s"
        timeout  = "2s"
      }
    }
  }
}
