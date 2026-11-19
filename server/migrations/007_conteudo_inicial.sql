-- Conteúdo inicial do site: 2 notícias, 2 eventos e 2 projetos.
-- Roda também em bancos novos (o nome tem "_conteudo"; veja src/migrate.ts).
-- Não duplica: cada item só é inserido se ainda não existir um com o mesmo slug/título.
-- As notícias ficam sem autor (authorId NULL), pois um banco novo ainda não tem usuários.
-- Os textos são exemplos: troque pelos fatos reais do clube antes de publicar o site.

INSERT INTO newsarticle (id, title, slug, content, excerpt, imageUrl, category, published, authorId, createdAt)
SELECT 'c0a80000-0000-4000-8000-000000000001', 'Interact Club arrecada 380 kg de alimentos na primeira etapa da campanha Natal Sem Fome', 'interact-arrecada-alimentos-campanha-natal-sem-fome',
'O Interact Club de Taquaritinga concluiu a primeira etapa da campanha Natal Sem Fome com 380 kg de alimentos não perecíveis arrecadados. A mobilização aconteceu em dois fins de semana de novembro, com pontos de coleta em supermercados parceiros e em escolas da cidade.
Arroz, feijão, óleo, macarrão e leite foram os itens mais doados. Todo o material foi separado e organizado pelos próprios associados na sede do clube, onde está sendo montado em cestas básicas.
As cestas serão entregues em dezembro a famílias indicadas por entidades assistenciais do município, que acompanham de perto as necessidades de cada casa. A entrega é feita em conjunto com as instituições, para que a ajuda chegue a quem mais precisa.
A segunda etapa da campanha acontece no dia 6 de dezembro, com um dia de arrecadação aberto à comunidade. Quem quiser ajudar pode participar como voluntário ou levar sua doação ao ponto de coleta. As informações estão na página de Eventos.
O clube agradece a cada pessoa e empresa que contribuiu. Pequenas ações, somadas, fazem uma grande diferença.',
'Em dois fins de semana de mobilização, os associados reuniram alimentos não perecíveis que serão entregues a famílias acompanhadas por entidades assistenciais de Taquaritinga.', NULL, 'Campanhas', TRUE, NULL, '2026-11-12 10:00:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM newsarticle WHERE slug = 'interact-arrecada-alimentos-campanha-natal-sem-fome');

INSERT INTO newsarticle (id, title, slug, content, excerpt, imageUrl, category, published, authorId, createdAt)
SELECT 'c0a80000-0000-4000-8000-000000000002', 'Associados participam de formação em liderança promovida em parceria com o Rotary', 'associados-participam-de-formacao-em-lideranca-com-o-rotary',
'Associados do Interact Club de Taquaritinga participaram, no último sábado, de uma formação em liderança realizada em parceria com o Rotary Club da cidade. O encontro aconteceu na sede do clube e teve duração de uma manhã inteira.
A programação foi dividida em três blocos: comunicação e oratória, planejamento de projetos sociais e trabalho em equipe. Rotarianos com experiência em gestão conduziram as atividades, sempre com exercícios práticos e estudos de caso de projetos reais do clube.
No bloco de planejamento, os jovens aprenderam a transformar uma ideia em projeto: definir o objetivo, estimar recursos, dividir responsabilidades e medir o resultado. O método já está sendo aplicado na organização das próximas ações do Interact.
A formação faz parte do compromisso do Rotary com o desenvolvimento de novas lideranças. Para o clube, é uma oportunidade de preparar os associados para conduzir projetos com mais autonomia e responsabilidade.
Novas edições estão previstas para o próximo ano e serão abertas a todos os associados.',
'O encontro reuniu jovens do Interact e rotarianos para trabalhar comunicação, organização de projetos e trabalho em equipe.', NULL, 'Parcerias', TRUE, NULL, '2026-11-04 15:00:00'
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM newsarticle WHERE slug = 'associados-participam-de-formacao-em-lideranca-com-o-rotary');

