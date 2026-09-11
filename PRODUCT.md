# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Apostador esportivo que opera em múltiplas casas de apostas e quer controlar a própria banca
(bankroll) de forma centralizada. Como o usuário faz esse controle hoje (planilha, nenhum
controle, outra ferramenta) **não está confirmado em nenhum documento do projeto** — registrado
aqui como lacuna em aberto, não inferido. Um `admin` cria e gerencia os demais usuários
(`member`) dentro de uma mesma organização (tenant); não há autocadastro público.

## Product Purpose

StakeVault é uma plataforma de gestão de bankroll e análise estatística de apostas esportivas.
Centraliza casas de apostas, registro de apostas (manual ou automático via bot Telegram),
movimentações financeiras (depósito/retirada) e métricas de desempenho (ROI, taxa de acerto,
lucro acumulado, evolução da banca) — um sistema único com histórico auditável e dashboards.

## Positioning

Captura de aposta em duas frentes combinadas no mesmo histórico: registro manual pela UI **e**
captura automática via bot Telegram (foto do bilhete com OCR ou texto livre), com resolução de
catálogo (casa/esporte/liga/mercado) contra o mesmo backend — o dado entra por qualquer um dos
dois canais e vira o mesmo histórico auditável, sem retrabalho de digitar duas vezes. Nenhuma
pesquisa de concorrentes existe neste projeto (TCC acadêmico) — não comparar contra
planilhas/apps concorrentes sem evidência real.

## Operating Context

Uso recorrente após cada aposta feita numa casa externa (o produto não processa apostas, só
registra e analisa) — o fluxo típico é apostar na casa, depois registrar/confirmar no
StakeVault (manualmente ou o bot já capturou). Consultas de histórico/dashboard acontecem em
sessões separadas, tipicamente pra revisar desempenho por período/esporte/mercado/casa/tipster.

## Capabilities and Constraints

- Cadastro/gerenciamento de casas de apostas, com saldo e acompanhamento da banca (RF03).
- Registro manual de apostas seguindo as oito regras de ouro de Shneiderman (ver
  `docs/services/web.md`).
- Captura automática via bot Telegram — foto do bilhete (OCR) ou texto livre, com fallback
  conversacional (RF05).
- Atualização de status da aposta: ganha, perdida, devolvida ou pendente (RF12).
- Movimentações financeiras: depósitos e retiradas vinculados a casas de apostas (RF13).
- Histórico completo de apostas e movimentações, auditável (RF08).
- Dashboards com ROI, taxa de acerto, lucro acumulado, evolução da banca (RF09/RF10).
- Filtros dinâmicos por período, casa, esporte, mercado, liga, tipster — recalculam as métricas
  em tempo real, não é filtro client-side sobre dataset já carregado (RF11, RN08).
- **Sem autocadastro público** — modelo de tenant multiusuário, `admin` cria `member`s dentro da
  própria organização; criação de tenant é operação administrativa fora deste app.
- **100% internacionalizável** — `pt-BR`/`en-US`/`es` sempre em sincronia, sem idioma "principal".
- Arquitetura de microsserviços (Java/Spring Boot + Python/Telegram + Angular) — este app
  consome tudo via API Gateway HTTP/REST, nunca acessa banco diretamente.

## Brand Commitments

Nome **StakeVault**, definido (não é mais placeholder). Logo: anel (o "cofre") com quatro raios
diagonais nos cantos e três barras verticais ascendentes dentro (elemento de crescimento).
Wordmark "Stake" (peso 400) + "Vault" (peso 500, cor de marca) — nome de marca, nunca traduzido.
Paleta de cores e regra semântica de cor (verde = só marca/ganho, azul = ação neutra, vermelho =
só prejuízo) são compromissos de marca explícitos do usuário — ver `docs/DESIGN-SYSTEM.md` seção
"Regra semântica de cor" antes de propor qualquer alternativa.

## Evidence on Hand

Sem clientes/usuários reais ainda (produto em desenvolvimento, TCC 2 da UTFPR) — sem
depoimentos, casos de uso reais ou dados de produção pra citar. Mockups de referência (Uphold
como inspiração de layout, mockups StakeVault próprios) em `docs/design-references/`. Requisitos
completos (RF01-RF13, RNF01-RNF06, RN01-RN09) em `docs/REQUIREMENTS.md`, extraídos do TCC 1.

## Product Principles

1. **Painel é a unidade de composição, não decoração** — toda tela é um ou mais `app-panel`
   lado a lado, cada um rolando de forma independente; nunca uma página de rolagem única.
2. **Cor carrega significado financeiro, não decoração** — verde/azul/vermelho são reservados
   estritamente pra marca-ganho/ação-neutra/prejuízo; reaproveitar uma cor pra outro papel é bug
   de UX, não escolha de estilo.
3. **Nenhum dado se perde por causa de um canal** — o mesmo histórico auditável nasce tanto do
   registro manual quanto da captura automática via Telegram; consistência eventual entre
   registro (síncrono) e processamento estatístico (assíncrono) é intencional, não simplificar
   pra síncrono.
4. **Localização não é feature, é requisito de base** — toda string de UI nova passa por
   `transloco`, três locales sempre em sincronia antes de qualquer feature ser considerada
   pronta.
5. **Formulários seguem as oito regras de ouro de Shneiderman** — especialmente o de registro de
   aposta (RF04): feedback de sucesso/erro sempre visível, confirmação antes de ação destrutiva,
   nunca simplificado a ponto de violar isso.

## Accessibility & Inclusion

`prefers-reduced-motion` respeitado em toda animação (splash, microinterações) — estado final
mostrado direto, sem tentar pausar uma animação em andamento. Nenhum requisito de acessibilidade
adicional confirmado além disso ainda (não é o foco declarado do TCC, mas a base de
`prefers-reduced-motion` já está implementada desde `feat-001.5`).
