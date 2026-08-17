# Log de Progresso — web

## Estado Atual (Current State)

**Última atualização:** 2026-07-30 00:00
**Feature ativa:** nenhuma

## Status

### O que está pronto

- [x] Harness deste app criado.

### Em andamento

- Nenhuma feature iniciada.

### Próximos passos (Next Steps)

1. `feat-001` — inicializar o projeto Angular 21.x.

## Bloqueios / Riscos

- Depende de `auth-service` (epic-002) e `bets-service` (epic-003) existirem para integração
  real — `feat-001` (setup) pode ser feito de forma independente.

## Decisões tomadas

- Gerenciamento de estado: **Signals nativos** (não NgRx). Componentes **standalone**. Decididas
  em `../../docs/CONVENTIONS.md`, não específicas desta sessão.

## Arquivos modificados nesta sessão

- `CLAUDE.md`, `feature_list.json`, `init.sh`, `progress.md`, `session-handoff.md` — criados.

## Evidência de conclusão

- Não aplicável ainda.

## Notas para a próxima sessão

Ver `../../docs/services/web.md` para as oito regras de ouro de Shneiderman antes de começar
`feat-004`.

## Atualização — identidade visual StakeVault definida (2026-08-01, mesmo dia, mais tarde)

Usuário forneceu identidade visual final e completa: nome **StakeVault**, logo (anel do cofre +
raios + três barras ascendentes), paleta de cores exata (navy `#0B1622`, verde `#3EC46D`, etc.),
mockup HTML de dashboard e mockup HTML de splash animado — desta vez como código-fonte exato,
não capturas de tela, então pude salvar tudo verbatim em `../../docs/design-references/`
(2 HTMLs + 4 SVGs do logo extraídos/reconstruídos a partir do código fornecido).

Correção de UX importante trazida pelo próprio usuário: verde não pode ser a cor de CTA genérica
num app de bankroll (o usuário lê "botão verde = lucro" por engano) — reservado exclusivamente
para marca/ganho. Nova cor `--color-action-neutral` (azul, derivado por mim por rotação de matiz
do verde — não veio do usuário, flagged no documento) virou a cor padrão de botão/CTA. Isso
reverteu uma decisão da versão anterior do design system (que usava o verde como accent/CTA
genérica, copiando o padrão do Uphold sem considerar a semântica de um app financeiro).

`docs/DESIGN-SYSTEM.md` reescrito nas seções de paleta, tipografia, inventário (3 componentes
novos: grade de KPIs, badge de resultado won/lost/pending, splash animado com as 3 regras de
produção do usuário: não fazer loop infinito, respeitar prefers-reduced-motion, CSS puro sem
Lottie), integração Angular Material (verde vira secondary/tertiary do tema, não mais primary),
e identidade visual (StakeVault substitui o placeholder "Bankroll"). `feat-001` e `CLAUDE.md`
deste app atualizados para refletir os novos assets e a regra semântica de cor.

## Atualização — design system definido (2026-08-01)

Usuário compartilhou capturas de tela do produto Uphold (dashboard autenticado, dark e light
mode) e pediu que todo o esquema de temas/componentes de `apps/web` fosse baseado nelas. Criada
`../../docs/DESIGN-SYSTEM.md` (normativa, mesmo padrão de `../../docs/CONVENTIONS.md`): paleta de
cores claro/escuro com toggle, tipografia (Inter como substituta da fonte do Uphold, não
identificada com certeza), espaçamento/raio/elevação, inventário de 14 componentes mapeados das
capturas, e a abordagem de integração com o tema M3 do Angular Material (gerar a partir da cor
de destaque do Uphold, não da paleta neutra padrão).

Decisões do usuário: (1) suportar claro **e** escuro com toggle, não só um; (2) reusar o mesmo
verde do Uphold como cor de destaque, não adaptar para uma cor própria; (3) usar um placeholder
simples ("Bankroll" + ícone genérico) no lugar do logo do Uphold, já que o produto ainda não tem
nome/marca definidos — documentado como substituível.

`feat-001` deste serviço foi atualizada para incluir a configuração do tema Angular Material M3
a partir desses tokens. `CLAUDE.md` deste serviço ganhou um bullet normativo + um item na
Definição de Pronto (testar nos dois temas). As capturas de tela em si não foram salvas como
arquivo no repositório — `docs/DESIGN-SYSTEM.md` é o registro durável do que foi observado
nelas; se precisão exata de cor importar, não há como revisitar as capturas originais nesta
sessão.

**Complemento (mesmo dia)**: usuário pediu explicitamente para também incorporar o padrão de
**layout em painéis** do Uphold (paineis independentes lado a lado, cada um com rolagem própria
— visível nas três capturas, não só a paleta de cores). Adicionada seção dedicada em
`docs/DESIGN-SYSTEM.md` ("Layout em painéis"): grid multi-coluna, rolagem interna por painel,
colapso responsivo desktop→tablet→mobile, e uma composição sugerida (não obrigatória) por página
(dashboard 2-3 painéis, histórico 1-2, casas de apostas 1, formulário de aposta 1). `feat-001`
ganhou o componente base `app-panel-layout`/`app-panel`; `CLAUDE.md` ganhou o bullet
correspondente.

## Duas lacunas de definição fechadas antes do início de `feat-001` (2026-08-02)

Usuário perguntou se havia algo de frontend ainda por definir. Revisão de `docs/DESIGN-SYSTEM.md`,
`docs/CONVENTIONS.md` e `docs/OBSERVABILITY-AND-CONFIG.md` encontrou duas lacunas reais (nenhuma
biblioteca de gráficos nomeada para o dashboard; nenhuma decisão de como a SPA resolve a URL do
`api-gateway` por ambiente — a seção de `.env` existente é escrita para os serviços Java, não se
aplica a um build estático). Perguntado ao usuário, decisões:

1. **Gráficos (RF10/RF11 UI)**: `ngx-echarts` (Apache ECharts) — sobre `ng2-charts`/Chart.js e
   `ngx-charts` (Swimlane), por dar controle fino suficiente para reproduzir o gradiente
   customizado e o grid sutil do mockup sem CSS/SVG manual.
2. **Config de ambiente**: `environment.ts`/`environment.prod.ts` (build-time, padrão do Angular
   CLI) em vez de config runtime (`config.json` buscado no boot) — simplicidade escolhida sobre
   "build once, deploy many"; trade-off registrado em `docs/OBSERVABILITY-AND-CONFIG.md` caso
   precise mudar depois.

Documentado em `docs/DESIGN-SYSTEM.md` (item 6 do inventário), `docs/OBSERVABILITY-AND-CONFIG.md`
(nova seção "Configuração de apps/web"), `apps/web/CLAUDE.md` e `feat-001` deste
`feature_list.json`. Nenhum código escrito ainda.
