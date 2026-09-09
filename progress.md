# Log de Progresso — web

## Estado Atual (Current State)

**Última atualização:** 2026-09-09
**Feature ativa:** `feat-001` (`feat-001.1`..`.5` done, `feat-001.6`..`.9` restantes)

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

### Em andamento

- `feat-001` — próxima subtask: `feat-001.6` (ngx-echarts instalado e provado).

### Próximos passos (Next Steps)

1. `feat-001.6`..`feat-001.9` (ver `feature_list.json` deste app).

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
