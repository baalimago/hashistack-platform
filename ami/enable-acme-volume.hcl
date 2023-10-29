client {
  host_volume "acme-certs" {
    path = "/opt/acme/data"
    read_only = false
  }
}