INSERT INTO `event` (id, title, description, `date`, location, imageUrl, isPublic, maxParticipants)
SELECT 'c0a80000-0000-4000-8000-000000000003', 'Natal Sem Fome: dia de arrecadação',
'Segunda etapa da campanha Natal Sem Fome. Neste dia, os voluntários recebem as doações da comunidade, conferem a validade dos produtos e montam as cestas básicas que serão entregues às famílias em dezembro.
Programação: 8h30, recepção dos voluntários e divisão das equipes; 9h às 12h, recebimento e triagem das doações; 12h às 13h, almoço; 13h às 16h, montagem das cestas.
Recomendamos roupa confortável e calçado fechado. O almoço é oferecido pelo clube.
As vagas são para voluntários. Quem quiser apenas doar pode levar alimentos não perecíveis ao local, das 9h às 16h, sem necessidade de inscrição.',
'2026-12-06 08:30:00', 'Sede do clube: Rua Francisco Mesquita, 640, Taquaritinga/SP', NULL, TRUE, 30
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `event` WHERE title = 'Natal Sem Fome: dia de arrecadação');

INSERT INTO `event` (id, title, description, `date`, location, imageUrl, isPublic, maxParticipants)
SELECT 'c0a80000-0000-4000-8000-000000000004', 'Oficina de Educação Financeira para Jovens',
'Oficina gratuita sobre organização do dinheiro, voltada a jovens de 12 a 18 anos. O conteúdo foi preparado em parceria com rotarianos que atuam na área financeira.
Temas abordados: diferença entre desejo e necessidade, como montar um orçamento simples, primeiros passos para guardar dinheiro e cuidados com compras on-line e golpes digitais.
Os participantes trabalharam em grupos com situações do dia a dia e saíram com uma planilha de orçamento pessoal pronta para usar.',
'2026-10-18 14:00:00', 'Sede do clube: Rua Francisco Mesquita, 640, Taquaritinga/SP', NULL, TRUE, 40
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `event` WHERE title = 'Oficina de Educação Financeira para Jovens');

INSERT INTO `project` (id, title, description, `status`, startDate, endDate, imageUrl, isPublic)
SELECT 'c0a80000-0000-4000-8000-000000000005', 'Leitura em Ação',
'Projeto de incentivo à leitura com alunos do ensino fundamental de escolas públicas de Taquaritinga. Uma vez por semana, associados do Interact visitam as escolas para conduzir rodas de leitura e atividades com os livros.
Objetivo: estimular o hábito da leitura e melhorar a interpretação de texto, de forma leve e próxima, com jovens conversando com crianças.
Como funciona: cada associado acompanha um pequeno grupo durante todo o semestre. Os livros vêm de doações e circulam entre as turmas, formando um pequeno acervo em cada escola.
Andamento: o projeto atende hoje duas escolas e cerca de 60 alunos. A meta é chegar a três escolas até o fim do semestre.
Como ajudar: doações de livros infantis e infantojuvenis em bom estado podem ser entregues na sede do clube.',
'IN_PROGRESS', '2026-08-03', '2026-12-11', NULL, TRUE
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `project` WHERE title = 'Leitura em Ação');

INSERT INTO `project` (id, title, description, `status`, startDate, endDate, imageUrl, isPublic)
SELECT 'c0a80000-0000-4000-8000-000000000006', 'Agasalho Solidário 2026',
'Campanha de arrecadação de roupas de frio, cobertores e calçados realizada durante o outono e o inverno de 2026.
Os pontos de coleta ficaram em escolas, comércios parceiros e na sede do clube. Todas as peças foram triadas, higienizadas quando necessário e separadas por tamanho pelos associados antes da entrega.
Resultado: mais de 900 peças arrecadadas e distribuídas a famílias e pessoas em situação de vulnerabilidade, com o apoio de entidades assistenciais do município.
O clube agradece aos doadores, às escolas e aos estabelecimentos que receberam as caixas de coleta. A campanha volta no próximo inverno.',
'COMPLETED', '2026-05-04', '2026-07-10', NULL, TRUE
FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM `project` WHERE title = 'Agasalho Solidário 2026');
