# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-021`, `feat-025`..`feat-028`, `feat-030` `done` (`feat-022`..`024`, `029` seguem
`not-started`). `epic-020`/`epic-023`/`epic-027` da raiz fechados por completo.

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019`, `feat-025`, `feat-030`, `feat-020`+`feat-021`, `feat-028` fechadas — ver
      entradas datadas em `progress.md`.
- [x] Os 6 repositórios de aplicação promovidos `develop -> main`. Achado real de infraestrutura
      (deploy automático `kubectl` inalcançável do runner GitHub) documentado em
      `../../docs/services/infra.md` e `../../session-handoff.md`; usuário decidiu deixar como
      está por agora.
- [x] `feat-027` fechada — tela de vínculo da conta Telegram (`TelegramLinkApi` +
      `pages/telegram-link`).
- [x] **`feat-026` fechada — fecha `epic-027` da raiz por completo**: `register-bet`'s `betType`
      trocado de texto livre para `mat-select` PRE/LIVE (`feat-026.1`); `byBetType` tipado em
      `core/statistics-api.ts` e exibido num dashboard novo (`/bet-type-dashboard`, reusa
      `shared/catalog-dashboard`) (`feat-026.2`). Decisão de ownership de `byBetType` (competia
      com `feat-029`/`epic-021`) levada ao usuário via `AskUserQuestion` antes de codificar —
      decidiu que `feat-026` é a dona. Ver `progress.md` para o detalhe completo.

## Bloqueios / Riscos

Nenhum. A imagem `:latest` deste repositório no GHCR está atualizada — o `kubectl rollout
restart` em produção continua manual (túnel SSH) até a decisão de rede de `infra.md` ser
revisitada.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Backlog aberto restante deste harness: `feat-022`..`024`, `029` (`not-started`), mapeados aos
   epics `epic-024`/`epic-021` da raiz. `epic-021` (raiz) agora tem todas as dependências
   satisfeitas (`epic-026`/`epic-027` `done`) — elegível para começar `feat-029` ("Visão geral"
   pós-login), mas ela é `BLOCKED` no seu próprio `plan_review`: falta resolver a dependência
   cross-repo de `api-gateway feat-013` (`not-started`) e a decisão de como obter "a data mais
   antiga do histórico" (proxy via `/statistics/daily` sem `from`/`to`, não decidido). `feat-026`
   (que ela dependia) já fechou, então essa parte do bloqueio caiu — reler o `plan_review`
   completo antes de popular subtasks.
3. `feat-024` (espaçamento dos cadastros) é `READY`, sem bloqueio conhecido. `feat-022` (date
   picker) tem 2 achados MAJOR do Plan Reviewer já corrigidos no plano — reler antes de codificar.
4. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` numa sessão anterior — qualquer
   página nova que use `app-panel` com conteúdo largo já herda a proteção contra "grid blowout",
   não precisa repetir o fix.
5. Ao adicionar uma chamada HTTP nova a um `forkJoin` já existente numa página, atualizar o mock
   e2e (`page.route`) daquela página no mesmo commit e rodar `npx playwright test` completo (não
   só o arquivo tocado) antes de fechar a feature — achado real de `feat-021`/`feat-028`, ver
   `docs/TESTING.md`.
6. `page.route()` no Playwright dá prioridade ao handler registrado **por último** (LIFO) — ver
   `docs/TESTING.md` (achado de `feat-027.3`).
7. `shared/catalog-dashboard` é genérico o bastante pra qualquer segmento futuro de
   `StatisticsDashboard` com o mesmo formato (`dimensionId`/`dimensionName`/`metrics`) — só
   adicionar a chave em `CatalogSegment` e uma rota, sem componente novo (usado por `feat-026`
   pra `byBetType`).
