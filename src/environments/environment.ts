export const environment = {
  // Vazio = caminho relativo (mesma origem do host que serviu o app) - o Ingress ja
  // roteia /api pro api-gateway no mesmo dominio/IP que serve o web (ver infra/k8s/ingress.yaml),
  // entao nao ha CORS envolvido nem depende de qual host/dominio acessa a aplicacao.
  apiGatewayUrl: '',
};

