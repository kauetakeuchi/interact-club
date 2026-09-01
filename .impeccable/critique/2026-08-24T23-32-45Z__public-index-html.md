---
target: home (pagina inicial publica)
total_score: 22
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 2
timestamp: 2026-08-24T23-32-45Z
slug: public-index-html
---
# Critique #3 — Home (public/index.html) pós layout+polish

⚠️ DEGRADED: single-context (subagent provider indisponível — Endpoint is unavailable em 4 tentativas; A e B inline sequencial, A travada antes do detector; autor das correções = avaliador, ler com ceticismo)

## Design Health Score: 22/32 (69%) — Acceptable. Trend: 17 → 21 → 22

| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibilidade do Status | 2 | Sem skeleton; CLS |
| 2 | Match System/Real World | 3 | "Participar" = criar conta |
| 3 | Controle e Liberdade | 3 | Falta seta teclado |
| 4 | Consistência | 3 | h3 2.5rem; 2 gramáticas de botão |
| 5 | Prevenção de Erros | 3 | Guarda duplicidade |
| 6 | Reconhecimento | 3 | ☰ SVG+aria corrigido |
| 7 | Flexibilidade | n/a | Persuade |
| 8 | Estética/Minimalismo | 3 | Âmbar multi-role (AA agora) |
| 9 | Recuperação de Erros | 2 | Notícias silenciosa |
| 10 | Ajuda/Documentação | n/a | Persuade |

n/a: 7, 10.

## Correções desta rodada (validadas no código)
Contraste AA nos 4 botões de conversão (5.63-7.24:1); favicon.svg; description+OG+twitter:card; reordenação hero→valores→notícias→projetos→cta→footer-claro (ritmo escuro/claro); footer 4.83:1; ☰ SVG+aria-expanded; toast duplicado removido; timer stale; badge-positive/warning semânticas; hero-actions class.

## Veredito de Especificidade
Casca autoral consolidada; argumento genérico — déficit de prova persiste (depende de conteúdo real + bloco estático).

## Evidência Determinística
Detector DEGRADED (regex). 20 findings: 0 error, 1 warning (side-tab falso positivo documentado), 19 advisory (12 font-size — 10 contradizem prosa do DESIGN.md; 7 cores de estado intencionais). Estável vs rodada 2; nenhuma violação nova. Browser: skipped.

## Priority Issues restantes
- [P1] Badges branco sobre âmbar ~2.2:1 (carousel-badge/card-badge). Comando: polish
- [P1] Notícias erro silencioso + zero skeleton. Comando: harden
- [P2] Bloco estático "Como participar em 3 passos". Comando: shape
- [P2] Dots 8px + swipe sem ângulo. Comando: adapt
- [P3] og:image (asset pendente), h3 2.5rem, teclado carrossel. Comando: polish

## Personas
Jordan: cadastro sem microcopy; toast beco-sem-saída.
Riley: retry sem disable; título longo resolvido pelo grid-stack.
Casey: dots 8px; swipe qualquer ângulo; @import fontes 3G.
