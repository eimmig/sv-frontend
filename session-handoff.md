# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-17

## Objetivo atual

`feat-001` a `feat-035` `done` — backlog deste app esgotado, nenhuma feature `not-started` no
momento.

## Concluído nesta sessão (2026-09-17)

- [x] `feat-034` fechada — 4 achados ad-hoc de UX pós-deploy (campos grudados, rótulo cortado,
      logo colapsado, máscara de data). Achado crítico: `NativeDateAdapter.parse()` é
      `Date.parse()` puro, sempre M/D/Y, independente do locale ativo — só revelado por um teste
      e2e real. Ver `progress.md` para o detalhe completo.

## Bloqueios / Riscos

Nenhum.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Nenhuma feature `not-started` neste harness — verificar `../../feature_list.json` (raiz) por
   epic novo, ou aguardar pedido do usuário.
3. `NativeDateAdapter.parse()` (Angular Material) é `Date.parse()` puro — sempre M/D/Y para uma
   string com `/`, nunca respeitando `MAT_DATE_LOCALE`/`setLocale()`. Qualquer campo novo de
   texto livre ligado a `matDatepicker` neste app deve usar `[appDateMask]`
   (`core/date-mask.directive.ts`, já cobre os 4 usos existentes) em vez de reinventar
   formatação — e nunca ordenar dígitos pelo locale ativo. Ver `docs/CONVENTIONS.md`.
