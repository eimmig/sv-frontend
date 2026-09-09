# CLAUDE.md — web

SPA Angular 22.x + TypeScript ES2025: autenticação, casas de apostas, registro de apostas,
histórico e dashboards. Parte do harness multinível do monorepo — leia `../../CLAUDE.md`
(raiz) para invariantes cross-service antes deste arquivo, e `../../docs/services/web.md` para
o desenho completo (regras de Shneiderman, RF cobertos). Arquitetura de frontend, testes,
formato de erro consumido, **tema/paleta de cores/componentes visuais** e **i18n** são
normativos e já decididos em `../../docs/CONVENTIONS.md`, `../../docs/TESTING.md`,
`../../docs/API-CONTRACTS.md` e `../../docs/DESIGN-SYSTEM.md` — leia todos antes de `feat-001`.

## Fluxo de início de sessão (Startup Workflow)

1. Confirme o diretório de trabalho (`pwd`) — deve ser `apps/web`.
2. Leia `../../CLAUDE.md` e `../../docs/services/web.md`.
3. Rode `./init.sh` para verificar build/testes deste app.
4. Leia `feature_list.json` (deste app) para a próxima feature granular.
5. Leia `progress.md` (deste app).

## Regras específicas deste app

- **Uma feature por vez (One feature at a time)**: escolha exatamente uma feature `not-started`
  de `feature_list.json` cujas dependências já estejam `done`.
- **Escopo restrito (stay in scope)**: não edite código de serviços backend a partir desta pasta.
- O formulário de registro manual de apostas (RF04) segue as **oito regras de ouro de
  Shneiderman** — ver `../../docs/services/web.md` para a lista completa; não simplifique o
  formulário a ponto de violá-las (ex.: sem feedback de sucesso/erro, sem confirmação antes de
  ações destrutivas).
- Filtros de dashboard (RN08) disparam nova consulta a `GET /api/v1/statistics` a cada mudança —
  não implemente como filtro client-side sobre um dataset já carregado. Query params sempre em
  inglês (`sport`, `league`, `market`, `from`, `to` — ver `../../docs/API-CONTRACTS.md`), mesmo
  os rótulos de UI sendo localizados.
- Consome `auth-service`, `bets-service` e `stats-service` via API Gateway (HTTP/REST) — não
  acesse bancos de dados diretamente do frontend.
- **Sem tela de autocadastro** (decisão de 2026-08-02, ver `../../docs/DECISIONS-LOG.md`): login
  tem 3 campos (slug do tenant, e-mail, senha) — não 2. Não existe "criar conta" pública. Criação
  de tenant é fora do escopo deste app — operador chama a API direto (`X-Admin-Api-Key`), sem UI
  aqui (decisão de 2026-08-02, item 11). Em vez disso, uma tela de **gestão de usuários do
  tenant** (visível **só** para `role = admin` — `role = member` não vê essa tela de forma
  alguma, nem somente leitura) lista e cria usuários (`role = member`) dentro do próprio tenant —
  ver `../../docs/services/web.md` seção "Modelo de tenant (UI)" antes de implementar `feat-002`.
- Responsividade (RNF01) é requisito, não melhoria futura: componentes novos devem funcionar em
  mobile desde o commit que os introduz.
- **Componentes standalone + Signals** (não NgRx, não `NgModule`) para estado — decisão já
  tomada em `../../docs/CONVENTIONS.md`, não reabrir. Reactive Forms no formulário de apostas.
- **Marca StakeVault, tema claro/escuro com toggle, paleta de cores e componentes visuais** já
  decididos em `../../docs/DESIGN-SYSTEM.md` — não inventar cores/estilos/nome por conta própria
  em nenhuma feature. Assets do logo em `../../docs/design-references/`
  (`logo-mark-{dark,light,solid}.svg`, `logo-bars-only.svg`). Tema Angular Material (M3) gerado a
  partir de `--color-action-neutral` (azul) como `primary`, não do verde — ver próximo bullet.
