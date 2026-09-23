# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-22

## Objetivo atual

`feat-001` a `feat-037` e `feat-039` `done`. `feat-038`/`040`/`041` seguem `not-started` (backlog
ad-hoc, sem epic próprio) — não implementadas nesta sessão, ver `feature_list.json`. `feat-039`
(drawdown mensal + filtro de mês) fechada nesta sessão, ver `progress.md` para o detalhe completo.

## Concluído nesta sessão (2026-09-22)

- [x] `e2e/search-statistics.spec.ts` corrigido (quebrado desde `feat-036`) + `TypeError`
      silencioso em 3 outros specs de shell (`side-nav`/`change-password`/`telegram-link`) — ver
      `progress.md`.
- [x] `feat-039` fechada — drawdown mensal parava de "saturar" (2 causas reais: padding de dias
      futuros no mês corrente + smoothing/grid grosseiro do chart-theme) e filtro de mês trocado
      pra `MatDatepicker` mês/ano. Ver `progress.md` para o desenho completo, incluindo a
      validação contra a stack real (tenant `demo-b583c3`).

## Bloqueios / Riscos

- `NativeDateAdapter.parse()` (Angular Material) é `Date.parse()` puro — sempre M/D/Y para uma
  string com `/`, nunca respeitando `MAT_DATE_LOCALE`/`setLocale()`. Qualquer campo novo de
  **texto livre digitado** ligado a `matDatepicker` neste app deve usar `[appDateMask]`
  (`core/date-mask.directive.ts`) em vez de reinventar formatação. **Não se aplica** aos novos
  campos de mês/ano de `feat-039` (`monthly-drawdown-grid`) — são `readonly`, só clique no
  calendário, sem parsing de texto digitado envolvido.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Nenhuma feature `not-started` elegível sem ressalva neste harness — `feat-038`/`040`/`041`
   existem no backlog mas nascem marcadas "não implementar agora" (notas de sessão anterior);
   confirmar com o usuário antes de assumir que a restrição caiu, mesmo padrão desta sessão com
   `feat-039`.
3. Se for mexer em `services/api-gateway`/serviços Java localmente (fora de Docker): `.env` não
   carrega sozinho em `mvn spring-boot:run` — precisa `SPRING_PROFILES_ACTIVE=dev` exportado, e o
   CORS default do gateway libera só `localhost:4200`, não a porta real do `ng serve` (`4300`)
   — ambos já documentados em `docs/observabilidade-e-configuracao.md`, ler antes de tentar.
