---
name: StakeVault
description: Plataforma de gestão de bankroll e análise estatística de apostas esportivas.
tokens:
  color:
    dark:
      background: "#0B1622"
      surface: "#16232F"
      surfaceElevated: "#1D2A36"
      border: "#24323F"
      textPrimary: "#F2F7F5"
      textSecondary: "#7A8A93"
      brand: "#3EC46D"
      brandStrong: "#26A65B"
      positive: "#3EC46D"
      negative: "#E24B4A"
      actionNeutral: "#3E8CC4"
      actionNeutralStrong: "#2E6FA0"
      disabledBg: "#1D2A36"
      disabledText: "#4C5A64"
    light:
      background: "#F2F5F4"
      surface: "#FFFFFF"
      surfaceElevated: "#E7EEEB"
      border: "#DCE3E0"
      textPrimary: "#0B1622"
      textSecondary: "#5C6B72"
      brand: "#2FA85C"
      brandStrong: "#22803F"
      positive: "#2FA85C"
      negative: "#C73E3D"
      actionNeutral: "#2E70A0"
      actionNeutralStrong: "#215680"
      disabledBg: "#E7EEEB"
      disabledText: "#9AA6A2"
  typography:
    family: Inter
    display: "40-48px / 700"
    kpi: "20-24px / 500"
    cardTitle: "16-18px / 600"
    body: "14-15px / 500-600"
    caption: "12-13px / 400-500"
  spacing:
    panelGap: 24px
    panelPadding: 24px
    listRhythm: 16-20px
  radius:
    panel: 16-20px
    inputCard: 12-14px
    pill: 999px
  elevation:
    light: "0 4px 24px rgba(20, 20, 30, 0.06)"
    dark: none
---

# StakeVault — DESIGN.md

Fonte da verdade normativa: `docs/DESIGN-SYSTEM.md` (raiz do harness multinível). Este arquivo é
um resumo estruturado pra ferramentas de QA visual (Impeccable, taste-skill, huashu-design) — em
caso de divergência, `docs/DESIGN-SYSTEM.md` vence, não este arquivo. Pré-escrito na `feat-001.8`
antes de qualquer comando `impeccable document`/`new-work`, pra esses comandos perguntarem antes
de sobrescrever em vez de gerar uma versão divergente.

## Overview

StakeVault é uma plataforma de gestão de bankroll (banca) para apostadores esportivos —
cadastro de casas de apostas, registro manual de apostas, histórico de operações e dashboards
com métricas (ROI, taxa de acerto, evolução da banca). Identidade visual derivada do produto
Uphold (layout em painéis, KPIs, gráfico de linha) com paleta e marca próprias.

Logo: anel (o "cofre") com quatro raios diagonais nos cantos e três barras verticais ascendentes
dentro (elemento de crescimento/gráfico). Wordmark "Stake" (peso 400) + "Vault" (peso 500, cor de
marca) na mesma família tipográfica — nunca traduzido, nome de marca. Tagline "GESTÃO DE BANCA" é
string de UI comum (localizada: `en-US` "BANKROLL MANAGEMENT", `es` "GESTIÓN DE BANCA").

Suporta claro **e** escuro com toggle (não é dark-mode-only) — default segue
`prefers-color-scheme`, escolha explícita persiste em `localStorage` e sobrepõe o SO.

## Colors

Três papéis semânticos **estritamente segregados** (regra normativa, não decoração):

- **Verde (`brand`/`positive`)** — exclusivamente marca (logo, ícone ativo da nav, link ativo) e
  **ganho** (lucro, aposta `won`, variação percentual positiva). Nunca usar em botão de ação
  neutra — bug de UX, não estilo.
- **Azul (`actionNeutral`)** — cor padrão de toda CTA/ação que não é inerentemente um resultado
  financeiro (salvar, filtrar, confirmar, navegar, editar). Botão primário por padrão.
- **Vermelho (`negative`)** — exclusivamente prejuízo (perda, aposta `lost`, variação negativa),
  erro de validação e ação destrutiva.

