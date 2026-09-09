# Changelog

Todas as mudanças notáveis deste app são documentadas neste arquivo. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Toda feature que altera este app
adiciona uma entrada em `[Unreleased]` — verificado automaticamente pela pipeline de CI (ver
`docs/CI-CD.md`).

## [Unreleased]

### Fixed

- Chave do projeto no SonarCloud corrigida para `eimmig_sv-frontend`. O SonarCloud gera a chave como
  `<org>_<repo>` ao importar um repositório do GitHub; a forma sem prefixo, usada até aqui, faria a
  análise falhar com projeto inexistente.
- [SV-215](https://stakevault.atlassian.net/browse/SV-215) - Assets de logo + splash animado
- [SV-216](https://stakevault.atlassian.net/browse/SV-216) - ngx-echarts instalado e provado
- [SV-217](https://stakevault.atlassian.net/browse/SV-217) - Playwright + gate de cobertura 80%
- [SV-218](https://stakevault.atlassian.net/browse/SV-218) - Impeccable + taste-skill + huashu-design + DESIGN.md pre-escrito
- [SV-219](https://stakevault.atlassian.net/browse/SV-219) - CHANGELOG, Test Suite Auditor e verificacao final
- [SV-209](https://stakevault.atlassian.net/browse/SV-209) - Setup do projeto Angular
- [SV-210](https://stakevault.atlassian.net/browse/SV-210) - ng new real (Angular 22.x) + roteamento + HttpClient com interceptor Accept-Language + environments
- [SV-211](https://stakevault.atlassian.net/browse/SV-211) - Angular Material M3 + tema claro/escuro + tokens de cor StakeVault
- [SV-212](https://stakevault.atlassian.net/browse/SV-212) - transloco i18n (pt-BR/en-US/es) + seletor de idioma persistido
- [SV-213](https://stakevault.atlassian.net/browse/SV-213) - app-panel-layout + app-panel (layout em paineis)
- [SV-220](https://stakevault.atlassian.net/browse/SV-220) - Retrofit do gate de qualidade do SonarCloud
- [SV-221](https://stakevault.atlassian.net/browse/SV-221) - sonar.qualitygate.wait + validate-sonar-issues.py
