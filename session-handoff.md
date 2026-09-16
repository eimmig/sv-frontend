# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-021`, `feat-023`, `feat-025`..`feat-030` `done` (`feat-022`, `feat-024` seguem
`not-started`). `epic-020`/`epic-021`/`epic-023`/`epic-027` da raiz fechados por completo.

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019`, `feat-025`, `feat-030`, `feat-020`+`feat-021`, `feat-028` fechadas — ver
      entradas datadas em `progress.md`.
- [x] Os 6 repositórios de aplicação promovidos `develop -> main`. Achado real de infraestrutura
      (deploy automático `kubectl` inalcançável do runner GitHub) documentado em
      `../../docs/services/infra.md` e `../../session-handoff.md`; usuário decidiu deixar como
      está por agora.
- [x] `feat-027` + `feat-026` fechadas — fecham `epic-027` da raiz (tela de vínculo Telegram,
      `betType` alinhado a `mat-select` PRE/LIVE, `byBetType` tipado e exibido).
- [x] `feat-029` fechada — fecha `epic-021` da raiz (tela "Visão geral" pós-login, `/overview`,
      login redireciona pra cá em vez de `/dashboard`).
- [x] **`feat-023` fechada** — corrige a sobreposição real do seletor de idioma reportada pelo
      usuário no login. Causa raiz real (medida contra o dev server): `display: block` envolvendo
      um filho `width: 100%` sem largura definida em nenhum ancestral. Ver `progress.md` para o
      detalhe completo, inclusive o gotcha reutilizável documentado em `docs/CONVENTIONS.md`.

## Bloqueios / Riscos

Nenhum. A imagem `:latest` deste repositório no GHCR está atualizada — o `kubectl rollout
restart` em produção continua manual (túnel SSH) até a decisão de rede de `infra.md` ser
revisitada.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Backlog aberto restante deste harness: `feat-022` e `feat-024` (`not-started`), ambos mapeados
   ao `epic-024` da raiz (harness oficial `services/bets-service/`, mas o escopo restante vive
   todo aqui). `feat-024` (espaçamento dos cadastros) é `READY`, sem bloqueio conhecido — próximo
   candidato natural. `feat-022` (date picker) está `REVISE`: falta decidir/confirmar o
   `DateAdapter` reativo ao idioma ativo e como tratar `betDate` (datetime-local — `mat-timepicker`
   vs. 2 controles separados) antes de codificar, ver o `plan_review` completo.
3. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` numa sessão anterior — qualquer
   página nova que use `app-panel` com conteúdo largo já herda a proteção contra "grid blowout",
   não precisa repetir o fix.
4. Ao adicionar uma chamada HTTP nova a um `forkJoin` já existente numa página, atualizar o mock
   e2e (`page.route`) daquela página no mesmo commit e rodar `npx playwright test` completo (não
   só o arquivo tocado) antes de fechar a feature — ver `docs/TESTING.md`.
5. `page.route()` no Playwright dá prioridade ao handler registrado **por último** (LIFO) — ver
   `docs/TESTING.md`.
6. `Object.defineProperty(navigator, 'language', ...)` em spec novo sempre precisa de
   `delete (navigator as {language?: string}).language` no `afterEach` — sem isso, a sobrescrita
   vaza pro próximo arquivo de teste no mesmo worker do Vitest, só reproduzível em CI. Ver
   `docs/TESTING.md`.
7. **Um componente compartilhado com `width: 100%`/`height: 100%` interno só funciona corretamente
   se TODO ancestral em que for reusado der a ele uma largura/altura definida** (`display: block`
   não tem garantia de spec pra medir um filho percentual quando o próprio ancestral também se
   auto-dimensiona pelo conteúdo — usar `display: flex` no ancestral nesse caso). Achado real de
   `feat-023.1` (`core/language-selector`). Ver `docs/CONVENTIONS.md`.
8. `shared/catalog-dashboard` é genérico o bastante pra qualquer segmento futuro de
   `StatisticsDashboard` com o mesmo formato — só adicionar a chave em `CatalogSegment` e uma
   rota, sem componente novo.
9. `monthly` de `GET /api/v1/statistics` não vem escopado ao ano corrente quando a chamada não
   tem `from`/`to` — ver `docs/API-CONTRACTS.md` e `pages/overview/overview-metrics.ts`.
