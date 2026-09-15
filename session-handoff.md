# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-019` `done` — backlog atual deste harness concluído. `feat-019` (correções de
UX da sidebar: centralização de ícones, tema do botão de colapsar, idioma acessível colapsado)
fechou nesta sessão, fecha `epic-023` (raiz).

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019` fechada (4 subtasks, story SV-398, PRs #84-87). 3 bugs reais corrigidos, todos
      com causa raiz diferente do suspeito no `plan_review` — ver `progress.md` para o detalhe
      completo (centralização do `theme-toggle`, `MatButtonModule` faltando no botão de colapsar,
      `language-selector` saindo do DOM quando colapsado). Achado lateral corrigido: 2 testes
      (unitário + e2e) de `period-report` dependiam de `new Date()` real vs. fixture fixa em
      `2026-09-11` — congelado o relógio em vez de mudar a fixture.
- [x] Achado de processo, não relacionado a `feat-019`: `app-login-border-trace` (`feat-018.3`)
      tinha uma reformulação completa sentada sem commitar desde uma sessão anterior (pedido de
      ajuste do usuário, 2026-09-12) — commitada nesta sessão como fechamento avulso, com adendo
      registrado em `feat-018` (não abriu feature nova).

## Bloqueios / Riscos

Nenhum.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`) — **Docker Desktop não é necessário aqui** (esse harness não
   usa Testcontainers), mas se algum outro harness for tocado na mesma sessão, verificar.
2. Backlog aberto deste harness: `feat-020`..`feat-029` (`not-started`), mapeados aos epics
   `epic-024`/`025`/`026`/`027`/`020`/`021` da raiz — `Plan Reviewer` já rodou contra todos numa
   sessão anterior (ver `plan_review` de cada um em `feature_list.json`), incluindo 2 features
   novas criadas na hora (`feat-028`/`029`, para `epic-020`/`021`, que não tinham backlog
   granular). Vereditos variam de `READY` a `BLOCKED` — `feat-021`/`feat-026`(parte 2)/`feat-029`
   têm decisão pendente do usuário antes de codificar (ver o texto de cada `plan_review`).
3. `period-report.spec.ts`/`e2e/period-report.spec.ts` agora usam relógio congelado — qualquer
   teste novo que dependa de "hoje" (presets de período, filtros relativos a data) deve seguir o
   mesmo padrão desde o início (ver `docs/TESTING.md`).
