# Log de Progresso — web

## Estado Atual (Current State)

**Última atualização:** 2026-09-09
**Estado:** `feat-001` e `feat-007` `done`. `feat-002` (RF01/RF02 UI) `in-progress` —
`feat-002.1` `done`, restam `feat-002.2`..`feat-002.4`.

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
