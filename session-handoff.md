# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-15

## Objetivo atual

`feat-001`..`feat-021`, `feat-025`, `feat-028` e `feat-030` `done` (`feat-022`..`024`, `026`,
`027`, `029` seguem `not-started`). `epic-020` da raiz fechado por completo (`feat-028`).

## Concluído nesta sessão (2026-09-15)

- [x] `feat-019` fechada (epic-023, sidebar) — ver entrada datada em `progress.md`.
- [x] `feat-025` fechada (ponte de navegação Casas de Apostas -> Histórico). Ver `progress.md`.
- [x] `feat-030` fechada (CD automático, `epic-028` da raiz — o epic de infra, não confundir com
      `apps/web feat-028` desta sessão). Ver `progress.md`.
- [x] `feat-020`+`feat-021` fechadas (rótulo "Data do evento" + correção de quebra real em
      `POST /api/v1/bets`). Ver `progress.md`.
- [x] **`feat-028` fechada — fecha `epic-020` da raiz por completo**: grade mensal de drawdown
      (curva acumulada em unidades) na nova aba do dashboard consolidado. `Delivery Reviewer`
      (skill completa): PASS. 2 achados reais corrigidos antes de fechar: design (2 campos de mês
      batched atrás de um botão Aplicar, evitando requests sobrepostos) e uma regressão real
      pré-existente de `feat-021` no e2e de `register-bet` (só apareceu rodando a suíte e2e
      inteira). QA visual real achou e corrigiu um bug de responsividade mobile. 2 achados do
      SonarCloud no gate pesado corrigidos (teste sem assertion reconhecida; reassignment
      redundante). Ver `progress.md` para o detalhe completo.
- [x] **Os 6 repositórios de aplicação promovidos `develop -> main`** — `apps/web` incluído.
      Achado real de infraestrutura (não de código, não desta feature): o job `deploy` automático
      falha em todos os 6, `KUBE_CONFIG` aponta pro túnel SSH local do usuário, inalcançável por
      um runner hospedado do GitHub Actions. Usuário decidiu deixar como está por agora. Detalhe
      completo em `../../docs/services/infra.md` "CD automático via CI" e
      `../../session-handoff.md`.

## Bloqueios / Riscos

Nenhum. A imagem `:latest` deste repositório no GHCR está atualizada (main promovido) — o
`kubectl rollout restart` em produção continua manual (túnel SSH) até a decisão de rede acima ser
revisitada.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Backlog aberto deste harness: `feat-022`..`024`, `026`, `027`, `029` (`not-started`), mapeados
   aos epics `epic-024`/`026`/`027`/`021` da raiz — `Plan Reviewer` já rodou contra todos numa
   sessão anterior (ver `plan_review` de cada um em `feature_list.json`). Vereditos variam de
   `READY` a `BLOCKED` — `feat-026`(parte 2, byBetType)/`feat-029` têm decisão pendente do usuário
   antes de codificar (ver o texto de cada `plan_review`). `feat-024` (espaçamento dos cadastros)
   é `READY`, sem bloqueio conhecido. `feat-022` (date picker) tem 2 achados MAJOR do Plan
   Reviewer já corrigidos no plano (ver seu `plan_review`) — reler antes de codificar.
3. `app-panel` (`shared/panel`) ganhou `min-width: 0` no `:host` numa sessão anterior — qualquer
   página nova que use `app-panel` com conteúdo largo (tabela, código) já herda a proteção contra
   "grid blowout" (ver `docs/CONVENTIONS.md`), não precisa repetir o fix.
4. Ao adicionar uma chamada HTTP nova a um `forkJoin` já existente numa página (ex.: mais um
   catálogo), atualizar o mock e2e (`page.route`) daquela página no mesmo commit — ver
   `docs/TESTING.md` (achado real desta sessão, `feat-021`/`feat-028`) — e rodar
   `npx playwright test` completo (não só o arquivo tocado) antes de fechar a feature.
