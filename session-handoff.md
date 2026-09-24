# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-24

## Objetivo atual

`feat-046`, `feat-048`..`feat-052` e `feat-054` fechadas. Em aberto: `feat-047` (aguarda decisão do usuário: não existe dashboard de times) e `feat-053` (conexão recusada pelo dev server, 1 em 9 rodadas).

## Concluído nesta sessão (2026-09-24)

- [x] **`feat-044` fechada** — splash de boot removida; montagem do logo virou o overlay de
      carregamento do app inteiro (`core/loading*`). Story SV-594, ver `progress.md`.
- [x] **`feat-041` fechada** — gráfico de lucro do dashboard por dia quando o período tem até 31
      dias. Story SV-599. E2E que abre `/dashboard` precisa mockar `/statistics/daily`.
- [x] **`feat-040` fechada** — todo gráfico dentro de `shared/chart-frame` (título, legenda, `?`).
      Story SV-603. Gráfico novo entra já dentro do frame.
- [x] **`feat-038` fechada** — PRE/LIVE vira filtro de Buscar Estatísticas; `/bet-type-dashboard`
      redireciona para a busca. Story SV-610 (`epic-035`, backend em `stats-service feat-024`).
- [x] **`feat-045` fechada** — rótulos de eixo legíveis (`--color-text-secondary`). Story SV-614.
      Regra nova do usuário: apontamento fora de escopo vira feature no `feature_list.json`.
- [x] **`feat-046` fechada** — valores A/B do comparativo alinhados ao cabeçalho. Story SV-617.
- [x] **`feat-048` fechada** — ano nas datas do gráfico acima de 1 ano. Story SV-620.
- [x] **`feat-050` fechada** — ícone de odd média válido na fonte clássica. Story SV-624.
- [x] **`feat-049` fechada** — cache de GET `/api/`; voltar a tela carregada não mostra loading. Story SV-627.
- [x] **`feat-052` fechada** — tooltip dos gráficos no tema ativo. Story SV-630.
- [x] **`feat-051` fechada** — suíte E2E determinística (3 causas de flake). Story SV-633.
- [x] **`feat-054` fechada** — erro de render não congela mais o overlay. Story SV-638.

## Bloqueios / Riscos

- **`feat-047` (menu flutuante em Times) depende de decisão do usuário**: não existe dashboard de
  times (`GET /api/v1/statistics` não tem `byTeam`; `app-side-nav.ts` comenta a ausência). Criar um
  exige `stats-service` (segmento por time, aposta com 2 times) — cross-service, precisa de epic na raiz.
- Cache de GET (`feat-049`): dado novo vindo do Telegram/outra aba só aparece após 5 min ou após
  uma mutação no próprio web.

- `NativeDateAdapter.parse()` (Angular Material) é `Date.parse()` puro — sempre M/D/Y para uma
  string com `/`, nunca respeitando `MAT_DATE_LOCALE`/`setLocale()`. Qualquer campo novo de
  **texto livre digitado** ligado a `matDatepicker` neste app deve usar `[appDateMask]`
  (`core/date-mask.directive.ts`) em vez de reinventar formatação. **Não se aplica** aos novos
  campos de mês/ano de `feat-039` (`monthly-drawdown-grid`) — são `readonly`, só clique no
  calendário, sem parsing de texto digitado envolvido.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Próxima feature `not-started` do `feature_list.json` (`feat-047` bloqueada por decisão, `feat-053`).
3. Se for mexer em `services/api-gateway`/serviços Java localmente (fora de Docker): `.env` não
   carrega sozinho em `mvn spring-boot:run` — precisa `SPRING_PROFILES_ACTIVE=dev` exportado, e o
   CORS default do gateway libera só `localhost:4200`, não a porta real do `ng serve` (`4300`)
   — ambos já documentados em `docs/observabilidade-e-configuracao.md`, ler antes de tentar.
