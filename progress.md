# Log de Progresso — web

## Estado Atual (Current State)

**Última atualização:** 2026-09-11
**Estado:** `feat-001` a `feat-014` `done` (`feat-013`, Dockerfile/CI push, fechada em sessão
anterior). `feat-014` (dashboard — filtro de período com presets, integração bankroll/settings,
novos cards de KPI, `epic-015` da raiz) fechada nesta sessão. Libera `epic-017`/`epic-019` (ambos
dependiam de `epic-015`) — `epic-020`/`epic-021` já estavam liberados por outras dependências.

## `feat-014` fechada — dashboard consolidado: filtro de período, bankroll/settings, novos cards (2026-09-11)

Fecha `epic-015` da raiz (escopo novo, fora do backlog original do TCC1, pedido do usuário
2026-09-10). Reespecificação do dashboard já entregue em `feat-006` (`done`) — não cria tela
nova. 5 subtasks (story SV-362): `feat-014.1` (SV-363, `BankrollApi`/`SettingsApi` novos +
`StatisticsApi.BetMetrics` estendido com os 6 campos que `stats-service` já expunha desde
`epic-014` e nunca tinham sido consumidos aqui), `feat-014.2` (SV-364,
`shared/period-preset-filter` — presets + range customizado, vive em `shared/` porque `epic-017`
reusa o mesmo componente), `feat-014.3` (SV-365, wiring completo do dashboard — `forkJoin` com
bankroll ×3/settings, novos cards, preset "Hoje" aplicado por padrão no load — mudança de
comportamento intencional, antes carregava sem filtro nenhum), `feat-014.4` (SV-366, campo
admin-only inline para editar `unitPercent`), `feat-014.5` (SV-367, Playwright + QA visual +
fechamento).

**Achado MAJOR do Plan Reviewer, corrigido no plano**: `BetMetrics`/`StatisticsDashboard`
(frontend) nunca acompanharam as 2 evoluções do backend (`epic-014`/`epic-018` de
`stats-service`) — escopo desta feature ampliou só os 6 campos que os cards novos consomem
(`wonCount`/`lostCount`/`voidCount`/`preCount`/`liveCount`/`avgOdd`), deixando
`byBetType`/`byLeague`/`byTipster` de fora de propósito (pertencem a `epic-019`/`epic-021`).

**QA visual real** (screenshots via Chromium contra o dev server rodando de verdade, 2 temas ×
desktop/mobile × admin/member — não só leitura de código): achado real corrigido — label
"Unidade (% da banca)" truncado por `max-width:140px` no campo admin-only, corrigido para
`min-width:180px`. Um falso-positivo investigado a fundo e descartado: suspeita inicial de
overflow horizontal no mobile (candidata: `min-width:auto` padrão de `app-panel` em
`panel.scss`) não se confirmou num teste controlado (servidor limpo, sem hot-reload) — o sintoma
original era artefato do ciclo iterativo de edição+screenshot contra o dev server em watch mode,
não um defeito de código real. Nenhuma mudança em `panel.scss` (componente compartilhado, fora
do escopo desta feature) foi mantida — evitado scope creep sobre uma hipótese não confirmada.
Teste Playwright novo (`e2e/panel-layout.spec.ts`) mantido mesmo assim como cobertura RNF01
proativa (não como regressão de bug confirmado) para a densidade de conteúdo nova do dashboard.

