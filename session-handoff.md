# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-019` e `feat-025` `done` (`feat-020`..`024`, `026`..`029` seguem
`not-started`). `feat-025` (ponte de navegação Casas de Apostas -> Histórico para movimentação de
saldo, `epic-025` da raiz) fechou nesta sessão, logo após `feat-019` (`epic-023`).

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019` fechada (epic-023, sidebar) — ver entrada datada em `progress.md`.
- [x] `feat-025` fechada (4 subtasks reduzidas a 3 após investigação, story SV-403, PRs #89-91).
      Escopo real bem menor que o backlog original: formulário de depósito/retirada já existia
      completo em `History`, só faltava alcançá-lo a partir de `Betting Houses` (ponte de
      navegação via query param). Achado real corrigido: bug de "grid blowout" em `shared/panel`
      (`min-width: 0` faltando), exposto pela coluna nova — corrigido no componente
      compartilhado. Ver `progress.md` para o detalhe completo.

## Bloqueios / Riscos

Nenhum.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Backlog aberto deste harness: `feat-020`..`024`, `026`..`029` (`not-started`), mapeados aos
   epics `epic-024`/`026`/`027`/`020`/`021` da raiz — `Plan Reviewer` já rodou contra todos numa
   sessão anterior (ver `plan_review` de cada um em `feature_list.json`). Vereditos variam de
   `READY` a `BLOCKED` — `feat-021`/`feat-026`(parte 2, byBetType)/`feat-029` têm decisão
   pendente do usuário antes de codificar (ver o texto de cada `plan_review`). `feat-020`
   (renomear "data da aposta") e `feat-024` (espaçamento dos cadastros) são `READY`, sem
   bloqueio conhecido.
3. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` nesta sessão — qualquer página
   nova que use `app-panel` com conteúdo largo (tabela, código) já herda a proteção contra "grid
   blowout" (ver `docs/CONVENTIONS.md`), não precisa repetir o fix.
