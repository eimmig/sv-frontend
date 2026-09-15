# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-021`, `feat-025`, `feat-027`, `feat-028` e `feat-030` `done` (`feat-022`..`024`,
`026`, `029` seguem `not-started`). `epic-020`/`epic-023` da raiz fechados por completo.
`epic-027` segue `in-progress` — só `feat-027` fechou; `feat-026` (mesmo epic) ainda `REVISE`.

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019`, `feat-025`, `feat-030`, `feat-020`+`feat-021`, `feat-028` fechadas — ver
      entradas datadas em `progress.md`.
- [x] Os 6 repositórios de aplicação promovidos `develop -> main`. Achado real de infraestrutura
      (deploy automático `kubectl` inalcançável do runner GitHub) documentado em
      `../../docs/services/infra.md` e `../../session-handoff.md`; usuário decidiu deixar como
      está por agora.
- [x] **`feat-027` fechada** — tela de vínculo da conta Telegram (`TelegramLinkApi` +
      `pages/telegram-link`, rota `/telegram-link`, entrada em `app-side-nav`). Sem desvio do
      plano (`Plan Reviewer` já READY de sessão anterior). QA visual real (desktop/mobile,
      claro/escuro) sem achado. `ng test` 201/201, Playwright 50/50 (suíte inteira, não só os
      specs tocados). Ver `progress.md` para o detalhe completo.

## Bloqueios / Riscos

Nenhum. A imagem `:latest` deste repositório no GHCR está atualizada — o `kubectl rollout
restart` em produção continua manual (túnel SSH) até a decisão de rede de `infra.md` ser
revisitada.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. `epic-027` da raiz segue `in-progress`: falta só `feat-026` para fechá-lo. `feat-026` é
   `REVISE` — antes de codificar, decidir quem é dono do campo `byBetType`
   (`core/statistics-api.ts`, `BetMetrics`): a parte 2 de `feat-026` ("Alinhar betType e exibir
   agrupamento PRE/LIVE") ou `feat-029`/`epic-021`, que hoje tem um comentário explícito dizendo
   "byBetType stays out of scope (epic-021 consumes it)". Ler o `plan_review` de `feat-026` na
   íntegra antes de decidir — se for uma decisão de design real (não só "quem primeiro"),
   perguntar ao usuário em vez de decidir sozinho.
3. Backlog aberto restante deste harness: `feat-022`..`024`, `026`, `029` (`not-started`),
   mapeados aos epics `epic-024`/`026`/`021` da raiz. `feat-024` (espaçamento dos cadastros) é
   `READY`, sem bloqueio conhecido. `feat-022` (date picker) tem 2 achados MAJOR do Plan Reviewer
   já corrigidos no plano — reler antes de codificar.
4. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` numa sessão anterior — qualquer
   página nova que use `app-panel` com conteúdo largo já herda a proteção contra "grid blowout",
   não precisa repetir o fix.
5. Ao adicionar uma chamada HTTP nova a um `forkJoin` já existente numa página, atualizar o mock
   e2e (`page.route`) daquela página no mesmo commit e rodar `npx playwright test` completo (não
   só o arquivo tocado) antes de fechar a feature — achado real de `feat-021`/`feat-028`, ver
   `docs/TESTING.md`.
6. `page.route()` no Playwright dá prioridade ao handler registrado **por último** (LIFO) — um
   mock genérico (`**/api/**`) registrado depois de um mock específico o sobrepõe inteiramente.
   Registrar sempre o genérico primeiro, o específico depois (gotcha hit num script de QA visual
   ad-hoc desta sessão, fora da suíte de testes real — que já registra 1 handler por padrão e
   nunca teve esse conflito).
