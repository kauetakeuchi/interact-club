---
name: Interact Club
description: Site oficial de um Interact Club — vitrine institucional jovem com área de membros e painel administrativo
colors:
  azul-sede: "#17458F"
  azul-noite: "#0F346E"
  azul-ceu: "#2E63C4"
  azul-calmo: "#D9E6F8"
  ambar-mel: "#F59E0B"
  ambar-luz: "#FBBF24"
  ambar-brasa: "#D97706"
  papel: "#FFFFFF"
  nuvem: "#F9FAFB"
  tinta: "#1F2937"
  tinta-suave: "#6B7280"
  tinta-palida: "#9CA3AF"
  linha: "#E5E7EB"
typography:
  display:
    fontFamily: "Sora, sans-serif"
    fontSize: "3.5rem"
    fontWeight: 600
    lineHeight: 1.1
  headline:
    fontFamily: "Sora, sans-serif"
    fontSize: "2rem"
    fontWeight: 600
    lineHeight: 1.2
  title:
    fontFamily: "Sora, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.3
  body:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.65
  label:
    fontFamily: "Outfit, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    letterSpacing: "0.15em"
rounded:
  sm: "8px"
  md: "12px"
  pill: "100px"
spacing:
  sm: "0.5rem"
  md: "1.5rem"
  lg: "2.5rem"
  xl: "5rem"
components:
  botao-primario:
    backgroundColor: "{colors.azul-sede}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.5rem"
    typography: "{typography.label}"
  botao-primario-hover:
    backgroundColor: "{colors.azul-noite}"
  botao-secundario:
    backgroundColor: "{colors.ambar-luz}"
    textColor: "{colors.papel}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1.5rem"
  botao-secundario-hover:
    backgroundColor: "{colors.ambar-mel}"
  cartao:
    backgroundColor: "{colors.papel}"
    rounded: "{rounded.md}"
  campo:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "0.75rem 1rem"
  etiqueta-hero:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.ambar-mel}"
    rounded: "{rounded.pill}"
    padding: "0.25rem 0.75rem"
---

# Design System: Interact Club

## Overview

**Creative North Star: "A Sede do Clube"**

Este site é a sede física do clube traduzida para a tela: um lugar institucional que abre as portas sem cerimônia. A estrutura é confiante — hierarquia clara, tipografia firme, azul que comanda — mas o acabamento é acolhedor: cantos sempre arredondados, superfícies que se erguem suavemente quando alguém se aproxima, e o âmbar aparecendo como a luz quente de uma sala bem frequentada. Nada aqui é frio nem solene demais; nada é infantil demais.

A densidade é confortável, nunca apertada: seções respiram com 5rem de respiro vertical e os cartões pedem espaço ao redor. O movimento é curto e gentil (200–300ms): elementos respondem ao toque, não performam. O sistema inteiro se apoia em dois papéis cromáticos — azul como autoridade, âmbar como convite — sobre papel branco quase absoluto.

**Key Characteristics:**
- Azul institucional domina identidade; âmbar é convite raro, não decoração constante
- Cantos arredondados em três escalas fixas (8px, 12px, pílula 100px); nenhum corno vivo
- Elevação responsiva: plana em repouso, levanta com sombra ao hover
- Tipografia dupla: Sora comanda títulos, Outfit conversa no corpo
- Vidro fosco (backdrop-blur) apenas nos momentos flutuantes: navbar e modal

## Colors

Paleta de dois temperamentos: azuis confiáveis para estruturar, âmbar quente para convidar — sempre sobre papel branco e tons de nuvem.

