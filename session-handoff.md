# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-021`, `feat-025` e `feat-030` `done` (`feat-022`..`024`, `026`..`029` seguem
`not-started`). `feat-025` (ponte de navegação Casas de Apostas -> Histórico), `feat-030` (CD
automático, `epic-028`) e `feat-020`+`feat-021` (rótulo "Data do evento" + correção de quebra real
em `POST /api/v1/bets`, `epic-024`) fecharam nesta sessão.

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019` fechada (epic-023, sidebar) — ver entrada datada em `progress.md`.
- [x] `feat-025` fechada (4 subtasks reduzidas a 3 após investigação, story SV-403, PRs #89-91).
      Escopo real bem menor que o backlog original: formulário de depósito/retirada já existia
      completo em `History`, só faltava alcançá-lo a partir de `Betting Houses` (ponte de
      navegação via query param). Achado real corrigido: bug de "grid blowout" em `shared/panel`
      (`min-width: 0` faltando), exposto pela coluna nova — corrigido no componente
      compartilhado. Ver `progress.md` para o detalhe completo.
- [x] **`feat-030` fechada** (CD automático — job `deploy` em `ci.yml`, `kubectl rollout restart
      deployment/web` contra `KUBE_CONFIG`/`ci-deployer` de `infra/feat-007`). Sexta e última
      aplicação idêntica do padrão de `epic-028` (fechado por completo nesta sessão nos 6
      repositórios de aplicação) — único repositório frontend tocado pelo padrão, mas o job em si
      é agnóstico de stack. Story SV-438, subtasks SV-439/SV-440, PRs #93/#94/#95, CI+SonarCloud
      verdes. `Delivery Reviewer`: PASS (revisão condensada). Disparo real do job adiado (mesma
      decisão dos outros 5 repositórios — promoção `develop -> main` é decisão de release mais
      ampla).
- [x] **`feat-020` fechada** (rótulo "Data da aposta" -> "Data do evento", 3 locales). Story
      SV-443, PRs #96/#97/#98.
- [x] **`feat-021` fechada — corrige quebra real de produção**: `bets-service feat-017` (fechada
      mais cedo na mesma sessão) trocou `team1`/`team2` (texto livre) por `team1Id`/`team2Id`
      (UUID) em `POST /api/v1/bets`, e este repositório nunca acompanhou — todo registro manual de
      aposta pelo site estava recebendo 400. `Plan Reviewer` revisado (substitui o veredito
      `BLOCKED` anterior, cuja dependência de fundo fechou na mesma sessão): tela nova
      `shared/team-manager` (catálogo de times vinculado a esporte — `TEAM` não é estruturalmente
      idêntico aos 4 catálogos de `shared/catalog-manager`, que ficou intocado) + `register-bet`
      trocando os 2 inputs de texto por selects `team1Id`/`team2Id`. `Delivery Reviewer` (skill
      completa, não condensada): PASS — verificação independente confirmou o contrato batendo
      exatamente com `CreateBetRequest.java` e zero referência residual a `team1`/`team2` texto
      livre. Story SV-446, subtasks SV-447/SV-448, PRs #99/#100/#101, CI+SonarCloud verdes.

## Bloqueios / Riscos

Nenhum. **A quebra que bloqueava o deploy de `bets-service` em produção (documentada em
`services/bets-service/session-handoff.md`) está resolvida** — `apps/web` já não envia mais
`team1`/`team2` texto livre.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Backlog aberto deste harness: `feat-022`..`024`, `026`..`029` (`not-started`), mapeados aos
   epics `epic-024`/`026`/`027`/`020`/`021` da raiz — `Plan Reviewer` já rodou contra todos numa
   sessão anterior (ver `plan_review` de cada um em `feature_list.json`). Vereditos variam de
   `READY` a `BLOCKED` — `feat-026`(parte 2, byBetType)/`feat-029` têm decisão pendente do usuário
   antes de codificar (ver o texto de cada `plan_review`). `feat-024` (espaçamento dos cadastros)
   é `READY`, sem bloqueio conhecido. `feat-022` (date picker) tem 2 achados MAJOR do Plan
   Reviewer já corrigidos no plano (ver seu `plan_review`) — reler antes de codificar.
3. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` numa sessão anterior — qualquer
   página nova que use `app-panel` com conteúdo largo (tabela, código) já herda a proteção contra
   "grid blowout" (ver `docs/CONVENTIONS.md`), não precisa repetir o fix.
4. Quando este repositório promover `develop -> main` pela primeira vez desde `feat-030`:
   confirmar o job `deploy` rodando de verdade (log do GitHub Actions) e registrar em
   `../../docs/services/infra.md`.
