# Log de Progresso — web

## Estado Atual (Current State)

**Última atualização:** 2026-09-09
**Feature ativa:** `feat-001` (`feat-001.1`/`.2` done, `feat-001.3`..`.9` restantes)

## Status

### O que está pronto

- [x] Harness deste app criado.
- [x] `feat-001.1` (`ng new` real + roteamento + HttpClient/interceptor + environments) — `done`
      em 2026-09-09.
- [x] `feat-001.2` (Angular Material M3 + tema claro/escuro + tokens StakeVault) — `done` em
      2026-09-09.

### Em andamento

- `feat-001` — próxima subtask: `feat-001.3` (transloco i18n).

### Próximos passos (Next Steps)

1. `feat-001.3`..`feat-001.9` (ver `feature_list.json` deste app).

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