### Primary
- **Azul Sede** (#17458F): a cor da casa. Botões primários, links ativos, foco de formulário, títulos de seção e a base do gradiente dos heróis. É o azul Rotary reinterpretado com mais energia.
- **Azul Noite** (#0F346E): profundidade da mesma voz. Hover do botão primário, início do gradiente de hero, cor padrão de títulos (`section-title`). Nunca usado junto ao Azul Sede em áreas iguais — ele está sempre acima ou abaixo.
- **Azul Céu** (#2E63C4): terceiro degrau exclusivo do gradiente de hero (160°, Noite → Sede → Céu). Não existe fora dele.
- **Azul Calmo** (#D9E6F8): o azul que já descansou. Badges informativos, bordas de value-cards, fundo de toasts de sucesso com texto Azul Sede.

### Secondary
- **Âmbar Mel** (#F59E0B): o destaque funcional. Palavra-chave em itálico dentro de títulos de hero, etiqueta do hero, hover do botão secundário, barra de progresso de vagas. Também aparece como luz difusa dentro do gradiente radial do hero (15% de opacidade).
- **Âmbar Luz** (#FBBF24): versão clara e vibrante — fundo do botão secundário com texto branco.
- **Âmbar Brasa** (#D97706): hover do secundário e badges de aviso. Onde o âmbar precisa afirmar-se sem gritar.

### Neutral
- **Papel** (#FFFFFF): fundo global e superfície de cartões. Branco verdadeiro, sem tom.
- **Nuvem** (#F9FAFB): seções alternadas (`section-muted`) e fundo de badges neutros — diferenciação por temperatura, não por linha.
- **Tinta** (#1F2937): texto principal e ícones. Quase-preto com calor.
- **Tinta Suave** (#6B7280): texto secundário, metadados, placeholders.
- **Tinta Pálida** (#9CA3AF): hierarquia terciária rara.
- **Linha** (#E5E7EB): toda borda de campo e divisor da navbar. Única linha permitida.

### Named Rules
**A Regra do Toque de Mel.** O âmbar é convite, não pintura: aparece em pontos focais (palavra itálica do título, etiqueta, hover) e nunca cobre superfícies grandes. Se um bloco inteiro é âmbar, algo está errado.

**A Regra das Duas Vozes.** Azul fala de estrutura e ação; âmbar fala de energia e destaque. Um componente usa uma voz principal — nunca 50/50.

## Typography

**Display Font:** Sora (fallback sans-serif)
**Body Font:** Outfit (fallback sans-serif)

**Character:** Sora tem ossatura geométrica e modernidade sem arrogância — comanda sem gritar. Outfit é sua prima mais descontraída: humanista, arredondada nas terminações, fácil de ler muito tempo. Juntas soam como um clube sério conduzido por gente jovem.

### Hierarchy
- **Display** (Sora 600, 3.5rem, 1.1): exclusivo do h1 de hero, máx. 40rem de largura. A palavra-destaque vira span âmbar em itálico — assinatura do sistema.
- **Headline** (Sora 600, 2rem, Azul Noite): títulos de seção (`section-title`), seguidos de 3rem de ar antes do conteúdo.
- **Title** (Sora 600, ~1.125rem): títulos de cartão e itens de lista.
- **Body** (Outfit 400, 0.875–1rem, 1.65): todo texto corrido e UI. Formulários em 0.875rem.
- **Label** (Outfit 600, 0.6875–0.75rem, letter-spacing 0.15em, UPPERCASE): etiquetas de hero e badges. Raramente usadas — presença rara é o que as faz valer.

### Named Rules
**A Palavra em Âmbar.** Todo título de hero destaca exatamente uma expressão entre spans âmbar-italico (`<span>`). Uma só. É a assinatura visual da marca.

## Layout

Container único de 1280px máximo com 2rem de respiro lateral. Seções verticais de 5rem, alternando Papel e Nuvem para ritmo sem linhas divisórias. Conteúdo em grades de 3 colunas (`grid-3`) com gap generoso; páginas de detalhe usam composição assimétrica conteúdo + sidebar pegajosa (`position: sticky` a partir de ~6rem do topo).

Breakpoints observados: 1024px, 900px (colapso de sidebars), 768px (dominante — navbar vira menu hamburguer, grades empilham), 640px e 480px (ajustes finos de tipo e espaçamento). Mobile-first não é dogma aqui: o sistema foi desenhado desktop-first e colapsa com elegância.

## Elevation & Depth

Profundidade responsiva em três degraus de sombra preta translúcida, sempre associados à interação:

### Shadow Vocabulary
- **Descanso** (`box-shadow: 0 1px 3px rgba(0,0,0,.06)`): estado nativo de cartões e toasts — presença mínima.
- **Suspensão** (`box-shadow: 0 4px 16px rgba(0,0,0,.08)`): hover de cartão (com translateY(-3px)) e repouso de elementos flutuantes como toasts.
- **Pleno voo** (`box-shadow: 0 8px 32px rgba(0,0,0,.1)`): modais e hovers de value-cards.

Sombras coloridas acompanham hovers de botão (azul ou âmbar a 30%, desfoque 12px). Vidro fosco é reservado às camadas sobre o conteúdo: navbar sticky (`rgba(255,255,255,.85)` + blur 12px) e overlay de modal (`rgba(10,45,61,.6)` + blur 4px).

### Named Rules
**A Regra do Levantar ao Tocar.** Superfícies são planas em repouso. Sombra maior + leve elevação existem apenas como resposta ao cursor. Elementos estáticos não flutuam.

## Shapes

Geometria de cantos macios em exatamente três escalas: campos e botões em 8px, cartões e painéis em 12px, e pílula perfeita (100px) reservada a etiquetas, badges e dots de carrossel. Nenhum corno vivo em todo o sistema. Bordas de 1px na cor Linha delimitam campos e navbar; cartões dispensam borda — a sombra de descanso basta. Avatares e medidores circulares completam o vocabulário redondo. A única diagonal do sistema é o gradiente de hero a 160°.

## Components

### Buttons
- **Shape:** retângulo arredondado (8px), peso 600, 0.8125rem, padding 0.75rem × 1.5rem
- **Primary:** Azul Sede com texto Papel; hover desce para Azul Noite, sobe 1px e ganha sombra azul 30%
- **Secondary:** Âmbar Luz com texto Papel; hover Âmbar Mel, mesmo comportamento de elevação
- **Ghost (em hero):** transparente com borda 1px branco 30%; usado como ação secundária sobre gradiente
- Transição universal: `all .2s`

### Cards / Containers
- **Corner Style:** 12px
- **Background:** Papel; imagem de capa superior com object-fit cover ou placeholder em gradiente azul/âmbar a 13%/27% de opacidade
- **Shadow Strategy:** Descanso → Suspensão no hover com translateY(-3px) (ver Elevation)
- **Border:** nenhuma; value-cards excepcionalmente usam Azul Calmo + faixa superior gradiente que acende no hover
- **Internal Padding:** corpo do cartão ~1.5rem; value-cards 2.5rem × 2rem

### Inputs / Fields
- **Style:** 1px Linha sobre Papel, raio 8px, padding 0.75rem × 1rem, fonte 0.875rem
- **Focus:** borda vira Azul Sede + halo de 3px a 10% de opacidade; sem outline padrão
- Labels: Outfit 600, 0.875rem, acima do campo com 0.375rem de ar

### Navigation
Navbar sticky de 4rem, vidro fosco, borda inferior Linha. Logo em Sora com "Interact" em peso normal e "Club" complementar; links em 0.875rem que ganham cor primária no ativo. Abaixo de 768px colapsa em menu hamburguer (☰). Painel admin usa sidebar escura dedicada fora deste escopo público.

### Etiquetas e Badges
Pílulas pequenas: etiqueta de hero (borda âmbar 30% sobre fundo translúcido, texto Âmbar Mel, uppercase espaçado) e badges de categoria/status (fundo pastel + texto saturado da mesma família, 100px de raio).

### Toast
Cartão compacto (raio 8px, sombra Suspensão) com **barra de acento à esquerda de 4px** — azul para sucesso. Entra deslizando da direita (300ms) no canto superior direito.

### Hero
Gradiente 160° Azul Noite → Azul Sede → Azul Céu com luz âmbar radial difusa no canto. Etiqueta pílula, Display com Palavra em Âmbar, parágrafo a 60% de branco, par de CTAs. Padding vertical de 6rem.

## Do's and Don'ts

### Do:
- **Do** destacar exatamente uma palavra por título de hero com span âmbar itálico (A Palavra em Âmbar)
- **Do** levantar cartões no hover: translateY(-3px) + sombra Suspensão, transição .3s
- **Do** alternar fundos de seção entre Papel e Nuvem para ritmar a página longa
- **Do** usar pílula 100px para qualquer elemento etiqueta/badge/dot
- **Do** manter textos e UI em pt-BR com tom confiante e direto

### Don't:
- **Don't** aplicar âmbar em superfícies grandes ou blocos inteiros — ele é toque, não fundo (Toque de Mel)
- **Don't** inventar novos azuis fora da rampa Noite→Sede→Céu→Calmo
- **Don't** usar cantos vivos (radius 0) em qualquer componente interativo
- **Don't** deixar elementos estáticos com sombra de voo — elevação é resposta, não enfeite
- **Don't** fabricar fotos de pessoas/eventos reais: o site só exibe imagens cadastradas pela diretoria
