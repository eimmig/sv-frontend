# Changelog

Todas as mudanças notáveis deste app são documentadas neste arquivo. Formato baseado em
[Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/). Toda feature que altera este app
adiciona uma entrada em `[Unreleased]` — verificado automaticamente pela pipeline de CI (ver
`docs/CI-CD.md`).

## [Unreleased]

### Added

- Tela "Vincular Telegram" (`feat-027`, rota `/telegram-link`): gera um código de curta duração
  via `POST /api/v1/telegram-links` e mostra código + expiração, com entrada nova em
  `app-side-nav`.
- Dashboard "Por tipo de aposta" (`feat-026`, rota `/bet-type-dashboard`): ranking PRE/LIVE
  reaproveitando `shared/catalog-dashboard`, consumindo o segmento `byBetType` novo em
  `StatisticsDashboard`.
- Tela "Visão geral" pós-login (`feat-029`, epic-021, rota `/overview`): curva de lucro
  acumulado vitalícia, 4 cards (Lucro Total, Pré/Live, Lucro Médio Mensal, ROI) e tabela mensal
  Jan-Dez do ano corrente. **Login agora redireciona para cá em vez de `/dashboard`** —
  `/dashboard` continua acessível como item normal de nav.

### Changed

- `register-bet` (`feat-026`): campo "Tipo de aposta" trocado de texto livre para `mat-select`
  com 2 opções fixas (`pre`/`live`) + "não classificado", alinhado ao enum do backend.

- `app-login-border-trace` (`feat-018.3`) reformulada: 1 caminho fechado único (contorno completo
  do card) com 2 traços opostos girando continuamente (`stroke-dashoffset`), em vez de 2 metades
  que desenhavam/seguravam/recolhiam. Ajuste pedido pelo usuário após ver a animação original.
- `app-language-selector` (`feat-019.3`): quando a sidebar está colapsada, o `mat-select` cede
  lugar a um botão-ícone com `mat-menu` (mesmo padrão já usado pelos links de recurso), em vez de
  sumir do DOM inteiramente. Estado expandido intocado (mesmo `data-testid`, mesmos 3 e2e por
  `role=option`).
- `betting-houses` (`feat-025`): ação "Movimentar saldo" por linha leva para `/history` já na aba
  Movimentações com a casa pré-selecionada — ponte de navegação, não um formulário novo (o de
  depósito/retirada já existia em `History`, intocado). Saldo por casa já re-sincroniza sozinho ao
  voltar (Angular recria o componente da rota), sem código de sincronização de estado novo.

### Fixed

- `shared/catalog-manager` (`feat-024`, telas de cadastro de esporte/liga/mercado/tipster/casa
  de apostas): `:host` sem padding lateral colava o card de "Nova entrada" no menu lateral;
  `.catalog-manager__form` em `display: flex` na horizontal (campo Nome + botão "Adicionar" lado
  a lado) espremia o campo a poucos caracteres em viewports estreitos, chegando a cortar o
  próprio label. Padding lateral adicionado ao `:host` e formulário trocado para `flex-direction:
  column` (botão em linha própria). `shared/team-manager` (`/teams`) tinha o mesmo `:host` sem
  padding lateral (copiado de `catalog-manager` em `feat-021`, antes deste ajuste existir) —
  mesmo padding aplicado ali também. Layout compartilhado agora cobre as 5 telas de catálogo mais
  `/teams`, com cobertura Playwright dedicada para as 6.
- `app-language-selector` (`feat-023.1`): o pill expandido (`.language-selector-host`) usava
  `display: block` envolvendo um filho com `width: 100%` — sem uma largura definida no ancestral
  (como na tela de login, onde os controles flutuam sem largura própria), o cálculo de
  shrink-to-fit subestimava a largura real do `mat-select`, deixando-o vazar ~13-26px pra fora do
  próprio pill e sobrepor o botão de tema adjacente. Trocado para `display: flex` (mesmo modo de
  layout do filho), que tem regra bem definida pra esse caso (CSS Flexbox §9.9). Sem efeito na
  sidebar (já tinha largura definida, nunca foi afetada).