`Delivery Reviewer`/`Test Suite Auditor` (passe próprio, sem subagentes — independência
reduzida, declarada) rodados contra o diff completo (19 arquivos): ambos `PASS`. `./init.sh`
verde — 148 testes unitários + 32 Playwright. CI+SonarCloud verdes nas 5 PRs de subtask
(#59-63) e na PR `feature/SV-362 -> develop` (#64). `docs/services/web.md` (repositório raiz)
atualizado confirmando aderência ao planejado, seção marcada `done`.

## `feat-012` fechada — tela "Buscar Estatísticas" (2026-09-10)

7 subtasks (story SV-303, PRs #48-55). `feat-012.1` (core: `StatisticsSearchApi`,
`toHttpParams` extraído de `statistics-api.ts`, `formatDay`/`formatOdd` novos), `feat-012.2`
(`shared/kpi-card` extraído + `dashboard.html` refatorado pra reusá-lo — `data-testid`
preservados), `feat-012.3` (`shared/equity-curve-chart` + `core/chart-theme.ts`), `feat-012.4`
(componente da página: form reativo sportId/leagueId obrigatórios, autocomplete de time em
cascata via `switchMap` — cancela chamada obsoleta na troca rápida de esporte —, sinal
`hasSearched` distinguindo "nunca buscou" de "buscou e zerou", 8 cards incluindo `betCount`,
`sharpeRatio` null vira texto localizado), `feat-012.5` (rota + nav + i18n 3 locales),
`feat-012.6` (testes unitários restantes + e2e + `docs/TESTING.md`), `feat-012.7` (fechamento).

**Achado real corrigido em `feat-012.6`**: mock do e2e pra `GET /api/v1/statistics/teams` usava
por engano o envelope paginado (`{content:[...]}`) dos outros catálogos, quando o endpoint real
devolve array puro — causava `TypeError: newCollection[Symbol.iterator] is not a function`
dentro do `@for`, só reproduzível em browser real (Chromium via Playwright), nunca nos testes
unitários (fixtures do `HttpTestingController` já tinham a forma certa desde o início).
Documentado em `docs/TESTING.md` (raiz).

**Gate story→develop falhou 3 vezes antes de passar** — todos achados reais do SonarCloud,
corrigidos no lugar certo (não contornados): (1) 2 inputs de data sem `id`/`aria-label`
(a11y, mesmo padrão já usado em `dashboard.html`); (2) 5.4% de duplicação em código novo
(gate ≤3%) — raiz real era `equity-curve-chart.ts` copiando ~50 linhas do
`buildChartOption` de `monthly-profit-chart.ts` quase inteiro, e `search-statistics.ts`
duplicando o `sign()` de `dashboard.ts`; corrigido extraindo `chart-theme.ts#buildLineChartOption`
(usado pelos 2 gráficos) e `kpi-card.ts#kpiSign` (usado pelas 2 telas) — não só o achado superficial
(3 selects opcionais quase idênticos em `search-statistics.html`, também deduplicado num `@for`
sobre `optionalCatalogFilters()`).

Delivery Reviewer (1 revisor independente em contexto isolado, rodou `npm test`/`playwright test`
de verdade): PASS, 2 achados P3 (fluxo de idioma trocado ausente no e2e — corrigido na mesma
sessão; locator por classe CSS em `kpi-card.spec.ts` — aceito, é o próprio spec do componente
testando sua saída encapsulada). Test Suite Auditor: PASS. `npm test` 41/41 (127/127 testes),
Playwright 28/28. QA visual real via Playwright (screenshots claro/escuro, desktop/mobile) nas 2
telas tocadas — sem achado (a "quebra" inicial do gráfico numa captura era só timing do
screenshot, confirmado lendo o estado real do componente via `window.ng.getComponent`, não um bug
de produção). `./init.sh` verde. Fecha `epic-012` (raiz).

## `feat-005.2` fechada — i18n, Playwright, CHANGELOG e verificação final (2026-09-09)

Fecha `feat-005` (RF08 UI). `validate-i18n-keys.py` confirmou as 24 chaves novas (`history.*`)
em sincronia nos 3 locales (96 no total). `e2e/history.spec.ts` novo (2 fluxos): filtrar apostas
por casa de apostas (nome resolvido, nunca o UUID cru, na linha da tabela), trocar pra aba de
movimentações e paginar (indicador "Page X of Y" avançando). Suite completa (17 testes: 2 novos +
15 já existentes) verde.

Delivery Reviewer final sobre a feature inteira (`git diff develop...feature/SV-243`, 15
arquivos entre os 2 PRs): PASS, sem achado bloqueante — conferido explicitamente que
`new_duplicated_lines_density` do SonarCloud não estourou e que os inputs novos já nasceram com
`id`+`aria-label` (aplicado de saída, sem retrofit necessário desta vez). Test Suite Auditor
(mesmo passe): PASS — 83 testes unitários + 17 Playwright, cobertura
86.89%/89.08%/81.75%/92.08%.

**Vault revisado** (item fixo desta subtask): nenhuma nota nova necessária além do que já foi
registrado em `feat-005.1` (`core/date-format.ts` vs `core/currency.ts` — data respeita idioma,
moeda não) e do gap de RF12/RF13 já documentado na `description` de `feat-005`/`feat-009`/
`feat-010`.

`./init.sh` verde, Playwright (17 testes) verde. `epic-006` (raiz) permanece `in-progress` —
resta só `feat-006` (RF10/RF11 UI).

## `feat-005.1` fechada — tela de histórico de operações (2026-09-09)

Somente leitura (2 abas: Apostas/Movimentações), decisão do usuário — RF12 (status)/RF13
(depósitos/saques) viram `feat-009`/`feat-010` separadas. `BetResponse`/`TransactionResponse` só
trazem IDs (`bettingHouseId`/`sportId`/etc.), não nomes — resolvidos client-side contra
`betting-houses`+catálogos já carregados (mesmo `forkJoin` de `feat-004`). Primeira tela com
paginação de verdade (Anterior/Próxima + "Página X de Y") — as anteriores (catálogos,
casas de apostas) buscavam 1 página grande por serem listas pequenas por natureza; histórico
cresce ao longo do tempo. `core/date-format.ts` novo: diferente de `formatBrl` (sempre BRL,
independente do idioma), datas respeitam o locale ativo de verdade (`Intl.DateTimeFormat`
parametrizado pelo `Language.current()`).

Aplicado de saída o padrão de `id`+`aria-label`/`<output>` (achado recorrente de
`feat-002`/`feat-004`, agora documentado em `docs/CONVENTIONS.md`) — sem retrofit necessário
nesta feature. Achado real de QA visual (não de SonarCloud desta vez): tabelas sem
`overflow-x:auto` cortavam colunas em mobile sem indicar rolagem — corrigido envolvendo as duas
tabelas num wrapper com scroll horizontal próprio.

83 testes (33 arquivos) passando, cobertura 86.89%/89.08%/81.75%/92.08%. Verificado no navegador
(`ng serve` + screenshots Playwright ad-hoc, descartados): as duas abas nos dois temas e mobile/
desktop, nomes resolvidos corretamente (não UUIDs), status/tipo localizados, paginação
funcionando.

Delivery Reviewer (passe próprio, sem subagentes): PASS. PR real (`subtask/SV-244` ->
`feature/SV-243`, PR #28), CI verde antes do merge.

## `feat-004.2` fechada — i18n, Playwright, CHANGELOG e verificação final (2026-09-09)

Fecha `feat-004` (RF04 UI). `validate-i18n-keys.py` confirmou as 22 chaves novas
(`registerBet.*`) em sincronia nos 3 locales (72 no total). `e2e/register-bet.spec.ts` novo (2
fluxos): registro com sucesso (banner de sucesso, `Idempotency-Key` presente no header, campos
voltam ao valor default), erro de validação (422 `invalid-odd`) exibindo o `detail` RFC 7807.
Suite completa (15 testes: 2 novos + 13 já existentes) verde.

Delivery Reviewer final sobre a feature inteira (`git diff develop...feature/SV-240`, 11
arquivos entre os 2 PRs): PASS, sem achado bloqueante — conferido explicitamente que
`new_duplicated_lines_density` do SonarCloud não estourou (achado real de `feat-003`). Test Suite
Auditor (mesmo passe): PASS — 73 testes unitários + 15 Playwright, cobertura
90.56%/89.04%/85.45%/93.86%.

**Vault revisado** (item fixo desta subtask): nenhuma nota nova necessária — o mapeamento das 8
regras de Shneiderman já está registrado no `plan_review` desta feature (`feature_list.json`),
não há contrato cross-service novo (rotas já existiam desde `bets-service feat-004`).

`./init.sh` verde, Playwright (15 testes) verde. `epic-006` (raiz) permanece `in-progress` —
restam `feat-005` (RF08 UI) e `feat-006` (RF10/RF11 UI).

## `feat-004.1` fechada — formulário de registro manual de apostas (2026-09-09)

Primeiro formulário do app com regras de UX explícitas do TCC1 (oito regras de ouro de
Shneiderman, `docs/services/web.md`) — mapeamento regra-a-regra registrado no `plan_review` desta
feature. `core/bets-api.ts`: `POST /api/v1/bets` com header `Idempotency-Key` gerado
client-side (`crypto.randomUUID()`, regenerado a cada reset/sucesso) — protege contra duplo-envio
em retry de rede ou duplo-clique. Formulário real (`app-panel-layout` 3 colunas: Evento/
Detalhes/Valores) carrega `betting-houses` (`feat-003`) + os 4 catálogos (`feat-008`) via
`forkJoin` num único `loadInto` — dropdowns em vez de UUIDs digitados, reduzindo a chance de FK
inválida a quase zero. `betDate` default "agora" (regra 2 — atalho pro caso mais comum).

**Achado real pego pelo próprio teste unitário antes do commit**: o banner de sucesso após criar
a aposta aparecia e sumia na mesma tick — `submit()` chamava `successMessage.set(...)` e depois
`reset()`, mas `reset()` por sua vez zera `successMessage` no fim (limpeza de estado ao limpar o
formulário) — corrigido invertendo a ordem (`reset()` primeiro, `successMessage.set(...)` depois).
Sem esse teste (`toBe('Aposta registrada com sucesso.')` em vez de só verificar que o form
resetou), o bug passaria despercebido silenciosamente.

73 testes (31 arquivos) passando, cobertura 90.56%/89.04%/85.45%/93.86%. Verificado no navegador
(`ng serve` + screenshots Playwright ad-hoc, descartados): formulário nos dois temas e mobile/
desktop, painéis colapsando corretamente, botão "Registrar aposta" desabilitado até os campos
obrigatórios serem preenchidos.

Delivery Reviewer (passe próprio, sem subagentes): PASS. PR real (`subtask/SV-241` ->
`feature/SV-240`, PR #25), CI verde antes do merge.

## `feat-008.2` fechada — i18n, Playwright, CHANGELOG e verificação final (2026-09-09)

Fecha `feat-008` (catálogos). `validate-i18n-keys.py` confirmou as 8 chaves novas
(`nav.catalogs` + `catalogs.*`) em sincronia nos 3 locales (50 no total). `e2e/catalogs.spec.ts`
novo: cria uma entrada de catálogo (sport), confirma na lista, troca de aba e confirma outro
catálogo (league) já carregado independentemente. Achado real de ambiente (não de produto): o
locale padrão do Chromium neste conjunto de testes é `en-US` (já documentado em
`docs/TESTING.md`), então os rótulos das abas do Material renderizam em inglês
("Leagues", não "Ligas") sem trocar o idioma primeiro — corrigido no próprio teste antes de
commitar. Suite completa (13 testes: 1 novo + 12 já existentes) verde.

Delivery Reviewer final sobre a feature inteira (`git diff develop...feature/SV-237`, 19
arquivos entre os 2 PRs): PASS, sem achado bloqueante — conferido explicitamente que
`new_duplicated_lines_density` do SonarCloud não repetiu o achado de `feat-003` (o design de
componente único reaproveitado, decidido no plan_review, evitou 4 telas quase idênticas). Test
Suite Auditor (mesmo passe): PASS — 69 testes unitários + 13 Playwright, cobertura
93.17%/89.24%/87.75%/94.57%.

**Vault revisado** (item fixo desta subtask): nenhuma nota nova necessária — a lacuna em si
(catálogos sem tela) já está documentada na `description` de `feat-008` e neste `progress.md`;
não há contrato cross-service novo (rotas já existiam desde `bets-service feat-002`/`api-gateway
feat-007`).

`./init.sh` verde, Playwright (13 testes) verde. `epic-006` (raiz) permanece `in-progress` —
restam `feat-004` (RF04 UI), `feat-005` (RF08 UI) e `feat-006` (RF10/RF11 UI).

## `feat-008.1` fechada — catalogApi + CatalogManager reaproveitável + página Catalogs (2026-09-09)

Gap real encontrado ao planejar `feat-004` (RF04 UI — registro de aposta): o formulário precisa
de dropdowns de `sport`/`league`/`market`/`tipster`, e o bot Telegram (`telegram-integration
feat-004`) já orienta o usuário a "cadastrar em `apps/web`" quando o catálogo do tenant está
vazio — mas nenhuma feature deste app cobria essa tela (só `betting-houses`, RF03). Perguntado ao
usuário como fechar a lacuna (tela dedicada / cadastro inline no formulário de aposta / outra
abordagem) via `AskUserQuestion` — decisão: tela dedicada, inserida como `feat-008` antes de
`feat-004` (que passou a depender dela).

Confirmado no código real de `bets-service` (não só a nota do vault):
`SportsController`/`LeaguesController`/`MarketsController`/`TipstersController` são
estruturalmente idênticos (só o nome do recurso muda) — mesmo `CatalogResponse{id,name}`,
`CreateCatalogRequest{name}`, `PagedResponse`, erro `409 <slug>-already-registered`. Decisão de
design para não reincidir no achado de duplicação do SonarCloud de `feat-003` (4 telas quase
idênticas estourariam o gate de novo): `core/catalog-api.ts` (factory parametrizada por
`resourcePath`, não 4 `Injectable` quase-cópias) + `shared/catalog-manager` (1 componente
reaproveitável, lista+criar, usa `loadInto`/`submitForm` de `feat-003`) instanciado 4x dentro de
`pages/catalogs` com `mat-tab-group`, em vez de 4 páginas quase idênticas. Achado de timing do
Angular: `resourcePath` (signal input `required`) não está garantidamente disponível no
`constructor` — `catalogApi()` foi desenhado pra receber `HttpClient` como parâmetro (em vez de
chamar `inject()` internamente) e é construído em `ngOnInit()`, não no constructor, evitando o
erro de "input required mas ainda sem valor".

69 testes (30 arquivos) passando, cobertura 93.17%/89.24%/87.75%/94.57%. Verificado no navegador
(`ng serve` + screenshots Playwright ad-hoc, descartados): 4 abas (Esportes/Ligas/Mercados/
Tipsters) nos dois temas e mobile/desktop, nav "Catálogos" destacada.

Delivery Reviewer (passe próprio, sem subagentes): PASS. PR real (`subtask/SV-238` ->
`feature/SV-237`, PR #22), CI verde antes do merge.

## `feat-003.3` fechada — i18n, Playwright, CHANGELOG e verificação final (2026-09-09)

Fecha `feat-003` (RF03 UI). `validate-i18n-keys.py` confirmou as 7 chaves novas (`bettingHouses.*`)
em sincronia nos 3 locales (42 no total). `e2e/betting-houses.spec.ts` novo (2 fluxos): criar casa
de apostas com sucesso (lista atualiza, valores em R$), erro de nome duplicado (`detail` RFC 7807
exibido). Suite completa (12 testes: 2 novos + 10 já existentes de `feat-002`) verde.

QA visual: telas novas (`betting-houses`/`users`, pós-rename) reaproveitam 100% dos mesmos
padrões/tokens já auditados via Impeccable em `feat-002.4` (mesmo `app-panel-layout`, mesma
paleta, mesmo padrão de formulário+lista) — sem elemento visual novo que justifique nova rodada de
`npx impeccable detect` (a ferramenta só alcança `/login` sem sessão real, já escaneada). Conferido
manualmente via `ng serve` + screenshots Playwright ad-hoc (descartados): lista+formulário nos dois
temas e mobile/desktop, valores formatados corretamente em R$, nav "Casas de apostas" destacada.

Delivery Reviewer final sobre a feature inteira (`git diff develop...feature/SV-233`, 41 arquivos
entre os 3 PRs): PASS, sem achado bloqueante. Test Suite Auditor (mesmo passe): PASS — 58 testes
unitários + 12 Playwright, cobertura 94.14%/87.67%/92.5%/95.08%, nenhum teste trivial/redundante.

**Vault revisado** (item fixo desta subtask): nenhuma nota nova necessária — o achado de naming
já foi documentado nos commits/PRs de `feat-003.1`/`.2` (sem contrato cross-service novo, sem
gotcha de lib/config além do já registrado em `docs/DESIGN-SYSTEM.md` em `feat-002.4`).

`./init.sh` verde, Playwright (12 testes) verde. `epic-006` (raiz) permanece `in-progress` —
restam `feat-004` (RF04 UI), `feat-005` (RF08 UI) e `feat-006` (RF10/RF11 UI).

## `feat-003.1` fechada — renomear páginas/rotas/i18n de português pra inglês (2026-09-09)

Achado do usuário, não do Plan Reviewer: `docs/CONVENTIONS.md` já dizia "nomes de rota, evento e
código, todos já em inglês", mas `pages/historico`, `pages/registro-de-aposta` e `pages/usuarios`
(criadas em `feat-001.1`) e a `pages/casas-de-apostas` desta própria feature, ainda em andamento,
estavam em português — 3 features já mergeadas (`feat-001`/`feat-002`) carregavam essa dívida sem
nenhuma sessão anterior ter cruzado a convenção contra o nome real dos arquivos. Perguntado ao
usuário como proceder (renomear agora / só documentar a exceção / só daqui pra frente) — decisão:
renomear tudo agora, antes de mais features construírem em cima do padrão errado.

`git mv` pra `history`/`register-bet`/`users` (classes, selectors, CSS, i18n keys `usuarios.*` ->
`users.*`, `app.routes.ts`, links da nav, `e2e/auth.spec.ts`) — `casas-de-apostas` não passou por
esse rename porque nunca teve conteúdo real sob esse nome; virou `betting-houses` direto em
`feat-003.2`. Achado real durante a correção: `app.routes.ts` já esperava `m.BettingHouses` mas o
stub renomeado ainda exportava `CasasDeApostas` (a classe do componente também precisava do
rename, não só a pasta) — build quebrou no PR real (não localmente, só a suíte de unit tests
rodou antes do push), corrigido num commit de fix separado antes do merge.

`./init.sh` e Playwright verdes após a correção. Delivery Reviewer (passe próprio, sem
subagentes): PASS. PR real (`subtask/SV-234` -> `feature/SV-233`, PR #18, 2 commits — rename +
fix do stub), CI verde antes do merge.

## `feat-003.2` fechada — BettingHousesApi + tela real (lista + criar) (2026-09-09)

Mesmo padrão de `UsersApi`/`Users` (`feat-002.3`), já nascendo com nomenclatura em inglês
(`feat-003.1` pagou a dívida de nomenclatura primeiro). `PagedResponse<T>` genérico novo
(`core/paged-response.ts`, reaproveitável por `feat-004`/`005`/`006`) — confirmado contra o código
real de `bets-service` (`BettingHousesController`/`PagedResponse.java`), não só a nota do vault.
Sem paginação na UI (busca 1 página com `size=100`, o máximo do backend) — mesmo racional já
aceito em `auth-service feat-009` pra `GET /users`. `formatBrl` (`core/currency.ts`,
`Intl.NumberFormat('pt-BR', {currency:'BRL'})`) fixo independente do idioma ativo da UI — dinheiro
do bankroll é sempre Real brasileiro, sem multi-moeda no backlog.

58 testes (26 arquivos) passando, cobertura 94.14%/87.67%/92.5%/95.08%. Achado de teste real
(não de produto): `Intl.NumberFormat('pt-BR')` separa o símbolo do valor com espaço **não-quebrável**
(U+00A0), não espaço comum — asserção inicial com espaço comum falhava silenciosamente parecendo
idêntica no editor; corrigido com comentário explicando o motivo pra não reincidir. Verificado no
navegador (`ng serve` + script Playwright ad-hoc, descartado): lista+formulário nos dois temas e
mobile/desktop, valores formatados corretamente em R$.

Delivery Reviewer (passe próprio, sem subagentes): PASS. PR real (`subtask/SV-236` ->
`feature/SV-233`, PR #19), CI verde antes do merge.

## `feat-002.4` fechada — i18n, Playwright, CHANGELOG e verificação final (2026-09-09)

Fecha `feat-002` (RF01/RF02 UI). `validate-i18n-keys.py` confirmou os 35 chaves novas (login/nav/
mustChangePassword/usuarios) em sincronia nos 3 locales. `e2e/auth.spec.ts` novo (7 fluxos): login
com sucesso (navega pra `/dashboard`, nav aparece), login com credenciais inválidas (`detail`
RFC 7807 exibido, permanece em `/login`), mensagem de erro segue o idioma ativo (`en-US`), rota
protegida sem sessão redireciona pra `/login`, admin vê "Usuários" e consegue gerenciar, member
não vê o link e é barrado de `/usuarios` (`adminGuard`), banner `mustChangePassword` aparece e é
dispensável. Suite completa (10 testes: 7 novos + `smoke`/`panel-layout` já existentes) verde.

**QA visual (Impeccable, `npx impeccable detect` contra `/login` real via `ng serve`)**: 9
achados, nenhum bloqueante desta feature — 2 categorias:
- `low-contrast` (`--color-text-secondary` `#7A8A93` sobre `--color-surface` `#16232F` no modo
  escuro, `4.47:1` vs `4.5:1` exigido pela WCAG AA): **achado real, não corrigido** — token de cor
  vem verbatim do mockup StakeVault (`docs/DESIGN-SYSTEM.md`), fora do escopo desta feature
  ajustar um valor de marca por conta própria. Documentado em `docs/DESIGN-SYSTEM.md` (repositório
  raiz) como achado sinalizado pra decisão futura do usuário.
- `ai-color-palette` ("cyan neon text on dark background"): **falso positivo avaliado e
  descartado** — o heurístico do Impeccable identifica o azul de marca (`--color-action-neutral`,
  já documentado e usado desde `feat-001`) como "tell" de UI gerada por IA; não é paleta nova
  desta feature nem cor inventada, é a marca StakeVault documentada.
- `bounce-easing` (`cubic-bezier(0.2, 1.3, 0.4, 1)`): rastreado até `core/splash/splash.scss`
  (`feat-001.5`), não código desta feature — fora de escopo corrigir aqui.

Delivery Reviewer final sobre a feature inteira (não só a subtask, ver `git diff
develop...feature/SV-228`, 40 arquivos): PASS, sem achado bloqueante. Padrão de duplicação leve
entre `login.ts`/`usuarios.ts` (mesmo formato de `submit()`/tratamento de erro RFC 7807) avaliado
e aceito — nível de abstração adequado pro tamanho atual, extrair um helper agora seria
prematuro (KISS). Test Suite Auditor (mesmo passe): PASS — 59 testes unitários + 10 Playwright,
cobertura 95%+ em toda a feature, nenhum teste trivial/redundante identificado.

**Vault revisado** (item fixo desta subtask): 1 nota atualizada (`docs/DESIGN-SYSTEM.md`, achado
de contraste acima). Nenhuma outra lacuna de documentação encontrada — contrato de
`auth-service feat-010` (login `userId`/`role`) já documentado no mesmo commit daquela feature;
gateway/telegram-integration não precisaram de mudança.

`./init.sh` verde (`ng build` + `ng test`, cobertura 95.03%/89.37%/94.2%/95.42%), Playwright (10
testes) verde. `epic-006` (raiz) permanece `in-progress` — restam `feat-003`..`feat-006` deste
app.

## `feat-002.3` fechada — tela de gestão de usuários do tenant (2026-09-09)

`UsersApi` (`core/users-api.ts`): `list()`/`create()` via `GET`/`POST /api/v1/users`, só enviando
`Authorization: Bearer` (`authInterceptor` de `feat-002.1`) — gateway injeta `X-User-Id`/
`X-Tenant-Id` do token, frontend nunca envia esses dois manualmente. `Usuarios`
(`pages/usuarios`) real: `app-panel-layout` (formulário de criação à esquerda, 360px; lista à
direita, 1fr — colapsa pra coluna única em mobile), lista carregada no `constructor` e recarregada
após criação bem-sucedida, erro de qualquer uma das duas chamadas exibe `detail` do RFC 7807.
Rota `usuarios` já existia como stub guardado (`authGuard`+`adminGuard`, `feat-002.2`) — esta
subtask só trocou o conteúdo.

52 testes (24 arquivos) passando, cobertura 95.03%/89.37%/94.2%/95.42%. Verificado no navegador
(`ng serve` + script Playwright ad-hoc com rede mockada, descartado): lista+formulário nos dois
temas e em mobile/desktop, painéis colapsando corretamente pra coluna única. `./init.sh` verde,
Playwright (3 testes) verde.

Delivery Reviewer (passe próprio, sem subagentes — diff de 9 arquivos, risco baixo, precedente
direto de `feat-002.1`): PASS, sem achado. PR real (`subtask/SV-231` -> `feature/SV-228`, PR #15),
CI verde antes do merge.

## `feat-002.2` fechada — guards + nav mínima do app shell + banner mustChangePassword (2026-09-09)

`authGuard`/`adminGuard` (`CanActivateFn`) aplicados às rotas `dashboard`/`historico`/
`casas-de-apostas`/`registro-de-aposta` (`authGuard`) e à rota nova `usuarios`
(`authGuard`+`adminGuard`, stub — tela real é `feat-002.3`). `app.html` não tinha nenhuma nav até
agora (só splash/idioma/tema) — `AppNav` (`core/app-nav/`) mínima o suficiente pra tornar o login
navegável: logo, links pras páginas existentes, link "Usuários" só se `Auth.isAdmin()`, logout.
`MustChangePasswordBanner` não-bloqueante, dismissível na sessão (sem link de ação — não há
endpoint de troca de senha no backlog de `auth-service`, ver decisão documentada em
`docs/services/auth-service.md`).

**Achado real corrigido durante a própria subtask** (regressão causada pelo `authGuard` novo):
`e2e/panel-layout.spec.ts` (de `feat-001.7`) navegava direto pra `/dashboard` sem sessão — antes
funcionava porque a rota era aberta, agora `authGuard` redireciona pra `/login` e o teste
quebrava por procurar `panel-body` numa tela errada. Corrigido semeando uma sessão via
`page.addInitScript` antes do `goto`, em vez de assumir rota aberta — mesmo padrão que
`feat-002.4` vai usar pros fluxos novos (mock de rede/sessão via Playwright, sem backend real
disponível neste repositório).

**Observação não-bloqueante, não corrigida**: `dashboard.scss` (`feat-001.4`) já tinha
`:host { height: calc(100vh - 64px) }`, um valor fixo que por coincidência ainda cabe a nav real
(sem banner). É frágil — cresce se a nav ganhar mais uma linha, ou some silenciosamente o cálculo
errado se algum dia o banner ficar sempre visível. Sinalizado aqui para quando `feat-006`
(dashboard real) mexer nesse arquivo: vale trocar por um layout flex (header com `flex: none` +
conteúdo com `flex: 1 1 auto`/`min-height: 0`) em vez de um offset em pixels chutado.

56 testes (25 arquivos) passando, cobertura 96.41%/91.33%/96.61%/96.19%. Verificado no navegador
(`ng serve` + script Playwright ad-hoc, descartado): nav com "Usuários" + banner pro admin, nav
sem "Usuários" pro member (mobile), navegação direta a `/usuarios` como member redireciona pra
`/dashboard` (confirmado via `page.url()`). `./init.sh` verde, Playwright (3 testes) verde.

Delivery Reviewer (passe próprio, sem subagentes — diff de 24 arquivos, risco baixo, achado real
corrigido antes do PR): PASS. PR real (`subtask/SV-230` -> `feature/SV-228`, PR #14), CI verde
antes do merge.

## `feat-002.1` fechada — AuthService + interceptor de Authorization + login real (2026-09-09)

Gap real encontrado ao planejar esta feature: `POST /api/v1/auth/login` só devolvia
`token`/`mustChangePassword`, mas o token PASETO v4.local é criptografado simetricamente — o
frontend não tinha como saber `userId`/`role` do usuário logado (necessários pra esconder a tela
de gestão de usuários de `role=member`). Resolvido reabrindo `auth-service` (`feat-010`,
SV-226/227, mergeada em `develop` daquele repositório nesta mesma sessão) para o login devolver
também `userId`+`role` — mesmo precedente do gap de `feat-009` daquele serviço.

Implementado: `Auth` (`core/auth.ts`, Signals) guarda `{token,userId,role,tenantSlug,
mustChangePassword}` em `localStorage` (`stakevault.auth`, mesmo padrão de `Theme`/`Language`);
`authInterceptor` anexa `Authorization: Bearer <token>` quando há sessão (gateway já injeta
`X-User-Id`/`X-Tenant-Id` a partir disso, frontend nunca envia esses dois manualmente);
`core/problem-detail.ts` extrai `title`/`detail`/`status` do corpo RFC 7807 (já localizado via
`Accept-Language`, sem tradução própria de mensagem de erro de backend). Login real (3 campos,
Reactive Forms) exibe `detail` em caso de erro, redireciona pra `/dashboard` no sucesso (e de
`/login` pra `/dashboard` se já autenticado).

37 testes (18 arquivos) passando, cobertura 95.93%/90.18%/96%/95.85% (muito acima do gate 80%).
Verificado manualmente no navegador (`ng serve` + screenshots via Playwright): formulário, erro
RFC 7807 e botão de ação (azul `--color-action-neutral`, nunca verde) corretos nos dois temas e
em mobile/desktop — screenshots descartados após a checagem (não fazem parte do repositório).
`./init.sh` (`ng build` + `ng test`) verde; `ng build` já tinha o warning de budget (586KB vs
500KB) **antes** desta subtask (confirmado com `git stash` comparando o baseline em 570KB) — não
é regressão introduzida aqui, sinalizado para revisitar quando o dashboard real (feat-006) ou
outra feature grande justificar lazy-loading mais agressivo do Angular Material.

Delivery Reviewer (passe próprio, sem subagentes — diff de 8 arquivos, risco baixo/médio,
independência reduzida declarada): PASS, sem achado. PR real (`subtask/SV-229` ->
`feature/SV-228`, PR #13), CI verde antes do merge.

## Status

### O que está pronto

- [x] Harness deste app criado.
- [x] `feat-001.1` (`ng new` real + roteamento + HttpClient/interceptor + environments) — `done`
      em 2026-09-09.
- [x] `feat-001.2` (Angular Material M3 + tema claro/escuro + tokens StakeVault) — `done` em
      2026-09-09.
- [x] `feat-001.3` (transloco i18n + seletor de idioma persistido) — `done` em 2026-09-09.
- [x] `feat-001.4` (`app-panel-layout`/`app-panel`) — `done` em 2026-09-09.
- [x] `feat-001.5` (assets de logo + splash animado) — `done` em 2026-09-09.
- [x] `feat-001.6` (ngx-echarts instalado e provado) — `done` em 2026-09-09.
- [x] `feat-001.7` (Playwright + gate de cobertura 80%) — `done` em 2026-09-09.
- [x] `feat-001.8` (Impeccable + taste-skill + huashu-design + DESIGN.md pré-escrito) — `done` em
      2026-09-09.
- [x] `feat-001.9` (CHANGELOG, Test Suite Auditor e verificação final) — `done` em 2026-09-09.

### Em andamento

- Nenhuma subtask em andamento. `feat-001` (a feature) marcada `done` numa edição separada deste
  `feature_list.json` + `--sync-status` próprio, depois desta.

### Próximos passos (Next Steps)

1. Marcar `feat-001` `done` (edição separada) — libera `feat-002` (RF01/RF02 UI).

## Bloqueios / Riscos

- Depende de `auth-service` (epic-002) e `bets-service` (epic-003) existirem para integração
  real — `feat-001` (setup) pode ser feito de forma independente.

## Decisões tomadas

- Gerenciamento de estado: **Signals nativos** (não NgRx). Componentes **standalone**. Decididas
  em `../../docs/CONVENTIONS.md`, não específicas desta sessão.

## `feat-001.1` fechada — `ng new` real + roteamento + HttpClient/interceptor + environments (2026-09-09)

Primeira feature deste app — nenhum código existia antes desta sessão. Bootstrap real via
`npx @angular/cli@22 new web --directory . --skip-git --routing --style scss --package-manager npm`
(não escrito à mão — mesmo padrão de `start.spring.io`/`uv init` usado nos outros serviços).

**Achados reais de versão corrigidos antes de codificar** (Plan Reviewer): `docs/CONVENTIONS.md`,
`docs/DESIGN-SYSTEM.md`, `docs/ARCHITECTURE.md`, `docs/TESTING.md` e `apps/web/CLAUDE.md`
fixavam "Angular 21.x" — `npm view @angular/cli version` confirmou 22.1.7 estável, corrigido em
todas. Gotcha de ambiente: Angular CLI 22.1.7 exige Node `^22.22.3 || ^24.15.0 || >=26.0.0`, a
máquina tinha 24.9.0 (EBADENGINE) — corrigido via `nvm install 24.21.0` (LTS), documentado em
`docs/CONVENTIONS.md`.

**Test runner real**: `vitest` (não Karma) — CLI 22.x já migrou o default, confirmando o hedge
que já existia em `docs/TESTING.md`. Cobertura via `@vitest/coverage-v8` — achado real: instalar
a versão `latest` (5.x) quebra o resolver do npm (`Cannot read properties of null (reading
'children')`, bug do Arborist ao misturar major incompatível com `vitest@4.x` já instalado pelo
CLI) — corrigido pinando `@vitest/coverage-v8@4.1.11` (mesma major do `vitest` instalado).

**Nomenclatura de environments real diverge da documentada**: `ng generate environments` gera
`environment.ts` (produção/default) + `environment.development.ts` (dev, via `fileReplacements`
na configuration `development`) — não `environment.prod.ts` como `docs/OBSERVABILITY-AND-CONFIG.md`
e `apps/web/CLAUDE.md` diziam (convenção de versões antigas do Angular CLI). Corrigido nos dois
no mesmo commit. `environment.ts` aponta pra URL pública do Gateway (placeholder,
`https://api.stakevault.example.com` — revisitar quando o domínio real existir);
`environment.development.ts` aponta pra `http://localhost:8080` (porta fixa do `api-gateway` em
dev, ver `docs/DECISIONS-LOG.md` 2026-09-07).

**Roteamento**: 5 rotas placeholder lazy-loaded (`login`, `dashboard`, `historico`,
`casas-de-apostas`, `registro-de-aposta`), cada uma um componente `ng generate component`
mínimo em `src/app/pages/` — sem UI real ainda, só estrutura (as páginas de verdade são
features futuras). Redirect de `''` pra `login`.

**HttpClient + interceptor de Accept-Language**: `ActiveLocale` (serviço com um `signal` de
locale, default `pt-BR`) + `acceptLanguageInterceptor` (functional interceptor que clona a
requisição com o header `Accept-Language` = locale ativo). `ActiveLocale` é provisório — a
subtask de transloco (`feat-001.3`) substitui/conecta esse signal ao idioma real selecionado
pelo usuário, sem precisar reescrever o interceptor.

**Template/teste do componente raiz simplificados**: `app.html`/`app.ts` gerados pelo CLI trazem
o placeholder de marketing padrão do Angular (título "Hello, web" + ilustração) — substituído por
só `<router-outlet />`, já que o roteamento é a única responsabilidade deste componente nesta
fase. `app.spec.ts` ajustado (removido o teste do título antigo, adicionado `provideRouter([])`
pro `TestBed` conseguir instanciar `RouterOutlet`).

`init.sh` atualizado pros comandos reais (`ng build` + `ng test --watch=false --coverage` —
não mais os placeholders `npm test -- --watch=false --code-coverage` de sintaxe Karma). Gate de
cobertura 80% ainda **não** configurado no test runner (fica pra `feat-001.7`, que também traz
Playwright) — cobertura atual (100% stmts/lines, 98.46% branches) já está acima do gate, mas
nada falha ainda se cair abaixo.

`ng serve` testado manualmente (porta 4300, smoke via curl) — `/` redireciona pra `/login`,
HTTP 200, processos encerrados ao final. 1 subtask (SV-210, story SV-209). `./init.sh` verde
(build + 7 arquivos de teste, 8 testes, 0 falhas).

## `feat-001.2` fechada — Angular Material M3 + tema claro/escuro (2026-09-09)

**`mat.theme()` não aceita cor hex solta** — só mapas de paleta M3 completos (tons 0–100 +
`neutral`/`neutral-variant`/`secondary`/`error`). Resolvido com o schematic real do CLI:
`ng generate @angular/material:m3-theme --primary-color "#3E8CC4" --tertiary-color "#3EC46D"`
(gera `src/theme-colors.scss` com os tons reais derivados das duas cores StakeVault — moveu pra
`src/` a partir da raiz, onde o `--directory` do schematic gravou por padrão). `primary` =
`--color-action-neutral` (azul), `tertiary` = `--color-brand` (verde) — nunca o inverso, ver
`docs/DESIGN-SYSTEM.md` "Regra semântica de cor".

**Abordagem de troca de tema (exigida pela description da feature)**: media query **e** classe
manual, as duas juntas — `@media (prefers-color-scheme: dark)` decide o default (guardada por
`:root:not([data-theme='light'])`, pra não vencer depois de uma escolha explícita de "light");
uma escolha explícita do usuário (serviço `Theme`: `signal` + `localStorage`, chave
`stakevault.theme`) grava `data-theme="dark"`/`"light"` em `<html>`, com prioridade sobre a media
query. `src/styles/_tokens.scss` define os dois blocos de custom properties (claro/escuro, tabelas
exatas de `docs/DESIGN-SYSTEM.md`) e também sobrescreve `--mat-sys-surface`/`background`/
`on-surface`/`on-surface-variant` — assim os componentes do Material usam o navy/off-white do
StakeVault, não o neutro genérico do M3. `--color-positive`/`--color-negative` ficam como tokens
próprios da app (não reaproveitam o papel `error` do M3, ver a mesma seção do vault).

Tipografia: **Inter** via `@fontsource/inter` (pesos 400/500/600/700, ver `docs/DESIGN-SYSTEM.md`
"Tipografia") — decisão de instalar como dependência npm em vez de CDN do Google Fonts (bundle
único, sem depender de rede externa em produção).

Gotcha real de teste: `window.matchMedia` não existe no ambiente jsdom do vitest — lançava
`TypeError` na primeira injeção do serviço `Theme` nos testes. Corrigido com guarda defensiva
(`typeof window.matchMedia === 'function'`) em vez de polyfill — também mais correto em runtime
real, já que `matchMedia` pode genuinamente não existir em alguns ambientes. Segundo gotcha: usar
Angular `effect()` pra aplicar o `data-theme` inicial não funciona em teste síncrono (effects são
agendados, não síncronos) — corrigido aplicando o atributo diretamente no construtor e no
`toggle()`, sem `effect()`.

Verificado via CSS compilado real (`dist/web/browser/styles-*.css`, não só inspeção visual):
`--mat-sys-primary` resolve pro tom 40 da paleta gerada a partir do azul StakeVault (M3 não usa a
cor semente literal pro papel `primary` em tema claro, usa o tom calculado - comportamento
esperado do algoritmo, não bug); `--color-action-neutral` presente nos dois blocos claro/escuro
com os valores exatos do vault. `ng serve` testado manualmente (porta 4301), sem erro de console.
1 subtask (SV-211). `./init.sh` verde (12 testes, 0 falhas, cobertura 98.82% stmts).

## `feat-001.3` fechada — transloco i18n + seletor de idioma persistido (2026-09-09)

`Language` (`src/app/core/language.ts`) substitui o `ActiveLocale` provisório: mesmo padrão do
serviço `Theme` (signal + `localStorage`, default calculado se nada persistido) — aqui o default é
o idioma do navegador (`navigator.language` mapeado pra `pt-BR`/`en-US`/`es`, caindo pra `pt-BR`
se não reconhecido), não um valor fixo. `Language` é a única fonte de verdade: dirige tanto o
`TranslocoService` (`setActiveLang()`) quanto o interceptor de `Accept-Language`, que agora injeta
`Language` em vez do `ActiveLocale` removido.

**Achado real de estrutura (mesma classe dos gotchas de `feat-001.1`/`.2`)**: toda a documentação
(`CLAUDE.md` deste app, `docs/CONVENTIONS.md`, `docs/CI-CD.md`, o próprio
`validate-i18n-keys.py` e o `ci.yml` deste repositório) fixava `src/assets/i18n/*.json` como
caminho dos arquivos de locale — convenção pré-Angular 22. O `ng new` real deste app (`feat-001.1`)
usa `public/` (não `src/assets/`) pra arquivos servidos como estão; o guard do passo de i18n no CI
nunca teria ativado. Corrigido nos 3 lugares (`ci.yml`, `validate-i18n-keys.py`,
`docs/CI-CD.md`/`CLAUDE.md`) — arquivos reais em `public/i18n/{pt-BR,en-US,es}.json`, confirmado
servindo em `/i18n/{lang}.json` via `ng serve` real (não só inspeção estática).

`TranslocoHttpLoader` customizado (`src/app/core/transloco-loader.ts`) busca as traduções via
`HttpClient` em vez do pacote `@ngneat/transloco-http-loader` separado — evita mais uma
dependência pra um `get()` de uma linha. `theme-toggle.html` migrado pra usar o pipe `transloco`
(única string de UI hardcoded que já existia no app) — prova a integração ponta a ponta, não só a
infraestrutura.

Testes: `TranslocoTestingModule.forRoot()` nos specs que tocam componentes/serviços dependentes de
`TranslocoService` (`language.spec.ts`, `language-selector.spec.ts`, `accept-language-interceptor.spec.ts`,
`theme-toggle.spec.ts`, `app.spec.ts`) — `navigator.language` stubado via `Object.defineProperty`
nos testes que dependem do locale default do navegador, já que o jsdom do vitest usa `en-US` por
padrão (não `pt-BR`). `Delivery Reviewer` rodado sobre o diff (achados P3, não bloqueantes:
`TranslocoHttpLoader` usa path absoluto `/i18n/` — assume deploy na raiz, sem evidência de
subpath neste projeto; `mat-select` do seletor de idioma fora de `mat-form-field` — polish visual
fica pra `feat-001.8`/Impeccable). `./init.sh` verde (18 testes, 96.77% stmts). Smoke manual via
`ng serve` confirmando os 3 JSONs servidos corretamente. 1 subtask (SV-212).

## `feat-001.4` fechada — app-panel-layout + app-panel (2026-09-09)

`app-panel-layout` (`src/app/shared/panel-layout/`) é um grid CSS reutilizável: `columns` input
vira a custom property `--panel-columns` (proporções por página, ex.: `320px 1fr`), colapsando
via media query pra `repeat(2, 1fr)` em `≤1024px` e `1fr` em `≤600px` (confirmado no CSS
compilado real, não só no SCSS fonte). `app-panel` (`src/app/shared/panel/`) é a superfície de
rolagem independente — `max-height: 100%` funciona porque o grid container mantém
`align-content: stretch` (default do CSS Grid, não precisou ser setado explicitamente) mesmo com
`align-items: start` no container — a área do grid item continua tendo altura definida
(100% do container) mesmo que o item em si não seja esticado até ela, então cada painel encolhe
pro próprio conteúdo até o teto da área, só rolando internamente depois disso.

Novo token `--panel-shadow` em `_tokens.scss` (claro: `0 4px 24px rgba(20, 20, 30, 0.06)`, escuro:
`none`) — mesma regra de elevação já documentada em `docs/DESIGN-SYSTEM.md`.

Aplicado na rota `/dashboard` (2 painéis placeholder, proporção `320px 1fr`) só pra provar o
mecanismo — conteúdo real do dashboard é `feat-006`/RF10-11 UI, fora de escopo aqui.
`dashboard.scss` usa `calc(100vh - 64px)` como aproximação da altura disponível (`64px` é um
chute, não medição real — ainda não existe app-shell/header com altura fixa; revisitar quando
`feat-006` ou um header real existir).

**Limitação de verificação**: sem ferramenta de automação de browser nesta sessão — o colapso
responsivo dos 2 breakpoints foi confirmado via inspeção do CSS **compilado** (`dist/web/browser/chunk-*.js`,
não só o SCSS fonte), não visualmente em DevTools real. `Delivery Reviewer` rodado sobre o diff
(achado único, P3 não bloqueante: o `64px` do dashboard já citado acima). `./init.sh` verde (23
testes, 97.51% stmts). 1 subtask (SV-213).

## `feat-001.5` fechada — assets de logo + splash animado (2026-09-09)

Assets copiados de `docs/design-references/` pra `public/assets/logo/` (estrutura real do
Angular 22, mesmo achado de `feat-001.3`). Favicon trocado do padrão Angular pra
`logo-mark-solid.svg` (`<link rel="icon" type="image/svg+xml">`, `favicon.ico` mantido como
`alternate icon` pra browser sem suporte a favicon SVG).

`Splash` (`src/app/core/splash/`) porta `docs/design-references/splash-animation-artistic.html`
verbatim na estrutura SVG, mudando só o comportamento de repetição: toda animação `infinite` virou
`1 forwards` (trava no frame final em vez de resetar e repetir), **exceto** a rotação do anel-guia
(`sv2-spin`, 14s) — que já era independente do ciclo de 5.4s na própria referência, então mantê-la
`infinite` dá de graça o "loop discreto do anel de guia se o carregamento passar de ~3s" pedido
pela description, sem precisar de temporizador JS extra pra isso. `prefers-reduced-motion` reusa o
bloco `@media` já pronto da referência (anima nada, mostra o frame final direto).

Splash é um overlay `position:fixed` full-viewport mostrado no boot do app (`app.ts`/`app.html`),
que emite `done` depois de 5.4s (ou imediatamente sob motion reduzido, via `window.matchMedia`
com a mesma guarda defensiva já usada em `Theme`) — `App` esconde o overlay ao receber o evento,
revelando o app por baixo (já montado, não recriado). Textos do SVG (`aria-label`/`title`/`desc`/
tagline "GESTÃO DE BANCA") localizados via transloco; o wordmark "StakeVault" em si fica
intencionalmente sem tradução (nome de marca).

Testes: `splash.spec.ts` usa fake timers (`vi.useFakeTimers`) pra provar o dismiss em exatamente
5.4s (não antes) e o dismiss imediato sob `prefers-reduced-motion`; `app.spec.ts` ganhou teste
comportamental novo (splash presente no primeiro render, ausente depois do timer rodar) — o teste
antigo nunca chamava `detectChanges()`, deixando `app.html` sem cobertura real. `Delivery Reviewer`
rodado sobre o diff, sem achado. `./init.sh` verde (26 testes, 98.09% stmts).

**Limitação de verificação**: sem ferramenta de browser real nesta sessão — app é CSR puro (sem
SSR), então `curl` não revela o DOM pós-JS; a prova da animação em si é a leitura de código
(estrutura idêntica à referência) + testes com fake timers, não inspeção visual. Favicon confirmado
via `ng serve` + curl (200). 1 subtask (SV-215).

## `feat-001.6` fechada — ngx-echarts instalado e provado (2026-09-09)

`ngx-echarts@22.0.0` + `echarts@6.1.0` (peer deps `@angular/core >=22.0.0` confirmado via
`npm view`). `LineChartSample` (`src/app/shared/line-chart-sample/`) prova a integração com dados
mock: traço `--color-brand`, gradiente até transparente, ~3 linhas de grade sutis
(`--color-border`), marcador de destaque no último valor — exatamente o inventário item 6 de
`docs/DESIGN-SYSTEM.md`. Cores resolvidas via `getComputedStyle` (não hardcoded) e recalculadas
num `computed()` que depende do signal `Theme.current()`, então o gráfico acompanha a troca de
tema sem precisar recriar o componente.

**Achado real de orçamento de bundle**: registrar `echarts.use([...])` +
`provideEchartsCore({echarts})` em `app.config.ts` (global) estourou o budget de erro do
`angular.json` (1MB) — o core do echarts sozinho soma ~500KB. Corrigido movendo o registro pros
`providers` do próprio componente `LineChartSample` (escopo de injeção do Angular aceita
`providers` em nível de componente, aplicando aos elementos da própria view) — como esse
componente só é alcançado pela rota lazy `/dashboard`, o echarts inteiro fica dentro do chunk lazy
em vez do bundle principal. Confirmado no output real do build: chunk `dashboard` saltou de
~2.9KB pra ~501KB, bundle principal voltou pro tamanho anterior à subtask (~570KB, mesmo warning
de budget não-bloqueante de sempre). Mecanismo reaproveitável pra qualquer biblioteca pesada
usada só numa rota específica.

Gotcha de teste: jsdom não tem `ResizeObserver` (usado pelo `autoResize` do `ngx-echarts` no
`ngOnInit`) — stub mínimo (`observe`/`unobserve`/`disconnect` vazios) adicionado em
`dashboard.spec.ts` e `line-chart-sample.spec.ts`. `Delivery Reviewer` rodado sobre o diff, sem
achado (2 riscos residuais documentados: sem verificação visual real do gráfico/recoloração de
tema, e `withAlpha()` assume formato hex nos tokens de cor — aceitável, é o formato real usado
hoje). `./init.sh` verde (27 testes, 97.87% stmts). 1 subtask (SV-216).

## `feat-001.7` fechada — Playwright + gate de cobertura 80% (2026-09-09)

**Test runner confirmado**: `vitest` (já sabido desde `feat-001.1`) via `@angular/build:unit-test`.
Gate de cobertura baked direto nas options do builder (`angular.json`): `coverage:true` +
`coverageThresholds` (statements/branches/functions/lines: 80). Enforcement real testado, não só
presença de config — threshold temporariamente setado pra 100%, `npm run test` saiu com exit 1 e
os números reais de cobertura impressos, depois restaurado pra 80%. `--coverage` da CLI removido
de `init.sh`/`package.json` (redundante, já é default do builder agora).

**Playwright** (`@playwright/test@1.63.0`, Chromium baixado) com `webServer` no
`playwright.config.ts` subindo `ng serve` sozinho. `e2e/smoke.spec.ts`: boot + redirect pra
`/login`, e troca de idioma re-renderizando texto ponta a ponta (pina um idioma inicial conhecido
explicitamente — o Chromium usa `en-US` como locale padrão, o que fazia uma versão anterior deste
teste passar pelo motivo errado). Testes localizam elementos por `data-testid`
(`theme-toggle`/`language-selector`/`panel-body`, adicionados nos componentes reais), nunca por
texto traduzido ou classe de estilo — corrigido durante a própria revisão desta subtask (achado do
Delivery Reviewer: usar cópia traduzida como seletor quebra o teste pelo motivo errado se a
redação mudar).

**Achado real de regressão, encontrado por esta subtask** (feat-001.4, já fechada e mergeada):
nem `app-panel-layout` nem `app-panel` setavam `:host { display: block }` — a cadeia de
dimensionamento do CSS Grid nunca chegava a se aplicar de verdade. O painel "Filtros" (30 itens
mock) crescia a página inteira em vez de travar a própria altura e rolar internamente —
contradizendo o próprio critério de aceite já registrado em `feat-001.4` ("painel rola dentro de
si mesmo, pagina inteira nao rola"). Ninguém pegou isso antes porque toda verificação de
`feat-001.4`/`.5`/`.6` era estática (jsdom não roda layout de verdade, `getComputedStyle` não
resolve percentuais contra ancestral sem altura definida) — o Playwright desta subtask deu o
primeiro browser real da sessão pra tirar screenshot. Corrigido: `panel-layout.scss` removeu
`align-items:start` (deixa o `stretch` padrão do grid dar a mesma altura de linha pra todo painel)
e ganhou `:host{display:block;height:100%}`; `panel.scss` ganhou o mesmo `:host` e trocou
`.panel` de `max-height:100%` pra `height:100%`. **Verificado com rigor, não só alegado**: fix
revertido via `git stash`, confirmado que `e2e/panel-layout.spec.ts` (teste de regressão novo)
falha contra o código antigo, restaurado, confirmado que passa. Screenshots reais (luz/escuro)
confirmaram splash (`feat-001.5`) e gráfico (`feat-001.6`) também corretos — os riscos residuais
de verificação visual registrados nas três subtasks anteriores ficam resolvidos por este achado.

Avaliação de escopo (registrada no `Delivery Reviewer`): corrigir um bug de `feat-001.4` dentro
desta subtask é apropriado aqui porque a regressão foi descoberta causalmente pela própria
ferramenta que esta subtask introduz, dentro do mesmo app — não é o caso de "editar arquivo fora
da feature ativa" que a regra de escopo restrito existe pra evitar. Mesmo padrão já usado em
`docs/CI-CD.md` ("Segunda camada do mesmo achado").

`./init.sh` verde (27 testes, 97.87% stmts). `npx playwright test` verde (3/3). 1 subtask
(SV-217).

## `feat-001.8` fechada — Impeccable + taste-skill + huashu-design + DESIGN.md (2026-09-09)

**Achado real na instalação do Impeccable**: `npx impeccable install` sem flags detecta
harnesses automaticamente e ofereceu só "GitHub Copilot" como default — falso positivo, só
porque `.github/` existe (workflows de CI), não porque este projeto usa Copilot (nunca
mencionado em nenhum `CLAUDE.md`). Corrigido rodando de novo com
`--providers=claude --scope=project` (o agente real deste projeto), e a instalação errada
(`.github/skills`, `.github/agents`, `.github/hooks`) removida.

**Hook movido de `settings.local.json` pra `settings.json`**: a doc do próprio skill
(`reference/hooks.md`) diz que `.claude/settings.local.json` é intencionalmente gitignored
(fica "machine-local"), mas "a hook you move into the shared settings.json is honored in place
too" — como o objetivo aqui é toda sessão neste repo ganhar o hook de QA visual automaticamente
(não só a máquina que rodou o install), o conteúdo foi movido pra `.claude/settings.json`
(commitado). `settings.local.json` continua no `.gitignore` como defesa em profundidade caso um
`impeccable update` futuro o recrie.

**`npx skills add` (taste-skill, huashu-design)**: instala em `.agents/skills/` (fonte
canônica/universal) com espelho materializado em `.claude/skills/` pra Claude Code
especificamente. Confirmado que git nesta máquina (`core.symlinks=false`) grava cópias reais de
arquivo ao dar `git add` num "symlink" de diretório do Windows, não um texto de link quebrado —
seguro commitar os dois. `taste-skill` trouxe 12 sub-skills (~350KB, tudo commitado).
`huashu-design` trouxe ~28MB de assets de bgm/sfx opcionais (capability de vídeo/animação que
este projeto não usa — é prototipagem de UI de app financeiro, não vídeo de marketing) —
ignorados no git (`*.mp3`, `sfx/`), mantendo `SKILL.md`/scripts/templates jsx. Mesmo tratamento
já dado ao binário do próprio Impeccable (15MB, `windows-x64`, regenerado pelo `install`).
`skills-lock.json` (like `package-lock.json`, fonte+hash por skill) commitado.

**`apps/web/DESIGN.md`** pré-escrito a partir de `docs/DESIGN-SYSTEM.md` (front-matter YAML de
tokens + 8 seções canônicas) — todos os valores conferidos contra a fonte (paleta clara/escura,
tipografia, espaçamento/raio/elevação).

**Achado real de limitação de sessão**: `npx impeccable init` não é comando de CLI — só existe
como skill invocável via `/impeccable init` dentro do chat do agente, e a lista de skills desta
sessão foi capturada antes de `.claude/skills/impeccable` existir (tentativa real de invocar
confirmou: "Unknown skill: impeccable"). Reiniciar a sessão resolveria, mas a sessão não
consegue fazer isso sozinha. Em vez de pular o item do checklist, `PRODUCT.md` foi escrito à mão
seguindo exatamente o template documentado no próprio `reference/init.md` do skill, populado só
com fatos já documentados (`docs/REQUIREMENTS.md`, `docs/DESIGN-SYSTEM.md`) — **achado real do
Delivery Reviewer**: a primeira versão continha 2 alegações não sourceadas (hábito do usuário
via planilha; comparação com concorrentes) que a própria doc do skill proíbe inventar —
corrigidas antes do commit (marcadas como lacuna em aberto / removida a comparação sem
evidência).

`./init.sh` verde (nenhuma mudança de código de app, 27 testes inalterados). 1 subtask (SV-218).

## `feat-001.9` fechada — CHANGELOG, Test Suite Auditor e verificação final (2026-09-09)

`./init.sh` deste app e da raiz rodados — app verde (27 testes, 97.87% stmts, gate real de 80%
enforced); raiz com falha pré-existente em `auth-service`/`bets-service`/`stats-service`/
`telegram-integration` (mesmo estado observado no início desta sessão, não relacionado a
`apps/web` — fora de escopo corrigir aqui, ver "Escopo restrito" do `CLAUDE.md` raiz).

**Test Suite Auditor** rodado sobre a suíte completa (15 arquivos/27 testes vitest + 2
arquivos/3 testes Playwright) — veredito **PASS**, sem achado bloqueante. Achados não
bloqueantes: `LineChartSample` sem regressão automatizada pro conteúdo visual real do gráfico
(só prova que não lança erro — a correção visual foi verificada manualmente via screenshot,
registrar como `ADD` futuro quando `feat-006` existir); stub de `ResizeObserver` em 2 specs sem
`afterEach` de limpeza (inofensivo hoje); specs das 4 rotas placeholder são boilerplate puro do
`ng generate` (esperado, serão substituídos por `feat-002`+).

**Verificação visual final** (RNF01 + `docs/DESIGN-SYSTEM.md`): 4 combinações reais via
Playwright (`page.screenshot`) — desktop claro, desktop escuro (via `prefers-color-scheme`, não
só o toggle explícito — primeira vez que o fallback de sistema foi provado visualmente, não só
por teste unitário), mobile claro, mobile escuro. Todas confirmam: colapso responsivo pra coluna
única em mobile, painel "Filtros" com 30 itens corretamente limitado à própria altura com scroll
interno (o bug de `feat-001.4`/fix de `feat-001.7` seguindo correto em mobile também), gráfico
renderizando com as cores certas nos dois temas.

**Vault revisado** (item fixo desta subtask) — 3 achados reais desta feature sem nota
correspondente, corrigidos no repositório raiz (`sv-harness`, commit separado por ser outro
repositório Git):
- `docs/CONVENTIONS.md`: gotcha de `:host` sem `display: block` quebrando cadeia de
  dimensionamento (achado de `feat-001.4`/`.7`) — mecanismo reaproveitável pra todo componente
  Angular novo que participa de layout.
- `docs/CONVENTIONS.md`: padrão de escopar biblioteca pesada (`ngx-echarts`) nos `providers` do
  componente em vez de `app.config.ts`, pra manter fora do bundle principal — reaproveitável
  pelos gráficos futuros de `feat-006`.
- `docs/TESTING.md`: convenção de locator do Playwright (`data-testid`, nunca cópia
  traduzida/classe de estilo) + correção da flag de cobertura stale (`--code-coverage` do Karma,
  já não existe mais).

Nenhuma divergência do TCC 1 encontrada nesta feature — não gerou entrada em
`docs/DECISIONS-LOG.md`.

## Achado real de CI — gate SonarCloud (2026-09-09, PR `feature/SV-209` → `develop`)

**Primeira vez que o gate completo (SonarCloud incluído) roda de verdade neste repositório** —
todo PR de subtask pula Sonar de propósito (`docs/CI-CD.md`). No PR story→develop, o scanner do
SonarCloud rodou com sucesso ("ANALYSIS SUCCESSFUL") mas o **quality gate falhou** — log mostrou
`No LCOV files were found using coverage/lcov.info`, ou seja, cobertura zerada pro SonarCloud
mesmo com 97.87% real no `vitest`.

Causa raiz, duas partes: (1) `angular.json` nunca configurou `coverageReporters` — o builder
`@angular/build:unit-test` sem essa opção gera só relatório `html`/console, nunca `lcov.info`;
(2) mesmo gerando, o builder grava em `coverage/<nome-do-projeto>/` (`coverage/web/lcov.info`
neste caso), não `coverage/lcov.info` como `sonar-project.properties` assumia (caminho copiado
de um template genérico, nunca confirmado contra o output real). Corrigido: `angular.json` ganhou
`"coverageReporters": ["text", "html", "lcovonly"]`; `sonar-project.properties` corrigido pra
`coverage/web/lcov.info`. Confirmado localmente que o arquivo passa a existir de verdade
(`find coverage -iname lcov.info` → `coverage/web/lcov.info`) antes de re-empurrar o fix.

## `feat-007` fechada — retrofit do gate de qualidade do SonarCloud (2026-09-09)

Fechamento do achado registrado logo acima (lcov.info) — `apps/web` ganhou o mesmo nivel de
rigor de CI que `auth-service`/`bets-service`/`stats-service`/`telegram-integration` ja tinham:
`-Dsonar.qualitygate.wait=true` (job de CI falha de verdade quando o quality gate reprova, antes
so enviava a analise sem esperar) + passo novo `validate-sonar-issues.py` (zero issues/hotspots
abertos, mais rigoroso que o quality gate padrao). Porte verbatim de
`services/telegram-integration` (mesmo mecanismo, `SonarSource/sonarqube-scan-action@v4` — os 3
servicos Java usam o plugin Maven direto, mecanismo diferente mas mesma logica de
`qualitygate.wait`). Confirmado antes de codificar, via API publica do SonarCloud sem token, que
`eimmig_sv-frontend` tinha 0 issues/0 hotspots — seguro habilitar o gate rigido sem lidar com
backlog retroativo.

Reaproveitou o slot de `feat-007` ja existente no backlog ("Pipeline de CI") em vez de criar uma
feature nova — a description antiga estava obsoleta (pipeline ja existia desde `feat-001.1`,
caminhos/flags stale), corrigida pra refletir o achado real.

**Verificado de verdade, nao so por leitura estatica**: PR real (`feature/SV-220` -> `develop`,
#12 — os passos novos sao guardados pra pular em PR de subtask, entao so esse PR os exercita)
mostra no log do job `-Dsonar.qualitygate.wait=true` presente nos args do scanner e o passo
"Validar zero issues no SonarCloud" rodando com `--pull-request 12` e retornando
`OK SonarCloud sem issues nem security hotspots abertos.` contra a API real.

**Segunda ocorrencia da armadilha de chave `evidence` duplicada** (ja documentada em
`docs/DECISIONS-LOG.md` a partir de um achado em `api-gateway feat-001`) — aconteceu de novo ao
fechar `feat-007` nesta mesma sessao (a mesma edicao que fechou `feat-001` ja tinha caido nela e
sido corrigida): inserir `"evidence"` logo apos `status` sem remover a ocorrencia vazia mais a
frente no objeto zerou o campo silenciosamente, so pego rodando `python -c "json.load(...)"` e
conferindo o tamanho da string, nao so a validade sintatica do JSON. 1 subtask (SV-221, story
SV-220).

## Evidência de conclusão

- Não aplicável ainda.

## Notas para a próxima sessão

Ver `../../docs/services/web.md` para as oito regras de ouro de Shneiderman antes de começar
`feat-004`.

## Atualização — identidade visual StakeVault definida (2026-08-01, mesmo dia, mais tarde)

Usuário forneceu identidade visual final e completa: nome **StakeVault**, logo (anel do cofre +
raios + três barras ascendentes), paleta de cores exata (navy `#0B1622`, verde `#3EC46D`, etc.),
mockup HTML de dashboard e mockup HTML de splash animado — desta vez como código-fonte exato,
não capturas de tela, então pude salvar tudo verbatim em `../../docs/design-references/`
(2 HTMLs + 4 SVGs do logo extraídos/reconstruídos a partir do código fornecido).

Correção de UX importante trazida pelo próprio usuário: verde não pode ser a cor de CTA genérica
num app de bankroll (o usuário lê "botão verde = lucro" por engano) — reservado exclusivamente
para marca/ganho. Nova cor `--color-action-neutral` (azul, derivado por mim por rotação de matiz
do verde — não veio do usuário, flagged no documento) virou a cor padrão de botão/CTA. Isso
reverteu uma decisão da versão anterior do design system (que usava o verde como accent/CTA
genérica, copiando o padrão do Uphold sem considerar a semântica de um app financeiro).

`docs/DESIGN-SYSTEM.md` reescrito nas seções de paleta, tipografia, inventário (3 componentes
novos: grade de KPIs, badge de resultado won/lost/pending, splash animado com as 3 regras de
produção do usuário: não fazer loop infinito, respeitar prefers-reduced-motion, CSS puro sem
Lottie), integração Angular Material (verde vira secondary/tertiary do tema, não mais primary),
e identidade visual (StakeVault substitui o placeholder "Bankroll"). `feat-001` e `CLAUDE.md`
deste app atualizados para refletir os novos assets e a regra semântica de cor.

## Atualização — design system definido (2026-08-01)

Usuário compartilhou capturas de tela do produto Uphold (dashboard autenticado, dark e light
mode) e pediu que todo o esquema de temas/componentes de `apps/web` fosse baseado nelas. Criada
`../../docs/DESIGN-SYSTEM.md` (normativa, mesmo padrão de `../../docs/CONVENTIONS.md`): paleta de
cores claro/escuro com toggle, tipografia (Inter como substituta da fonte do Uphold, não
identificada com certeza), espaçamento/raio/elevação, inventário de 14 componentes mapeados das
capturas, e a abordagem de integração com o tema M3 do Angular Material (gerar a partir da cor
de destaque do Uphold, não da paleta neutra padrão).

Decisões do usuário: (1) suportar claro **e** escuro com toggle, não só um; (2) reusar o mesmo
verde do Uphold como cor de destaque, não adaptar para uma cor própria; (3) usar um placeholder
simples ("Bankroll" + ícone genérico) no lugar do logo do Uphold, já que o produto ainda não tem
nome/marca definidos — documentado como substituível.

`feat-001` deste serviço foi atualizada para incluir a configuração do tema Angular Material M3
a partir desses tokens. `CLAUDE.md` deste serviço ganhou um bullet normativo + um item na
Definição de Pronto (testar nos dois temas). As capturas de tela em si não foram salvas como
arquivo no repositório — `docs/DESIGN-SYSTEM.md` é o registro durável do que foi observado
nelas; se precisão exata de cor importar, não há como revisitar as capturas originais nesta
sessão.

**Complemento (mesmo dia)**: usuário pediu explicitamente para também incorporar o padrão de
**layout em painéis** do Uphold (paineis independentes lado a lado, cada um com rolagem própria
— visível nas três capturas, não só a paleta de cores). Adicionada seção dedicada em
`docs/DESIGN-SYSTEM.md` ("Layout em painéis"): grid multi-coluna, rolagem interna por painel,
colapso responsivo desktop→tablet→mobile, e uma composição sugerida (não obrigatória) por página
(dashboard 2-3 painéis, histórico 1-2, casas de apostas 1, formulário de aposta 1). `feat-001`
ganhou o componente base `app-panel-layout`/`app-panel`; `CLAUDE.md` ganhou o bullet
correspondente.

## Duas lacunas de definição fechadas antes do início de `feat-001` (2026-08-02)

Usuário perguntou se havia algo de frontend ainda por definir. Revisão de `docs/DESIGN-SYSTEM.md`,
`docs/CONVENTIONS.md` e `docs/OBSERVABILITY-AND-CONFIG.md` encontrou duas lacunas reais (nenhuma
biblioteca de gráficos nomeada para o dashboard; nenhuma decisão de como a SPA resolve a URL do
`api-gateway` por ambiente — a seção de `.env` existente é escrita para os serviços Java, não se
aplica a um build estático). Perguntado ao usuário, decisões:

1. **Gráficos (RF10/RF11 UI)**: `ngx-echarts` (Apache ECharts) — sobre `ng2-charts`/Chart.js e
   `ngx-charts` (Swimlane), por dar controle fino suficiente para reproduzir o gradiente
   customizado e o grid sutil do mockup sem CSS/SVG manual.
2. **Config de ambiente**: `environment.ts`/`environment.prod.ts` (build-time, padrão do Angular
   CLI) em vez de config runtime (`config.json` buscado no boot) — simplicidade escolhida sobre
   "build once, deploy many"; trade-off registrado em `docs/OBSERVABILITY-AND-CONFIG.md` caso
   precise mudar depois.

Documentado em `docs/DESIGN-SYSTEM.md` (item 6 do inventário), `docs/OBSERVABILITY-AND-CONFIG.md`
(nova seção "Configuração de apps/web"), `apps/web/CLAUDE.md` e `feat-001` deste
`feature_list.json`. Nenhum código escrito ainda.

## `feat-006` — RF10/RF11 (UI) - dashboards e filtros dinâmicos (2026-09-09)

Última feature de `epic-006` (raiz). Substitui o placeholder de `feat-001.4`/`feat-001.6`
(painel com 30 itens fake + `LineChartSample` com dado mockado) por um dashboard real: painel de
filtros (casa de apostas/esporte/liga/mercado/tipster + período, submit explícito "Aplicar" -
RN08 satisfeita por uma nova consulta real a `GET /api/v1/statistics` a cada aplicação, não
filtragem client-side) e painel de métricas (cards de `overall`, gráfico real de lucro líquido
mensal via `shared/monthly-profit-chart` - substitui `shared/line-chart-sample`, removido por não
ter mais consumidor -, e `mat-tab-group` com breakdown por esporte/mercado/casa de apostas).
`core/statistics-api.ts` (novo) + `core/percent.ts` (novo, `roi`/`winRate` são frações 0..1 no
contrato real, não percentual pronto - confirmado em `CalculateMetricsService.toMetrics` do
`stats-service`).

**Achado real de teste unitário** (não documentado até agora, vale para qualquer futuro teste
com `ngx-echarts` real): `jsdom` não implementa `HTMLCanvasElement.getContext('2d')` sem o
pacote nativo `canvas` (não instalado neste projeto) - `zrender` (renderer do ECharts)
desreferencia esse contexto `null` tanto no `init()` quanto no `dispose()`, o erro geralmente
aparecendo no `afterEach`/cleanup do `TestBed` em vez de na asserção do teste, o que confunde a
causa. Corrigido com um `Proxy` permissivo (`stubCanvasContext`, duplicado por arquivo de teste,
mesmo padrão do `ResizeObserverStub` de `feat-001.6`) - documentado em `docs/CONVENTIONS.md`.

**Achado real de Playwright, causa raiz não era do dashboard** (já sinalizado como risco em
`session-handoff.md` da raiz desde `feat-002.2`): `e2e/panel-layout.spec.ts` já falhava em
`develop` antes desta feature (confirmado rodando a suíte contra o HEAD anterior num worktree
separado) - toda página fixava `height: calc(100vh - 64px)` chutando a altura da nav, mas
`app-language-selector`/`app-theme-toggle` nunca tiveram CSS de posicionamento (arquivos `.scss`
vazios) e ficavam empilhados em fluxo normal acima da nav, e a nav quebra linha conforme mais
links são adicionados - o cabeçalho real sempre foi maior que 64px. O dashboard real (conteúdo
mais alto que o placeholder) finalmente expôs a falha via scroll de página. Corrigido na casca
compartilhada (`app.html`/`app.scss`, não por página): layout flex column real (`.app-shell`
`height:100%` + `.app-shell__content` `flex:1 1 auto;min-height:0;overflow:hidden`), todas as 6
páginas trocaram `calc(100vh - 64px)` por `height: 100%`. Detalhe completo em
`docs/DESIGN-SYSTEM.md` seção "Layout em painéis".

2 subtasks (`feat-006.1` implementação, `feat-006.2` i18n/Playwright/fechamento), mesmo padrão
das features anteriores. `epic-006` (raiz) fecha nesta feature - era a última.

## `feat-009` fechada — RF12 (UI) - atualizar status da aposta (2026-09-09)

`feat-009.1`: `BetsApi.updateStatus` (PATCH `/api/v1/bets/{id}/status`) + 3 botões (Ganha/Perdida/
Devolvida) em linhas `pending` da aba Apostas do histórico; sucesso substitui a linha localmente
(sem reload da lista, mantém página/scroll), erro RFC 7807 exibido via `toProblemDetail`. `RN06`
(transição só `pending`→`won|lost|void`, definitiva) já é imposta pelo backend
(`bets-service`/`BetService.updateStatus`) — frontend só reflete o resultado.

`feat-009.2`: fluxo Playwright novo (`e2e/history.spec.ts`, describe "RF12 - update bet status"):
marcar aposta pendente como ganha atualiza a linha sem reload; uma aposta já liquidada (mock com
2 linhas, uma `pending` e uma `lost`) nunca mostra os botões de ação; erro 422 exibe o detail do
backend sem quebrar a tabela.

**Achado real de teste (self-review no padrão Delivery Reviewer/Test Suite Auditor, sem
subagentes — diff pequeno e escopado)**: a primeira versão do mock da rota de lista
(`page.route('**/api/v1/bets*', ...)`) tinha uma checagem `if (method !== 'GET') return
route.fallback()` pra evitar que ela interceptasse o PATCH de status — checagem morta, nunca
disparava, porque um `*` simples do glob do Playwright não cruza `/`: `'**/api/v1/bets*'` não
casa `'/api/v1/bets/1/status'` (a rota específica registrada no teste já intercepta sozinha, sem
overlap). Removida a checagem, documentado o gotcha em `docs/TESTING.md` seção "Frontend
(apps/web)" (raiz), pra não reincidir em mocks futuros de sub-rota.

`./init.sh` verde (35 arquivos, 95 testes, 85.36% stmts). Playwright completo verde (22/22).
Testado nos dois temas/mobile+desktop já em `feat-009.1` (UI introduzida ali; `feat-009.2` não
acrescentou UI nova). PR #36 (`subtask/SV-250`→`feature/SV-249`), #37 (`subtask/SV-251`→
`feature/SV-249`) e #38 (`feature/SV-249`→`develop`, gate completo com SonarCloud) — todos verdes,
mergeados. Branches apagadas local e remotamente após merge (feature + as 2 subtasks), assim como
todo o lote de branches antigas já mergeadas que ainda não tinham sido limpas
(`feature/SV-209`..`SV-246` + subtasks correspondentes, 26 branches no total).

## `feat-010` fechada — RF13 (UI) - movimentações financeiras (2026-09-09)

`feat-010.1`: `TransactionsApi.create` (POST `/api/v1/transactions`, sem `Idempotency-Key` —
diferente de `POST /bets`, o contrato do backend não exige uma aqui) + painel novo "Nova
movimentação" na aba Movimentações do histórico (`app-panel-layout columns='360px 1fr'`, mesmo
precedente de `betting-houses.html` — painel de formulário + painel de filtro/lista existente).
Decisão de escopo (form vive no histórico, não em casas de apostas): é onde o usuário já olha o
efeito (lista) e filtra por casa de apostas. Sucesso reseta o formulário + banner de sucesso
(mesmo padrão de `register-bet.ts`) + recarrega a página atual da lista (não inserção local — a
lista é paginada/filtrada, a nova transação pode não caber na página/filtro atual).

**Achado real de teste (cobertura de funções, não achado de produto)**: a suíte caiu pra 79.62%
de funções (abaixo do gate de 80%) depois do primeiro passe — o `genericError()` novo de
`createTransaction` só é chamado quando a resposta de erro não tem `detail` no corpo, e o teste
inicial de erro usava um corpo com `detail`, nunca exercitando esse fallback. Corrigido
acrescentando um teste que dispara um erro de rede real (`.error(new ProgressEvent('error'), {
status: 0 })`) em vez de abaixar o gate ou pular a cobertura.

`feat-010.2`: fluxo Playwright novo (`e2e/history.spec.ts`, describe "RF13 - register a
transaction"): criar um depósito reseta o formulário, mostra o banner de sucesso e a lista
recarrega com a nova linha; erro 400 exibe o `detail` do backend. `./init.sh` verde (97 testes,
85.13% stmts/80.24% funcs). Playwright completo verde (24/24).

**Verificação visual real**: 3 screenshots (desktop claro/escuro + mobile claro na aba
Movimentações, via um spec Playwright descartável — não commitado) confirmando o layout em 2
painéis nos dois temas e o colapso mobile (painéis empilham, mesmo padrão já usado em
`betting-houses`/`register-bet`). PR #39 (`subtask/SV-253`→`feature/SV-252`), #40
(`subtask/SV-254`→`feature/SV-252`) e #41 (`feature/SV-252`→`develop`, gate completo com
SonarCloud) — todos verdes, mergeados. Branches apagadas após merge.

## `feat-011` fechada — polish visual moderno, sistema todo (2026-09-09)

5 subtasks, uma PR real por rodada (direção exposta cedo, não só no fechamento — decisão
registrada no `plan_review`), todas mergeadas em `feature/SV-255`:

- **`feat-011.1`**: causa raiz real do bug de contraste relatado pelo usuário — `mat.theme()`
  só rodava em modo claro (`src/styles.scss`), os tokens `--color-*` só cobrem 4 alias
  `--mat-sys-*` genéricos, não os tokens específicos que o Material usa de verdade (ex.: painel
  de overlay de um `mat-select`). Corrigido com uma segunda chamada `mat.theme()` em modo escuro
  sob os mesmos seletores de `tokens.dark-tokens` (padrão oficial do Angular Material pra temas
  múltiplos) — conserta *todo* overlay do Material no app, não só o seletor de idioma que expôs
  o bug. Toggle de tema virou ícone sol/lua; login ganhou logo/wordmark/tagline/gradiente de
  marca. Achado extra: os 4 SVGs do logo tinham comentário antes do `<svg>` raiz, quebrando
  `naturalWidth` em qualquer `<img>` (bug real do Chromium, confirmado com repro isolado) —
  corrigido nos 4 arquivos.
- **`feat-011.2`**: cards de KPI do dashboard e saldo das casas de apostas ganharam cor
  positiva/negativa (`-R$ 320,00` renderizava em preto puro antes) + badge tonal de delta —
  `.badge`/`.badge--positive/negative/neutral` virou utility global em `styles.scss`.
- **`feat-011.3`**: status de aposta e tipo de movimentação no histórico ganharam o badge tonal
  (item 16 do inventário, documentado desde sempre, nunca aplicado); registro de aposta ganhou
  preview de retorno potencial (stake × odd) ao vivo. Achado de teste documentado em
  `docs/TESTING.md`: conteúdo de aba inativa de `mat-tab-group` não é confiável em unit test sob
  jsdom (animação não completa sem `transitionend` real) — testar a lógica isolada, provar o
  render de verdade em Playwright.
- **`feat-011.4`**: avatar de iniciais na tela de usuários (item 14 do inventário, documentado
  desde a primeira sessão de design, nunca implementado em lugar nenhum) + badge de papel.
  `CatalogManager` — a única tela do app ainda com um `<ul>` cru, sem `app-panel-layout` — ganhou
  o mesmo padrão form-panel+list-panel de todas as outras telas.
- **`feat-011.5`**: auditoria final via `npx impeccable detect` contra servidor real. Achou de
  novo o contraste de `--color-text-secondary` no modo escuro (4.47:1, já sinalizado sem correção
  desde `feat-002`, que deixou a decisão explícita pra quando outra feature tocasse o token de
  novo) — perguntado ao usuário via `AskUserQuestion`, decisão: corrigir. Novo valor `#8B99A2`
  mede ~5:1 nos dois fundos escuros. 1 achado (bounce-easing do splash) revisado e rejeitado —
  escolha de design explícita e documentada (`docs/DESIGN-SYSTEM.md` item 17), não bug.

`./init.sh` e Playwright completo (24/24) verdes em cada subtask e na feature inteira. PR
`feature/SV-255`→`develop` (#47) pegou 2 achados reais do SonarCloud no gate (nested ternary em
`dashboard.ts`, `.at(-1)` preferível a indexação por `.length - 1` em `users.ts`) — corrigidos
com um commit adicional na mesma branch antes do gate passar, sem subtask nova (correção de gate,
não escopo novo). Verificação visual real (screenshots, não só leitura de código) nas 7 telas
tocadas, claro/escuro, desktop/mobile. Vault atualizado nos mesmos commits das descobertas:
`docs/DESIGN-SYSTEM.md` (correção da seção Angular Material, nota de contraste fechada, item 14
implementado), `docs/TESTING.md` (gotcha de `mat-tab-group`/jsdom). Branches apagadas após merge
(feature + 5 subtasks). Backlog de `apps/web` inteiro concluído com esta feature.
