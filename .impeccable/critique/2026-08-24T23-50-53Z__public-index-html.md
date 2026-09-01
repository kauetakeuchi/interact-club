---
target: home (pagina inicial publica)
total_score: 26
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-24T23-50-53Z
slug: public-index-html
---
# Critique #4 — Home (public/index.html) pós fechamento dos P1s

Method: dual-agent (A: ses_fc9d86323ffe6aKUMD6Sbp9lSv · B: ses_fc9d85717ffeA1lq7Pe3BLOgvp)

## Design Health Score: 26/32 (81%) — Good. Trend: 17 → 21 → 22 → 26

| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibilidade do Status | 3 | Skeletons+retry travado; falta timeout/abort |
| 2 | Match System/Real World | 4 | Copy pt-BR impecável |
| 3 | Controle e Liberdade | 3 | Menu mobile sem Esc/clique-fora |
| 4 | Consistência | 3 | #3b82f6 fora da rampa; pílula vs 8px |
| 5 | Prevenção de Erros | 3 | Trava de corrida ok; falta timeout |
| 6 | Reconhecimento | 4 | Nada exige memória |
| 7 | Flexibilidade | n/a | Persuade |
| 8 | Estética/Minimalismo | 3 | Metadados .6 branco ~3.1:1 |
| 9 | Recuperação de Erros | 3 | Honesto+simétrico; msg única genérica |
| 10 | Ajuda/Documentação | n/a | Persuade |

n/a: 7, 10.

## Correções desta rodada (validadas)
Badges AA (ambers #B45309/#92400E: 4.51-7.09:1 em 12 combos); skeleton shimmer news+projetos (reduced-motion safe); notícias erro honesto simétrico; retry com trava de corrida.

## Veredito de Especificidade
"Inequivocamente deste clube" — bolsões: value-cards genéricos, placeholder vazio, footer template.

## Evidência Determinística
Detector DEGRADED (regex). 21 findings: 0 error, 1 warning (side-tab — positivo verdadeiro: excerpt não-documentado), 20 advisory (9-10 FPs de frontmatter-vs-prosa; 1 positivo forte: #3b82f622/44 viola rampa — inconsistente com eventos.js #17458F22/44; lacuna: família vermelha de estado sem spec). Browser: skipped.

## Priority Issues restantes
- [P1] Fetch sem timeout/abort — shimmer eterno em rede presa. Comando: harden
- [P2] Metadados carrossel rgba(255,255,255,.6) ~3.1:1 em 0.8125rem. Comando: audit
- [P2] Assíncrono mudo p/ leitores de tela (sem aria-live/region). Comando: audit
- [P3] Deriva tokens: #3b82f622/44 → rampa; #E8EFFA; pílula vs .btn 8px. Comando: polish
- [P3] Reticências <120 chars; menu sem Esc/foco-return; visibilitychange no autoplay. Comando: clarify

## Personas
Jordan: placeholder de projeto sem imagem lê como quebrado; dots mudos p/ first-timer.
Riley: rede morta = retry infinito sem offline detection; visibilitychange ausente; reticências mentirosas.
Casey: dots 8px; @import fontes render-blocking.
