# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-09

## Objetivo atual

- `feat-001`/`feat-002`/`feat-003`/`feat-004`/`feat-005`/`feat-007`/`feat-008` — todos `done`.
- `feat-006` (RF10/RF11 UI - dashboards) fechando nesta sessão - última feature de `epic-006`
  (raiz). Com ela `done`, `epic-006` também fecha.
- `feat-009` (RF12, status da aposta) e `feat-010` (RF13, movimentações financeiras) continuam no
  backlog, `not-started` - elegíveis depois de `feat-006` (dependência já registrada), decisão do
  usuário de deixar para depois.

## Concluído nesta sessão (2026-09-09)

- [x] `feat-006` implementada ponta a ponta: `core/statistics-api.ts` + `core/percent.ts` (novos),
      `shared/monthly-profit-chart` (substitui `shared/line-chart-sample`, removido), `Dashboard`
      real (filtros + cards + gráfico + breakdown por aba). Ver `progress.md` para o detalhe
      completo, inclusive os 2 achados reais (stub de canvas 2D para teste unitário com
      `ngx-echarts`, e o bug pré-existente de `calc(100vh - 64px)` corrigido na casca
      compartilhada `app.html`/`app.scss`).

## Bloqueios / Riscos

| Item | Estado |
|---|---|
| Bundle inicial acima do budget (~601KB vs 500KB, warning não-bloqueante) | Pré-existente desde `feat-001`, não é regressão desta sessão. `shared/line-chart-sample` removido nesta feature ajuda ligeiramente; revisitar lazy-loading do Angular Material se crescer mais. |
| `calc(100vh - 64px)` fixo por página | **Resolvido nesta sessão** (era o risco sinalizado desde `feat-002.2`) - substituído por layout flex real na casca (`app.html`/`app.scss`). Ver `docs/DESIGN-SYSTEM.md` "Layout em painéis". |
| `apps/web/progress.md` não tem entradas de fechamento de `feat-002`..`feat-005`/`feat-008` | Achado ao editar este arquivo nesta sessão - aquelas features foram fechadas com evidência completa no `feature_list.json` deste app e no `progress.md`/`session-handoff.md` da **raiz**, mas não neste arquivo específico (gap de uma sessão anterior, fora do escopo de `feat-006` corrigir retroativamente). Se uma sessão futura precisar do histórico detalhado por feature deste app, consultar `progress.md`/`session-handoff.md` da raiz primeiro. |

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. `epic-006` (raiz) fecha com esta sessão - não resta mais nenhuma feature elegível deste app até
   `feat-009`/`feat-010` serem planejadas.
3. `feat-009` (RF12) / `feat-010` (RF13) - ainda sem `plan_review`, decisão do usuário de fazer
   depois de `feat-006`. Próxima sessão pode escolher uma das duas (WIP máximo 1 por lane).
