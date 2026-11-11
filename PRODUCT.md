# Product

## Platform

web

## Users

- **Primário:** comunidade local — escolas, pais e jovens de 12–18 anos descobrindo o clube. Chegam sem contexto, precisam entender o que é o Interact e como participar. (Prioridade confirmada pelo responsável: divulgar o clube.)
- **Membros ativos:** jovens já cadastrados que entram para ver eventos, se inscrever e ler avisos.
- **Diretoria (`DIRECTOR`):** voluntários que criam e mantêm eventos, projetos, notícias, avisos e mensagens recebidas pelo painel.
- **Administração (`ADMIN`):** além do conteúdo, gerencia membros, funções e status das contas.

## Product Purpose

Site oficial do Interact Club de Taquaritinga (programa juvenil do Rotary International). Existe para divulgar as ações do clube e atrair novos jovens; também funciona como área do membro (inscrição em eventos, avisos, perfil) e ferramenta de gestão de conteúdo para a diretoria. Sucesso: um visitante externo entende o clube e se anima a participar; um membro acompanha a agenda sem depender de redes sociais.

## Positioning

Canal oficial e autoadministrado do clube — o próprio conteúdo (projetos, eventos, notícias) é gerido pelos jovens via painel, com inscrição real em eventos. Um perfil de rede social não consegue oferecer agenda com vagas nem página própria estável.

## Operating Context

- Todo o conteúdo em português brasileiro (pt-BR).
- Mantido por voluntários rotativos (gestão escolar/juvenil): simplicidade operacional importa mais que recursos avançados.
- Ambiente típico de desenvolvimento local: XAMPP + MySQL; hospedagem ainda indefinida.
- Fuso de referência do clube: America/Sao_Paulo.

## Capabilities and Constraints

- Funcionalidades existentes: páginas públicas (início, sobre, projetos, eventos, notícias, contato), cadastro/login de membro com confirmação de email, recuperação de senha, inscrição em eventos com limite de vagas, avisos, dashboard do membro e painel administrativo (membros, eventos, projetos, notícias, avisos e contatos recebidos).
- **Restrição técnica vinculante (decisão do responsável):** frontend permanece HTML/CSS/JavaScript puro, sem frameworks e sem etapa de build; TypeScript apenas no backend (Express + MySQL). Qualquer trabalho futuro de design deve preservar isso.
- Autenticação por JWT em cookie HttpOnly; uploads de imagem locais (Multer) ou no Cloudinary quando configurado.
- Permissões: `DIRECTOR` mantém o conteúdo; apenas `ADMIN` gerencia membros e funções.
- Fato não definido (não inventar): nome do Rotary Club patrocinador — decisão explícita foi não citar o nome do clube patrocinador por enquanto.

## Brand Commitments

- Nome: "Interact Club de Taquaritinga"; o clube patrocinador não é nomeado.
- Afiliação institucional ao Rotary International deve ser respeitada no tom (serviço, liderança, integridade).

## Evidence on Hand

- Conteúdo real disponível hoje: nenhum material fotográfico ou depoimentos reais — o seed cria apenas conteúdo fictício de demonstração. Trabalho futuro NÃO deve fabricar fotos de pessoas/eventos reais nem provas sociais.
- Estrutura pronta para receber conteúdo real assim que a diretoria cadastrar.

## Product Principles

1. **Verdade acima de tudo** — o site exibe somente o que a diretoria realmente cadastrou; nada de conteúdo inventado.
2. **Porta aberta** — um visitante novo entende o que é o clube e como participar em poucos minutos, sem jargão interno.
3. **Jovens no comando** — a gestão precisa caber num voluntário de 15 anos: painel simples prevalece sobre recurso poderoso.
4. **Confiança institucional** — o tom reflete os valores Rotary: serviço, liderança e integridade, sem infantilizar o público jovem.
