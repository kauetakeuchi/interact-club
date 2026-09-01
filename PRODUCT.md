# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primário:** comunidade local — escolas, pais e jovens de 12–18 anos descobrindo o clube. Chegam sem contexto, precisam entender o que é o Interact e como participar. (Prioridade confirmada pelo responsável: divulgar o clube.)
- **Membros ativos:** jovens já cadastrados que entram para ver eventos, se inscrever e ler avisos.
- **Admin/Diretoria:** voluntários do clube que criam e mantêm todo o conteúdo pelo painel administrativo, sem conhecimento técnico.

## Product Purpose

Site oficial de um Interact Club (programa juvenil do Rotary International). Existiria para divulgar as ações do clube e atrair novos jovens; também funciona como área do membro (inscrição em eventos, avisos, perfil) e ferramenta de gestão de conteúdo para a diretoria. Sucesso: um visitante externo entende o clube e se anima a participar; um membro acompanha a agenda sem depender de redes sociais.

## Positioning

Canal oficial e autoadministrado do clube — o próprio conteúdo (projetos, eventos, notícias) é gerido pelos jovens via painel, com inscrição real em eventos. Um perfil de rede social não consegue oferecer agenda com vagas nem página própria estável.

## Operating Context

- Todo o conteúdo em português brasileiro (pt-BR).
- Mantido por voluntários rotativos (gestão escolar/juvenil): simplicidade operacional importa mais que recursos avançados.
- Ambiente típico de desenvolvimento local: XAMPP + MySQL; hospedagem ainda indefinida.

## Capabilities and Constraints

- Funcionalidades existentes: páginas públicas (início, sobre, projetos, eventos, notícias, contato), cadastro/login de membro, inscrição em eventos com limite de vagas, avisos, dashboard do membro e painel admin completo (membros, eventos, projetos, notícias, avisos, contatos recebidos).
- **Restrição técnica vinculante (decisão do responsável):** frontend permanece HTML/CSS/JavaScript puro, sem frameworks e sem etapa de build; TypeScript apenas no backend (Express + MySQL). Qualquer trabalho futuro de design deve preservar isso.
- Autenticação JWT; uploads de imagem locais (Multer).
- Fato não definido (não inventar): cidade/região do clube e nome do Rotary Club patrocinador — decisão explícita foi não citar nomes locais por enquanto.

## Brand Commitments

- Nome: "Interact Club", sem citação de cidade ou clube patrocinador.
- Afiliação institucional ao Rotary International deve ser respeitada no tom (serviço, liderança, integridade).

## Evidence on Hand

- Conteúdo real disponível hoje: nenhum material fotográfico ou depoimentos reais — o seed cria apenas conteúdo fictício de demonstração. Trabalho futuro NÃO deve fabricar fotos de pessoas/eventos reais nem provas sociais.
- Estrutura pronta para receber conteúdo real assim que a diretoria cadastrar.

## Product Principles

1. **Verdade acima de tudo** — o site exibe somente o que a diretoria realmente cadastrou; nada de conteúdo inventado.
2. **Porta aberta** — um visitante novo entende o que é o clube e como participar em poucos minutos, sem jargão interno.
3. **Jovens no comando** — a gestão precisa caber num voluntário de 15 anos: painel simples prevalece sobre recurso poderoso.
4. **Confiança institucional** — o tom reflete os valores Rotary: serviço, liderança e integridade, sem infantilizar o público jovem.
