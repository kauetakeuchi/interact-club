---
target: home (pagina inicial publica)
total_score: 21
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T23-09-30Z
slug: public-index-html
---
# Re-Critique — Home (public/index.html) pós-correções

Method: dual-agent (A: ses_fc9fd896affe4afothFbbF2KjQ · B: ses_fc9fd6fb8ffepKgGf6zfpa43GQ)

## Design Health Score: 21/32 (66%) — Acceptable (banda superior). Trend: 17 → 21

| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibilidade do Status | 2 | Sem skeleton/spinner; seções pipocam (CLS) |
| 2 | Match System/Real World | 3 | Copy clara; value cards abstratos |
| 3 | Controle e Liberdade | 3 | Carrossel exemplar; falta teclado no track |
| 4 | Consistência | 2 | 3 gramáticas de botão; h3 2.5rem fora da escala |
| 5 | Prevenção de Erros | 3 | Guarda de duplicidade |
| 6 | Reconhecimento | 3 | Só ☰ sem aria |
| 7 | Flexibilidade | n/a | Persuade |
| 8 | Estética/Minimalismo | 3 | Âmbar com cargos demais |
| 9 | Recuperação de Erros | 2 | Notícias falha em silêncio (projetos modela certo) |
| 10 | Ajuda/Documentação | n/a | Persuade |

n/a: 7 e 10 (Persuade). Correções da rodada: CTA invertido, estados honestos, cta-banner+footer Rotary, value-cards SVG, hero-deco, escala 2rem, carrossel (controles internos, grid-stack, pausa aria, reduced-motion), badge Parcerias AA, excerpt edge case.

## Veredito de Especificidade
Casca autoral (mundo Sede do Clube reconhecível); argumento ainda intercambiável. Sem conteúdo de API, sobra zero prova concreta.

## Evidência Determinística
Detector DEGRADED (regex; var() não avaliado). 0 error, 1 warning (side-tab noticias.js:38 — falso positivo, assinatura documentada), 19 advisory. 10/11 font-size flags contradizem a prosa do DESIGN.md (0.875rem documentado p/ formulários); gradiente placeholder casa com 13%/27% documentado. Browser: skipped — sem automação na sessão.

## Priority Issues restantes
- [P1] Contraste dos botões de conversão: branco sobre #F59E0B ~2.2:1 (btn-hero-primary, btn-cta, carousel-slide-cta). Fix: tinta escura sobre âmbar-luz ou âmbar como halo. Comando: audit
- [P1] Notícias falha em silêncio + zero loading state (CLS). Fix: simetria com projetos + skeleton. Comando: harden
- [P2] Déficit de prova: bloco estático "Como participar em 3 passos" independente de API. Comando: shape + clarify
- [P2] Ritmo de fundos: hero+notícias mesmo gradiente; cta+footer emendados. Comando: layout
- [P3] Dívida: h3 2.5rem, inline styles, badge-green/blue nomes trocados, meta description/OG ausentes, toast-container duplicado. Comando: polish

## Persona Red Flags
Jordan: cadastro sem microcopy de reassuro (idade/custo/compromisso); toast beco sem saída.
Riley: retry sem disable (corrida); description null → TypeError no slice; título 200 chars → 6 linhas.
Casey: dots 8px; swipe qualquer ângulo; @import de fontes bloqueia 3G.

## Minor
Meta description/OG ausentes; ☰ sem aria; toast-container duplicado; hero-deco-3/4 sem uso; timer stale no mouseenter.
