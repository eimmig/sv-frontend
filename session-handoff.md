# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-24

## Objetivo atual

`feat-044` fechada. Próximas, autorizadas pelo usuário em 2026-09-24 e nesta ordem: `feat-041`
(≤31 dias agrupa por dia, acima por mês), `feat-040`, `feat-038`.

## Concluído nesta sessão (2026-09-24)

- [x] **`feat-044` fechada** — splash de boot removida; montagem do logo virou o overlay de
      carregamento do app inteiro (`core/loading*`). Story SV-594, ver `progress.md`.

## Bloqueios / Riscos

- `NativeDateAdapter.parse()` (Angular Material) é `Date.parse()` puro — sempre M/D/Y para uma
  string com `/`, nunca respeitando `MAT_DATE_LOCALE`/`setLocale()`. Qualquer campo novo de
  **texto livre digitado** ligado a `matDatepicker` neste app deve usar `[appDateMask]`
  (`core/date-mask.directive.ts`) em vez de reinventar formatação. **Não se aplica** aos novos
  campos de mês/ano de `feat-039` (`monthly-drawdown-grid`) — são `readonly`, só clique no
  calendário, sem parsing de texto digitado envolvido.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Seguir a ordem `feat-041` -> `feat-040` -> `feat-038` (`feature_list.json`).
3. Se for mexer em `services/api-gateway`/serviços Java localmente (fora de Docker): `.env` não
   carrega sozinho em `mvn spring-boot:run` — precisa `SPRING_PROFILES_ACTIVE=dev` exportado, e o
   CORS default do gateway libera só `localhost:4200`, não a porta real do `ng serve` (`4300`)
   — ambos já documentados em `docs/observabilidade-e-configuracao.md`, ler antes de tentar.