- Chave do projeto no SonarCloud corrigida para `eimmig_sv-frontend`. O SonarCloud gera a chave como
  `<org>_<repo>` ao importar um repositório do GitHub; a forma sem prefixo, usada até aqui, faria a
  análise falhar com projeto inexistente.
- `theme-toggle`/`side-nav__collapse-toggle` (`feat-019.1`/`.2`): ícone do tema não centralizava no
  rodapé colapsado (`:host` `display:block` + `width:100%` forçado pelo footer, sem centralização);
  botão de colapsar renderizava como `<button>` nativo sem nenhum estilo do Material (`AppSideNav`
  nunca importava `MatButtonModule`, então o atributo `mat-icon-button` era um no-op silencioso) -
  causa raiz real da "cor escura fixa no tema claro" relatada (chrome nativo do browser segue o
  `color-scheme` do SO, não os tokens do app).
- `period-report.spec.ts` (unitário e `e2e/period-report.spec.ts`): dependiam de `new Date()` real
  batendo com uma fixture fixa em `2026-09-11` - o teste falhava sempre que a suíte rodasse depois
  dessa data. Relógio congelado (`vi.setSystemTime`/`page.clock.setFixedTime`) em vez de mudar a
  fixture, que não é o que o componente realmente controla.
- `shared/panel` (`feat-025`): "grid blowout" — a coluna nova de `betting-houses` (com o botão
  "Movimentar saldo") estourava a largura da página inteira em telas estreitas, apesar da tabela
  já estar dentro de um `overflow-x: auto`. Causa: `:host` de `app-panel` (o item de grid de
  `app-panel-layout`) não tinha `min-width: 0` — grid/flex items usam `min-width: auto` por
  padrão, que ignora `overflow` em qualquer descendente e trava o track do grid no tamanho do
  conteúdo. `min-width: 0` no `:host` corrige para qualquer página que use `app-panel` com
  conteúdo largo, não só `betting-houses`.
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
- [SV-373](https://stakevault.atlassian.net/browse/SV-373) - Menu por cadastro (Cadastrar + Dashboard) para esporte/liga/mercado/tipster/casa de apostas
- [SV-374](https://stakevault.atlassian.net/browse/SV-374) - StatisticsDashboard ganha byLeague/byTipster
- [SV-375](https://stakevault.atlassian.net/browse/SV-375) - shared/catalog-dashboard novo (ranking parametrizado por segmento)
- [SV-376](https://stakevault.atlassian.net/browse/SV-376) - Rotas novas (Cadastrar + Dashboard) via withComponentInputBinding, app-nav com 5 mat-menu
- [SV-377](https://stakevault.atlassian.net/browse/SV-377) - e2e/catalogs.spec.ts reescrito, Playwright novo pro catalog-dashboard
- [SV-378](https://stakevault.atlassian.net/browse/SV-378) - QA visual final, CHANGELOG e verificacao final
- [SV-379](https://stakevault.atlassian.net/browse/SV-379) - Corrigir apiGatewayUrl hardcoded (residual da feat-013) - CORS bloqueando login real
- [SV-380](https://stakevault.atlassian.net/browse/SV-380) - apiGatewayUrl vazio (caminho relativo) em environment.ts
- [SV-381](https://stakevault.atlassian.net/browse/SV-381) - CHANGELOG e verificacao final
- [SV-385](https://stakevault.atlassian.net/browse/SV-385) - Navegacao lateral (sidebar) substitui nav superior, animacoes no shell e no login
- [SV-386](https://stakevault.atlassian.net/browse/SV-386) - app-side-nav (sidebar colapsavel) substitui app-nav
- [SV-387](https://stakevault.atlassian.net/browse/SV-387) - language-selector: fix de min-width (causa raiz do corte) + controles flutuantes no login
- [SV-388](https://stakevault.atlassian.net/browse/SV-388) - Motion pass: view transitions, collapse do sidebar, animacao autoral do login
- [SV-389](https://stakevault.atlassian.net/browse/SV-389) - QA visual final (Impeccable), testes, docs e verificacao final
- [SV-398](https://stakevault.atlassian.net/browse/SV-398) - Corrigir alinhamento, tema e acesso ao idioma na sidebar
- [SV-399](https://stakevault.atlassian.net/browse/SV-399) - Centralizar icones nas tres secoes da sidebar
- [SV-400](https://stakevault.atlassian.net/browse/SV-400) - Aplicar tema claro ao botao de colapsar
- [SV-401](https://stakevault.atlassian.net/browse/SV-401) - Manter seletor de idioma acessivel no modo colapsado
- [SV-402](https://stakevault.atlassian.net/browse/SV-402) - Testes, QA visual e verificacao final
- [SV-403](https://stakevault.atlassian.net/browse/SV-403) - Implementar gestao de saldo e movimentacoes no frontend
- [SV-404](https://stakevault.atlassian.net/browse/SV-404) - Ponte de navegacao Casas de Apostas -> Historico (Movimentacoes)
- [SV-405](https://stakevault.atlassian.net/browse/SV-405) - Verificar atualizacao de saldo por casa apos movimentacao (sem codigo novo esperado)
- [SV-406](https://stakevault.atlassian.net/browse/SV-406) - Testes, QA visual e verificacao final
- [SV-438](https://stakevault.atlassian.net/browse/SV-438) - CD: job de deploy automatico (kubectl rollout restart) no ci.yml
- [SV-439](https://stakevault.atlassian.net/browse/SV-439) - Job deploy no ci.yml
- [SV-440](https://stakevault.atlassian.net/browse/SV-440) - CHANGELOG e verificacao final
- [SV-443](https://stakevault.atlassian.net/browse/SV-443) - Renomear data da aposta para data do evento
- [SV-444](https://stakevault.atlassian.net/browse/SV-444) - Atualizar rotulos e traducoes da data do evento
- [SV-445](https://stakevault.atlassian.net/browse/SV-445) - Verificacao final de nomenclatura
- [SV-446](https://stakevault.atlassian.net/browse/SV-446) - Cadastro de time vinculado a esporte + corrigir quebra de contrato em POST /api/v1/bets
- [SV-447](https://stakevault.atlassian.net/browse/SV-447) - Catalogo de times (tela nova) + formulario de aposta usando team1Id/team2Id
- [SV-448](https://stakevault.atlassian.net/browse/SV-448) - CHANGELOG e verificacao final
- [SV-449](https://stakevault.atlassian.net/browse/SV-449) - Grade mensal de drawdown (curva acumulada em unidades)
- [SV-450](https://stakevault.atlassian.net/browse/SV-450) - Calcular curva acumulada mensal a partir do historico diario
- [SV-451](https://stakevault.atlassian.net/browse/SV-451) - Filtro de range de meses e grade dinamica de mini-graficos
- [SV-452](https://stakevault.atlassian.net/browse/SV-452) - Testes, QA visual e verificacao final
- [SV-453](https://stakevault.atlassian.net/browse/SV-453) - Tela web para vinculo da conta Telegram
- [SV-454](https://stakevault.atlassian.net/browse/SV-454) - Criar cliente e fluxo de codigo Telegram
- [SV-455](https://stakevault.atlassian.net/browse/SV-455) - Adicionar rota e entrada de navegacao
- [SV-456](https://stakevault.atlassian.net/browse/SV-456) - Testes, QA visual e verificacao final
- [SV-457](https://stakevault.atlassian.net/browse/SV-457) - Alinhar betType e exibir agrupamento PRE/LIVE
- [SV-458](https://stakevault.atlassian.net/browse/SV-458) - Trocar betType por selecao PRE/LIVE
- [SV-459](https://stakevault.atlassian.net/browse/SV-459) - Consumir byBetType no frontend
- [SV-460](https://stakevault.atlassian.net/browse/SV-460) - Testes, QA visual e verificacao final
- [SV-461](https://stakevault.atlassian.net/browse/SV-461) - Tela "Visao geral" pos-login (curva de drawdown vitalicia + resumo mensal)
- [SV-462](https://stakevault.atlassian.net/browse/SV-462) - Resolver data mais antiga e saldo inicial do historico
- [SV-463](https://stakevault.atlassian.net/browse/SV-463) - Cards de resumo vitalicios
- [SV-464](https://stakevault.atlassian.net/browse/SV-464) - Tabela mensal Jan-Dez e decisao de navegacao pos-login
- [SV-465](https://stakevault.atlassian.net/browse/SV-465) - Testes, QA visual e verificacao final
- [SV-466](https://stakevault.atlassian.net/browse/SV-466) - Corrigir sobreposicao do seletor de idioma no login
- [SV-467](https://stakevault.atlassian.net/browse/SV-467) - Corrigir layout e area de clique do idioma
- [SV-468](https://stakevault.atlassian.net/browse/SV-468) - Validar temas, locales e acessibilidade
- [SV-469](https://stakevault.atlassian.net/browse/SV-469) - Testes, QA visual e verificacao final
- [SV-470](https://stakevault.atlassian.net/browse/SV-470) - Ajustar espacamento e formulario das telas de cadastro
- [SV-471](https://stakevault.atlassian.net/browse/SV-471) - Criar espacamento entre sidebar e cadastro
- [SV-472](https://stakevault.atlassian.net/browse/SV-472) - Reposicionar botao Adicionar
- [SV-473](https://stakevault.atlassian.net/browse/SV-473) - Aplicar em todas as telas de cadastro
- [SV-474](https://stakevault.atlassian.net/browse/SV-474) - Testes, QA visual e verificacao final
- [SV-480](https://stakevault.atlassian.net/browse/SV-480) - Date picker e formato localizado para campos de data
- [SV-481](https://stakevault.atlassian.net/browse/SV-481) - Inventariar campos de data do frontend
- [SV-482](https://stakevault.atlassian.net/browse/SV-482) - Providers do DateAdapter com rebind reativo de locale
- [SV-483](https://stakevault.atlassian.net/browse/SV-483) - Aplicar mat-datepicker aos campos de data (filtros)
- [SV-484](https://stakevault.atlassian.net/browse/SV-484) - register-bet: betDate vira mat-datepicker + mat-timepicker (2 controles independentes)
- [SV-485](https://stakevault.atlassian.net/browse/SV-485) - Atualizar testes, QA visual e documentacao
- [SV-490](https://stakevault.atlassian.net/browse/SV-490) - Polish app-side-nav: fontSet Material Symbols Outlined seletivo + scrollbar tematizada
- [SV-491](https://stakevault.atlassian.net/browse/SV-491) - Material Symbols Outlined seletivo na sidebar (fontSet, exceto telegram)
- [SV-492](https://stakevault.atlassian.net/browse/SV-492) - Scrollbar tematizada de .side-nav (thin + cores claro/escuro)
- [SV-493](https://stakevault.atlassian.net/browse/SV-493) - CHANGELOG e verificacao final
- [SV-494](https://stakevault.atlassian.net/browse/SV-494) - Teste de regressao: telegram fica fora do fontSet Symbols Outlined
- [SV-500](https://stakevault.atlassian.net/browse/SV-500) - Ajustes de UX em formularios/navegacao (autofill, time filtrado por esporte, menu de recursos)
- [SV-501](https://stakevault.atlassian.net/browse/SV-501) - autocomplete=off no campo Nome (catalog-manager/team-manager)
- [SV-502](https://stakevault.atlassian.net/browse/SV-502) - register-bet: team1Id/team2Id desabilitados e filtrados por esporte
- [SV-503](https://stakevault.atlassian.net/browse/SV-503) - app-side-nav: menu de recursos acompanha a largura da nav expandida
- [SV-504](https://stakevault.atlassian.net/browse/SV-504) - CHANGELOG e verificacao final
