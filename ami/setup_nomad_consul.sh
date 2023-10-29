#!/bin/sh
set -e

# Environment variables are set by packer
/tmp/terraform-aws/modules/install-nomad/install-nomad --version "${NOMAD_VERSION}"
/tmp/terraform-aws/modules/install-consul/install-consul --version "${CONSUL_VERSION}"

sudo mv /tmp/consul-config/ami-conf.json /opt/consul/config/ami-conf.json
sudo mkdir -p /opt/acme/data
sudo mv /tmp/nomad-config/enable-acme-volume.hcl /opt/nomad/config/enable-acme-volume.hcl

# Taken from https://www.nomadproject.io/docs/integrations/consul-connect
curl -L -o cni-plugins.tgz "https://github.com/containernetworking/plugins/releases/download/v1.0.0/cni-plugins-linux-$( [ $(uname -m) = aarch64 ] && echo arm64 || echo amd64)"-v1.0.0.tgz
sudo mkdir -p /opt/cni/bin
sudo tar -C /opt/cni/bin -xzf cni-plugins.tgz

echo 1 | sudo tee /proc/sys/net/bridge/bridge-nf-call-arptables
echo 1 | sudo tee /proc/sys/net/bridge/bridge-nf-call-ip6tables
echo 1 | sudo tee /proc/sys/net/bridge/bridge-nf-call-iptables

sudo bash -c "cat >> /etc/sysctl.d/99-consul-connect.conf" << EOF 
net.bridge.bridge-nf-call-arptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.bridge.bridge-nf-call-iptables = 1
EOF
