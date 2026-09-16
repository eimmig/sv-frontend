# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-021`, `feat-025`..`feat-030` `done` (`feat-022`..`024` seguem `not-started`).
`epic-020`/`epic-023`/`epic-021`/`epic-027` da raiz fechados por completo.

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019`, `feat-025`, `feat-030`, `feat-020`+`feat-021`, `feat-028` fechadas — ver
      entradas datadas em `progress.md`.
- [x] Os 6 repositórios de aplicação promovidos `develop -> main`. Achado real de infraestrutura
      (deploy automático `kubectl` inalcançável do runner GitHub) documentado em
      `../../docs/services/infra.md` e `../../session-handoff.md`; usuário decidiu deixar como
      está por agora.
- [x] `feat-027` + `feat-026` fechadas — fecham `epic-027` da raiz (tela de vínculo Telegram,
      `betType` alinhado a `mat-select` PRE/LIVE, `byBetType` tipado e exibido). Decisão de
      ownership de `byBetType` levada ao usuário via `AskUserQuestion`.
- [x] **`feat-029` fechada — fecha `epic-021` da raiz por completo**: tela "Visão geral"
      pós-login (`/overview`), curva de lucro acumulado vitalícia, 4 cards, tabela mensal.
      **Login agora redireciona pra `/overview` em vez de `/dashboard`** (decisão do usuário via
      `AskUserQuestion`). Achado real: `monthly[]` de `GET /api/v1/statistics` não vem escopado
      ao ano corrente sem filtro de período — filtrado client-side. Achado real de teste:
      `navigator.language` sem limpeza vazando entre specs em CI, corrigido. Ver `progress.md`
      para o detalhe completo.

## Bloqueios / Riscos

Nenhum. A imagem `:latest` deste repositório no GHCR está atualizada — o `kubectl rollout
restart` em produção continua manual (túnel SSH) até a decisão de rede de `infra.md` ser
revisitada.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Backlog aberto restante deste harness: `feat-022`..`024` (`not-started`), mapeados ao
   `epic-024` da raiz (harness oficial `services/bets-service/`, mas essas 3 features vivem em
   `apps/web`). `feat-024` (espaçamento dos cadastros) é `READY`, sem bloqueio conhecido.
   `feat-022` (date picker) tem 2 achados MAJOR do Plan Reviewer já corrigidos no plano — reler
   antes de codificar.
3. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` numa sessão anterior — qualquer
   página nova que use `app-panel` com conteúdo largo já herda a proteção contra "grid blowout",
   não precisa repetir o fix.
4. Ao adicionar uma chamada HTTP nova a um `forkJoin` já existente numa página, atualizar o mock
   e2e (`page.route`) daquela página no mesmo commit e rodar `npx playwright test` completo (não
   só o arquivo tocado) antes de fechar a feature — achado real de `feat-021`/`feat-028`, ver
   `docs/TESTING.md`.
5. `page.route()` no Playwright dá prioridade ao handler registrado **por último** (LIFO) — ver
   `docs/TESTING.md` (achado de `feat-027.3`).
6. **`Object.defineProperty(navigator, 'language', ...)` em spec novo sempre precisa de
   `delete (navigator as {language?: string}).language` no `afterEach`** — sem isso, a
   sobrescrita vaza pro próximo arquivo de teste no mesmo worker do Vitest e quebra uma asserção
   de formatação numérica sem relação óbvia com a causa, só reproduzível em CI (achado real de
   `feat-029.3`, ver `docs/TESTING.md`). Todo spec que já faz isso corretamente:
   `core/language.spec.ts`, `pages/history/history.spec.ts`, `telegram-link.spec.ts`,
   `overview.spec.ts` — usar como referência.
7. `shared/catalog-dashboard` é genérico o bastante pra qualquer segmento futuro de
   `StatisticsDashboard` com o mesmo formato (`dimensionId`/`dimensionName`/`metrics`) — só
   adicionar a chave em `CatalogSegment` e uma rota, sem componente novo.
8. **`monthly` de `GET /api/v1/statistics` não vem escopado ao ano corrente quando a chamada não
   tem `from`/`to`** — agrupa `(year, month)` sobre o histórico inteiro do tenant. Qualquer
   página futura que precise "só o ano corrente" precisa filtrar client-side (ver
   `buildMonthlyTable`, `pages/overview/overview-metrics.ts`, e `docs/API-CONTRACTS.md`).
