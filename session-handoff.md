# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-10

## Objetivo atual

`feat-001`..`feat-012` `done` — todo o backlog atual deste harness está concluído. `feat-012`
(tela "Buscar Estatísticas") fechou nesta sessão, fecha `epic-012` (raiz).

## Concluído nesta sessão (2026-09-10)

- [x] `feat-012` fechada (7 subtasks, story SV-303, PRs #48-55). Ver `progress.md` para o
      detalhe completo — inclui um achado real de mock de teste (envelope errado no e2e) e 2
      achados reais de SonarCloud no gate final (a11y + duplicação de código), todos corrigidos
      na raiz do problema, não contornados.

## Bloqueios / Riscos

Nenhum.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Nenhuma feature elegível neste harness até `bets-service epic-013` (saldo consolidado,
   `betType` enum, config de unidade) ou `stats-service epic-016`/`epic-018` (quebra diária,
   segmentos `byLeague`/`byTipster`) existirem — eles liberam `epic-015`/`epic-017`/`epic-019`/
   `epic-020`/`epic-021` deste harness (dashboard consolidado reespecificado, relatório do
   período, menu por cadastro, grade de drawdown mensal, tela "Visão geral").
3. Padrão estabelecido nesta sessão, reaproveitável: extrair lógica de gráfico/sinal de cor
   compartilhada (`core/chart-theme.ts#buildLineChartOption`, `shared/kpi-card.ts#kpiSign`) *antes*
   de duplicar entre 2 telas — o gate do SonarCloud (`new_duplicated_lines_density ≤ 3%`) vai
   pegar isso de qualquer forma, mais barato prevenir no plano do que corrigir depois do PR falhar.
