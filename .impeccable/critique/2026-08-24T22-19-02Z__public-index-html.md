---
target: home (pagina inicial publica)
total_score: 17
max_score: 32
na_heuristics: 7,10
p0_count: 2
p1_count: 2
timestamp: 2026-08-24T22-19-02Z
slug: public-index-html
---
# Critique — Home (public/index.html)

Method: dual-agent (A: ses_fca2a0494ffeyyma1e3emezO22 · B: ses_fca29cee3ffeZ3LA3cEo2KWc25)

## Design Health Score: 17/32 (53%) — Acceptable

| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibilidade do Status | 2 | Conteúdo via JS sem skeleton; carrossel autopilot sem pausa |
| 2 | Match System/Real World | 3 | "Quero participar" entrega cadastro de conta, não ingresso |
| 3 | Controle e Liberdade | 2 | Autoplay sem stop visível (WCAG 2.2.2) |
| 4 | Consistência e Padrões | 2 | Dois sistemas de botão no hero; escala de títulos divergente |
| 5 | Prevenção de Erros | 2 | Interceptação /cadastro logado boa; pouco mais |
| 6 | Reconhecimento > Recall | 3 | Labels, badges, aria-labels |
| 7 | Flexibilidade/Eficiência | n/a | Superfície Persuade |
| 8 | Estética Minimalista | 2 | Dois megabloques azuis consecutivos |
| 9 | Recuperação de Erros | 1 | API falha = silêncio, CTA morto |
| 10 | Ajuda/Documentação | n/a | Landing persuade |

n/a: heurísticas 7 e 10 (modo Persuade).

## Veredito de Especificidade
Intercambiável de categoria. Assinaturas do DESIGN.md (.value-card, .hero-deco, .cta-banner, botão-pílula hero) existem no CSS mas não são usadas na home; markup improvisa com divs e emojis.

## Evidência Determinística
Detector em MODO DEGRADADO (fallback regex; var() não avaliado; subnotificado). 18 findings: 0 error, 1 warning (side-tab noticias.js:38 — provável falso positivo, padrão de assinatura), 17 advisory (12 font-size off-ramp; 5 cores de estado em eventos.js #c53030/#fed7d7/#742a2a/#4a5568 — intencionais mas não documentadas no DESIGN.md). Browser: skipped — sem automação de browser na sessão.

## Priority Issues
- [P0] CTA primário invertido no hero (index.html:19-20) — "Quero participar" ghost fraco, "Conheça mais" sólido. Fix: btn-hero-primary âmbar em participar, ghost em conhecer. Comando: polish
- [P0] Estados vazios/de erro silenciosos (home.js:29-33,146-147). Fix: esconder bloco quando vazio; catch com estado honesto. Comando: harden
- [P1] Fim de página anticlimático (Layout.js:8) — rodapé 1 linha; .cta-banner dorme no CSS. Fix: cta-banner + footer Rotary/contato. Comando: polish
- [P1] Carrossel frágil (style.css:3333) — setas -6rem fora da viewport 900-1400px; min-height corta texto; autoplay sem pausa touch. Fix: setas internas, grid-stack, pause, reduced-motion. Comando: adapt
- [P2] Home ignora o design system — value props emoji em divs nuas; botão raio 8px no hero. Fix: usar componentes existentes. Comando: polish

## Persona Red Flags
Jordan: CTA real parece decorativo → desvio para /sobre; H1 genérico; /cadastro ≠ ingresso no clube.
Riley: API fora muda home em silêncio; slide mobile vaza; placeholders idênticos; badge Parcerias falha AA.
Casey: notícias (retenção) empurram pitch ~38rem abaixo; ☰ sem aria-expanded; CTA desaparece por 4 telas.

## Minor
Excerpt "..." em textos curtos; sem prefers-reduced-motion; footer sem Rotary; detector degradado (re-rodar com parsers).

## Perguntas
1. Onde a verdade específica deste clube aparece na home?
2. Por que a energia visual máxima é gasta com notícias e não com a narrativa de conversão?
3. "Participar" = criar conta? A home responde "o que meu filho faz no primeiro encontro"?
