#!/bin/bash
set -e

NAMESPACE="wallpaper"
SERVICE_ACCOUNT="wallpaper-deployer"
DIR="$(dirname "$0")"
OUTPUT_FILE="${1:-$DIR/wallpaper-kubeconfig.yaml}"

kubectl apply -f "$DIR/namespace.yaml"
kubectl apply -f "$DIR/rbac.yaml"

CLUSTER_NAME=$(kubectl config view --minify -o jsonpath='{.clusters[0].name}')
CLUSTER_SERVER=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}')
CLUSTER_CA=$(kubectl config view --minify --raw -o jsonpath='{.clusters[0].cluster.certificate-authority-data}')
TOKEN=$(kubectl create token "$SERVICE_ACCOUNT" -n "$NAMESPACE" --duration=8760h)

cat > "$OUTPUT_FILE" <<CFG
apiVersion: v1
kind: Config
clusters:
- name: ${CLUSTER_NAME}
  cluster:
    certificate-authority-data: ${CLUSTER_CA}
    server: ${CLUSTER_SERVER}
contexts:
- name: ${SERVICE_ACCOUNT}
  context:
    cluster: ${CLUSTER_NAME}
    namespace: ${NAMESPACE}
    user: ${SERVICE_ACCOUNT}
current-context: ${SERVICE_ACCOUNT}
users:
- name: ${SERVICE_ACCOUNT}
  user:
    token: ${TOKEN}
CFG

echo "Kubeconfig written to: $OUTPUT_FILE"
echo "Add it as the KUBE_CONFIG_DATA secret on the production environment: base64 -w0 \"$OUTPUT_FILE\""
