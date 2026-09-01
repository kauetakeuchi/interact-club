---
target: home (pagina inicial publica)
total_score: 28
max_score: 32
na_heuristics: 7,10
p0_count: 0
p1_count: 1
timestamp: 2026-08-25T00-09-59Z
slug: public-index-html
---
# Critique #5 — Home (public/index.html) pós rodada de refinamento

Method: dual-agent (A: ses_fc9c8936cffePbXnVXg1X4tNiZ · B: ses_fc9c88698ffe8P1r75OvBIJcsZ)

## Design Health Score: 28/32 (87.5%) — Good alto. Trend: 17 → 21 → 22 → 26 → 28

| # | Heurística | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibilidade do Status | 4 | Exemplar p/ a stack |
| 2 | Match System/Real World | 4 | pt-BR fluente |
| 3 | Controle e Liberdade | 3 | Falta pausa por foco de teclado |
| 4 | Consistência | 3 | #E8EFFA fora da paleta; #2E63C4 vs regra do hero |
| 5 | Prevenção de Erros | 3 | Timeout, retry cego, guarda auth |
| 6 | Reconhecimento | 4 | CTAs início+fim |
| 7 | Flexibilidade | n/a | Persuade |
| 8 | Estética/Minimalismo | 4 | Progressão limpa, âmbar contido |
| 9 | Recuperação de Erros | 3 | TypeError "Failed to fetch" vaza inglês |
| 10 | Ajuda/Documentação | n/a | Persuade |

n/a: 7, 10.

## Correções desta rodada (verificadas em código)
AbortController 10s com mensagem humana (api.js); meta/parágrafo do carrossel .9 = 4.92:1; aria-live+region nos feeds; placeholder #2E63C422/44; reticências condicionais.

## Veredito de Especificidade
Execução verificada mas literal: timeout consertado, offline esquecido; contraste do sucesso normalizado, do erro ignorado. Cauda = "corrigido no produto" vs "corrigido no relatório".

## Evidência Determinística
Detector DEGRADED (regex). 19 findings: 0 error, 1 warning (side-tab — FP discutível: excerpt editorial), 18 advisory (10+ FPs documentados na prosa; genuínos: .625rem, 1.5rem, #4a5568). Menor contagem das 5 rodadas. Browser: skipped.

## Priority Issues restantes
- [P1] Offline: TypeError "Failed to fetch" vaza inglês (api.js traduz só AbortError). Fix 1 linha: mapear TypeError → pt-BR. Comando: harden
- [P2] Erro do carrossel: parágrafo .75 inline ~3.9:1. Fix: .9. Comando: audit
- [P3] aria-live pela metade (projetos sem landmark; vazio deixa "Carregando" eterno p/ SR)
- [P3] Carrossel não pausa no foco de teclado
- [P3] Deriva tokens: #E8EFFA; #2E63C4 vs hero-exclusive; parágrafos .65 oscilantes

## Personas
Jordan: Wi-Fi de escola → inglês na tela; quer saber onde/ quando se reúne.
Riley: confiança 100% na marca Rotary; sem voz humana, Contato é a ponte.
Casey: "saltou de qualidade"; acessibilidade ainda camada, não estrutura.

## Menores
meta description sem cedilha; guarda de login só no 1º link /cadastro; title da aba genérico; og:image pendente; decos mortos no CSS.