- **Verde é só marca/ganho, nunca CTA genérica** (ver `../../docs/DESIGN-SYSTEM.md` seção "Regra
  semântica de cor"): `--color-brand` (verde) é exclusivo de logo, nav ativa, e valores
  positivos/lucro. Botões de ação neutra (salvar, filtrar, confirmar) usam
  `--color-action-neutral` (azul) por padrão — um botão verde genérico é bug de UX neste app, não
  estilo.
- **Layout em painéis** (`app-panel-layout`/`app-panel`, ver `../../docs/DESIGN-SYSTEM.md` seção
  "Layout em painéis"): toda tela é composta de painéis independentes lado a lado, cada um com
  rolagem própria — não construa uma tela como página única de rolagem contínua nem coloque o
  formulário de aposta em página cheia/modal fora desse padrão.
- Trate erros de API no formato RFC 7807 retornado pelos serviços Java (ver
  `../../docs/API-CONTRACTS.md`) — não assuma um formato de erro diferente por serviço. Envie
  `Accept-Language` conforme o idioma ativo no app (ver bullet de i18n abaixo) para que
  `title`/`detail` já venham no idioma certo.
- **i18n**: `@jsverse/transloco`, três locales sempre em sincronia — `pt-BR`, `en-US`, `es`,
  arquivos em `src/assets/i18n/{pt-BR,en-US,es}.json` (ver `../../docs/CONVENTIONS.md` seção
  "Internacionalização (i18n)") — decisão do usuário, não é opcional nem um dos três
  "principal". Nenhum componente tem string de UI hardcoded; toda label nova em qualquer
  feature precisa das três traduções antes de a feature ser `done` — validado automaticamente
  pela pipeline de CI (bullet abaixo).
- **Gráficos (RF10/RF11 UI)**: `ngx-echarts` (Apache ECharts) — decisão de 2026-08-02, ver
  `../../docs/DESIGN-SYSTEM.md` item 6 do inventário. Não introduzir outra biblioteca de
  gráficos (Chart.js, D3 direto, etc.) em nenhuma feature.
- **Config de ambiente**: `src/environments/environment.ts`/`environment.development.ts` (build-time,
  `fileReplacements` do Angular CLI) com a URL base do `api-gateway` — decisão de 2026-08-02, ver
  `../../docs/OBSERVABILITY-AND-CONFIG.md` seção "Configuração de apps/web". Não buscar config
  em runtime (`config.json`) nem hardcodar a URL fora desses arquivos.
- **QA visual e prototipagem — Impeccable, taste-skill e huashu-design, prioritárias** (instalar
  em `feat-001`, junto com Angular/Playwright): `npx impeccable install`,
  `npx skills add https://github.com/leonxlnx/taste-skill`,
  `npx skills add https://github.com/alchaincyf/huashu-design`. Conjunto padrão para qualquer
  tarefa de frontend, não opcional — toda UI nova passa por auditoria antes de `done` (ver item
  na Definição de Pronto abaixo). Uso restrito a auditoria/polish de componentes já
  implementados (`/impeccable audit`/`polish` etc., taste-skill) e prototipagem descartável
  pré-implementação (huashu-design) — nenhuma das três decide aparência por conta própria:
  `../../docs/DESIGN-SYSTEM.md` continua a única fonte de verdade de design deste app.
  **`apps/web/DESIGN.md` é pré-escrito a partir de `DESIGN-SYSTEM.md`** (formato oficial
  [DESIGN.md](https://github.com/google-labs-code/design.md), primeira tarefa de `feat-001`
  depois do `npx impeccable install`) — isso é o que impede `/impeccable document`/`new-work` de
  gerar um `DESIGN.md` divergente: com o arquivo já existindo, o próprio Impeccable pergunta
  antes de tocar nele (`refresh`/`overwrite`/`merge`), nunca sobrescreve em silêncio. `init` **é**
  seguro de rodar — só grava `PRODUCT.md` (contexto de produto), não escreve `DESIGN.md`. Ver
  `../../docs/DESIGN-SYSTEM.md` seção "QA visual" para o racional completo e o mapeamento de
  seções. Diferente do Playwright (bullet de testes acima) — aquele é E2E funcional, isto é QA
  visual/prototipagem.
- **CI/CD (`feat-007`)**: pipeline em `.github/workflows/ci.yml`, **dentro deste repositório**
  (este app é seu próprio repositório Git, não um monorepo — ver `../../docs/DECISIONS-LOG.md`
  "Topologia") — changelog, i18n, build, testes, SonarCloud. Scripts de validação em
  `.github/scripts/` (duplicados aqui, não compartilhados com os outros serviços). Ver
  `../../docs/CI-CD.md`. Toda feature adiciona uma entrada em `CHANGELOG.md` deste app
  (verificado automaticamente pelo CI quando este repositório existir no GitHub).
- **Skills de agente prioritárias**: `Plan Reviewer` antes de codificar, `Acceptance Test
  Builder` para os fluxos Playwright, `Delivery Reviewer` + `Test Suite Auditor` antes de marcar
  `done` (claude-code-skills) — mapeamento completo em `../../docs/AGENT-SKILLS.md`. Instaladas
  em 2026-08-02 (escopo `user`), ver `../../docs/DECISIONS-LOG.md`. Diferente de
  Impeccable/taste-skill/huashu-design (QA visual, bullet acima) — isto é revisão de plano/código/teste, não
  design; essas duas continuam de instalação pendente (dependem de `feat-001` existir primeiro).

## Definição de pronto (Definition of Done)

Uma feature deste app só está `done` quando (done only when):

> **Antes de começar** (não é item de `done`, é pré-requisito de `in-progress`): o campo
> `plan_review` daquela feature em `feature_list.json` precisa estar preenchido com o
> resultado do `Plan Reviewer` — ver `CLAUDE.md` da raiz, seção "Regras de trabalho".


- [ ] Implementada e rodando via `./init.sh` sem erro.
- [ ] Testada em pelo menos uma resolução mobile e uma desktop (RNF01).
- [ ] Testada nos dois temas (claro e escuro) — ver `../../docs/DESIGN-SYSTEM.md`.
- [ ] Toda string de UI nova traduzida nos três locales (`pt-BR`/`en-US`/`es`) — nenhum texto
      hardcoded, nenhum idioma deixado "para depois".
- [ ] Testes seguindo `../../docs/TESTING.md` (unitários de componente; Playwright para os
      fluxos críticos: cadastro de aposta, atualização de status, filtro de dashboard; pelo
      menos um fluxo rodado com idioma trocado para confirmar que a troca funciona).
- [ ] Se a feature introduziu UI nova: rodada auditoria de QA visual (Impeccable/taste-skill/huashu-design,
      ver bullet acima) contra `../../docs/DESIGN-SYSTEM.md`.
- [ ] `Delivery Reviewer` e `Test Suite Auditor` rodados contra a feature (ver
      `../../docs/AGENT-SKILLS.md`).
- [ ] `CHANGELOG.md` deste app tem uma entrada em `[Unreleased]` descrevendo a mudança.
- [ ] `feature_list.json` atualizado com status e evidência.
- [ ] `../../feature_list.json` (raiz) atualizado se este foi o marco que fecha `epic-006`.

## Fim de sessão (End of Session)

Antes de encerrar (before ending a session): atualize `progress.md` deste app, atualize
`feature_list.json`, e deixe `./init.sh` passando (clean, restartable state) — stay in scope:
não edite código de serviços backend aqui; se um endpoint necessário não existir ainda, registre
o bloqueio em `progress.md` em vez de implementá-lo por conta própria neste diretório.

## Verificação

```bash
./init.sh
```