Modo escuro é citação direta dos mockups StakeVault (alta confiança); modo claro é derivado pela
mesma regra de construção (fundo↔texto invertidos, mesmo verde) — sem mockup claro real do
produto ainda, revisitar se um aparecer.

## Typography

Família **Inter** (`@fontsource/inter`, pesos 400/500/600/700) — alternativas documentadas
(Satoshi, General Sans) só se um visual mais próximo do lockup for desejado depois, não decisão
de arquitetura. Números monetários/percentuais sempre com `font-variant-numeric: tabular-nums`
(não "dançam" horizontalmente ao atualizar). Formatação de número/data/moeda segue o locale ativo
(`pt-BR`/`en-US`/`es`), nunca fixa em `R$`.

Wordmark é a única exceção à escala: "Stake" peso 400, "Vault" peso 500, mesma família — não
recriar com duas fontes diferentes.

## Layout

Traço estrutural mais importante do produto: páginas são compostas por **painéis independentes
lado a lado** (`app-panel-layout`/`app-panel`), nunca uma página de rolagem única. Cada painel
rola dentro de si mesmo (`overflow-y: auto`), a página como um todo não rola — nenhum painel
dita a altura de um painel adjacente.

Responsivo (RNF01) por colapso de colunas, não encolhimento: desktop (`≥1024px`) grid
multi-coluna completo definido por página; tablet (`~600-1024px`) 2 colunas; mobile (`<600px`)
coluna única.

## Elevation & Depth

Modo escuro **não usa sombra** — profundidade vem só do contraste entre `background` e
`surface`. Modo claro usa sombra difusa e sutil (`elevation.light` acima), nunca bordas duras.

## Shapes

Cards/painéis grandes: raio 16-20px. Campos de input tipo card: raio 12-14px. Botões e
seletores de segmento: totalmente arredondados (pill, 999px). Badges/avatares de ícone:
circulares.

## Components

Inventário completo (17 itens mapeados) em `docs/DESIGN-SYSTEM.md` seção "Inventário de
componentes" — destaques:

- **`app-panel`**: container `surface`, raio grande, cabeçalho opcional (título + ações),
  rolagem interna própria.
- **Gráfico de linha** (`ngx-echarts`): traço `brand`, gradiente suave até transparente
  (opacidade ~0.12), ponto de destaque no último valor, 3 linhas de grade sutis (`border`).
- **Botão CTA primário**: pill full-width, `actionNeutral` por padrão (não `brand`/verde) —
  exceção consciente só quando a ação em si é inerentemente positiva.
- **Badge de resultado de aposta**: fundo tonal + texto na mesma cor (não fundo sólido + texto
  branco); `won` → `positive`, `lost` → `negative`, `pending`/`void` → `textSecondary` sobre
  `surfaceElevated`.
- **Splash animado**: anel de guia + cometa + raios + barras + pop/pulso + wordmark por
  varredura (`<mask>`), toca uma vez e trava no logo formado (não loop infinito), guia continua
  girando como loop discreto se o carregamento passar de ~3s, respeita
  `prefers-reduced-motion`.

## Do's and Don'ts

- **Do** usar azul (`actionNeutral`) como cor padrão de botão/ação neutra.
- **Don't** usar verde (`brand`) como cor de CTA genérica — verde é só marca/ganho.
- **Do** compor toda tela como um ou mais `app-panel` lado a lado.
- **Don't** colocar formulário (ex.: registro de aposta) em página cheia ou modal solto fora do
  padrão de painéis.
- **Do** manter estado desabilitado de botão visível (contraste reduzido), nunca escondido.
- **Don't** hardcodar string de UI — toda label passa por `transloco`, três locales sempre em
  sincronia (`pt-BR`/`en-US`/`es`).
- **Do** manter números tabulares em valores monetários/percentuais.
- **Don't** introduzir Lottie ou outra biblioteca de animação para o splash — CSS/SVG puro é
  suficiente.
