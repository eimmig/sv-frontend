# Session Handoff — web

> Estado atual, não histórico. O diário cronológico é o `progress.md` — este arquivo é reescrito
> a cada sessão para responder "o que a próxima sessão precisa saber agora".

**Última atualização:** 2026-09-17

## Objetivo atual

`feat-001`..`feat-033` e `feat-035` `done`. **`feat-034` é a única feature `not-started` deste
harness** (4 achados ad-hoc de UX em produção, sem `epic` próprio na raiz — mesmo precedente de
`feat-032`/`033`): campos `shared/searchable-select` grudados sem espaçamento vertical em
`register-bet` (suspeita não confirmada por reprodução local ainda), rótulo cortado nos campos
"Mês inicial"/"Mês final" da grade de drawdown mensal, logo quebrando em 2 linhas na sidebar
colapsada, e ausência de máscara de digitação (`__/__/____`) nos campos de data `De`/`Até`. Sem
`plan_review` ainda — próximo passo é rodar o `Plan Reviewer` contra essa feature antes de
codificar (4 sub-problemas distintos, escopo de investigação real antes de qualquer fix).

Todos os 30 epics do `feature_list.json` da raiz estão `done` — não há mais epic aberto lá.
`feat-034` é backlog residual deste app específico, não amarrado a nenhum epic.

## Concluído nesta sessão (2026-09-17)

- [x] `feat-035` fechada — tela `/change-password`, fecha `epic-030` da raiz. Story SV-514, PRs
      #149-151, CI+SonarCloud verdes. Bug real de produção corrigido (`FormGroup.reset()` não
      limpa a flag `submitted` da `FormGroupDirective`, corrigido com `resetForm()`). Ver
      `progress.md` para o detalhe completo.

## Bloqueios / Riscos

Nenhum.

## Próxima sessão — por onde começar

1. Rodar `./init.sh` (deve sair `0`).
2. Única feature elegível: `feat-034`. Rodar `Plan Reviewer` primeiro — o item (1) (campos
   grudados do `searchable-select`) explicitamente NÃO foi confirmado por reprodução local nesta
   sessão (testado em 500/700/1280px sem reproduzir); investigar contra o ambiente real do
   usuário (viewport/zoom/tema) antes de aplicar o fix sugerido no `feature_list.json`.
3. `FormGroup.reset()` não limpa a flag `submitted` da `FormGroupDirective` — qualquer formulário
   que se limpe na mesma tela após um submit bem-sucedido precisa de
   `@ViewChild(FormGroupDirective) + .resetForm()`, não `form.reset()` puro. Achado real de
   `feat-035`, ver `docs/CONVENTIONS.md`.
4. `--color-positive` é literalmente o mesmo valor de `--color-brand` (verde) — reservado a ganho
   financeiro (lucro, aposta `won`, variação positiva). Não reusar pra confirmação de sucesso
   genérica (troca de senha, salvar configuração, etc.) — usar estilo neutro (caixa com borda,
   mesmo padrão de `.telegram-link__result`). Achado do `Plan Reviewer` de `feat-035`.
5. `git add -A` varre `.claude/worktrees/` se algum worktree de agente ficar para trás sem
   `.gitignore` cobrindo o caminho — commitar um como gitlink de submódulo órfão quebra clones.
   Já corrigido (`.gitignore` cobre `.claude/worktrees/` agora), mas conferir `git status` antes
   de qualquer `add -A` amplo continua sendo o hábito certo.
