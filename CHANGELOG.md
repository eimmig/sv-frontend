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
- [SV-228](https://stakevault.atlassian.net/browse/SV-228) - RF01/RF02 (UI) - Autenticacao e gestao de usuarios do tenant
- [SV-229](https://stakevault.atlassian.net/browse/SV-229) - AuthService (Signals) + interceptor de Authorization + tela de login real
- [SV-230](https://stakevault.atlassian.net/browse/SV-230) - authGuard/adminGuard + nav minima do app shell + banner mustChangePassword
- [SV-231](https://stakevault.atlassian.net/browse/SV-231) - Tela de gestao de usuarios do tenant (lista + criar, admin-only)
- [SV-232](https://stakevault.atlassian.net/browse/SV-232) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-233](https://stakevault.atlassian.net/browse/SV-233) - RF03 (UI) - Gestao de casas de apostas
- [SV-234](https://stakevault.atlassian.net/browse/SV-234) - BettingHousesApi + tela real (lista + criar)
- [SV-235](https://stakevault.atlassian.net/browse/SV-235) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-236](https://stakevault.atlassian.net/browse/SV-236) - BettingHousesApi + tela real (lista + criar)
- [SV-237](https://stakevault.atlassian.net/browse/SV-237) - Cadastro dos catalogos base (esportes, ligas, mercados, tipsters)
- [SV-238](https://stakevault.atlassian.net/browse/SV-238) - catalogApi + CatalogManager reaproveitavel + pagina Catalogs (4 abas)
- [SV-239](https://stakevault.atlassian.net/browse/SV-239) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-240](https://stakevault.atlassian.net/browse/SV-240) - RF04 (UI) - Registro manual de apostas
- [SV-241](https://stakevault.atlassian.net/browse/SV-241) - BetsApi + formulario real (Idempotency-Key, dropdowns, regras de Shneiderman)
- [SV-242](https://stakevault.atlassian.net/browse/SV-242) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-243](https://stakevault.atlassian.net/browse/SV-243) - RF08 (UI) - Historico de operacoes
- [SV-244](https://stakevault.atlassian.net/browse/SV-244) - BetsApi.list()/TransactionsApi + tela real (2 abas, filtros, paginacao)
- [SV-245](https://stakevault.atlassian.net/browse/SV-245) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-246](https://stakevault.atlassian.net/browse/SV-246) - RF10/RF11 (UI) - Dashboards e filtros dinamicos
- [SV-247](https://stakevault.atlassian.net/browse/SV-247) - StatisticsApi + core/percent.ts + monthly-profit-chart + Dashboard real (filtros, cards, grafico, breakdown por aba)
- [SV-248](https://stakevault.atlassian.net/browse/SV-248) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-249](https://stakevault.atlassian.net/browse/SV-249) - RF12 (UI) - Atualizar status da aposta (ganha/perdida/devolvida)
- [SV-250](https://stakevault.atlassian.net/browse/SV-250) - BetsApi.updateStatus + controles de status na aba Apostas do historico
- [SV-251](https://stakevault.atlassian.net/browse/SV-251) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-252](https://stakevault.atlassian.net/browse/SV-252) - RF13 (UI) - Movimentacoes financeiras (depositos e saques)
- [SV-253](https://stakevault.atlassian.net/browse/SV-253) - TransactionsApi.create + formulario de nova movimentacao na aba Movimentacoes do historico
- [SV-254](https://stakevault.atlassian.net/browse/SV-254) - i18n, Playwright, CHANGELOG e verificacao final
- [SV-255](https://stakevault.atlassian.net/browse/SV-255) - Polish visual moderno - sistema todo (design refresh cross-screen)
- [SV-256](https://stakevault.atlassian.net/browse/SV-256) - Language selector + theme toggle com estilo real (fix de contraste) + tela de login elevada
- [SV-257](https://stakevault.atlassian.net/browse/SV-257) - Polish visual - dashboard + casas de apostas
- [SV-258](https://stakevault.atlassian.net/browse/SV-258) - Polish visual - registro de aposta + historico (apostas/movimentacoes)
- [SV-259](https://stakevault.atlassian.net/browse/SV-259) - Polish visual - usuarios + catalogos
- [SV-260](https://stakevault.atlassian.net/browse/SV-260) - Auditoria visual final, CHANGELOG e verificacao final
- [SV-303](https://stakevault.atlassian.net/browse/SV-303) - Tela "Buscar Estatisticas"
- [SV-304](https://stakevault.atlassian.net/browse/SV-304) - Camada core: statistics-search-api + utils compartilhados
- [SV-305](https://stakevault.atlassian.net/browse/SV-305) - shared/kpi-card + refactor do dashboard pra reusa-lo
- [SV-306](https://stakevault.atlassian.net/browse/SV-306) - shared/equity-curve-chart
- [SV-307](https://stakevault.atlassian.net/browse/SV-307) - Pagina search-statistics: formulario, cascata sport->time, cards, estados vazios
- [SV-308](https://stakevault.atlassian.net/browse/SV-308) - Rota, nav e i18n (3 locales)
- [SV-309](https://stakevault.atlassian.net/browse/SV-309) - Testes: unitarios restantes + Playwright E2E + docs/TESTING.md
- [SV-310](https://stakevault.atlassian.net/browse/SV-310) - CHANGELOG e verificacao final
- [SV-339](https://stakevault.atlassian.net/browse/SV-339) - Dockerfile de producao + build e push da imagem no CI
- [SV-340](https://stakevault.atlassian.net/browse/SV-340) - Dockerfile + nginx.conf + .dockerignore + job build-and-push-image
- [SV-341](https://stakevault.atlassian.net/browse/SV-341) - CHANGELOG e verificacao final
- [SV-342](https://stakevault.atlassian.net/browse/SV-342) - Achados reais no primeiro develop->main de verdade deste repositorio
- [SV-362](https://stakevault.atlassian.net/browse/SV-362) - Dashboard consolidado - filtro de periodo com presets e novos cards de KPI
- [SV-363](https://stakevault.atlassian.net/browse/SV-363) - BankrollApi + SettingsApi novos, StatisticsApi.BetMetrics estendido
- [SV-364](https://stakevault.atlassian.net/browse/SV-364) - shared/period-preset-filter (presets + date range picker)
- [SV-365](https://stakevault.atlassian.net/browse/SV-365) - Dashboard: period-preset-filter substitui inputs crus, forkJoin com bankroll/settings, cards novos
- [SV-366](https://stakevault.atlassian.net/browse/SV-366) - Campo admin-only de configuracao de unidade (PATCH /api/v1/settings)
- [SV-367](https://stakevault.atlassian.net/browse/SV-367) - Playwright, QA visual final, CHANGELOG e verificacao final
- [SV-368](https://stakevault.atlassian.net/browse/SV-368) - Pagina "Relatorio do periodo"
- [SV-369](https://stakevault.atlassian.net/browse/SV-369) - StatisticsApi.getDaily() novo (GET /api/v1/statistics/daily)
- [SV-370](https://stakevault.atlassian.net/browse/SV-370) - Modulo de calculo puro (period-report-metrics.ts) com oraculo do print de referencia
- [SV-371](https://stakevault.atlassian.net/browse/SV-371) - Pagina period-report: forkJoin, tabela dia a dia, cards de resumo, rota + nav + i18n
- [SV-372](https://stakevault.atlassian.net/browse/SV-372) - Playwright, QA visual final, CHANGELOG e verificacao final
