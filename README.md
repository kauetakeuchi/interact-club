# Interact Club

Site oficial do Interact Club de Taquaritinga — programa juvenil do Rotary International.

## Tecnologias

- **Backend:** Express.js (TypeScript)
- **Frontend:** HTML, CSS e JavaScript puro, sem framework e sem etapa de build
- **Banco:** MySQL
- **Autenticação:** JWT em cookie de sessão HttpOnly
- **Upload:** Multer (armazenamento local) ou Cloudinary (opcional)

## Requisitos

- Node.js 18+
- MySQL (XAMPP, WAMP ou instalação nativa)

## Como rodar localmente

### 1. Instale as dependências

As dependências ficam na pasta `server/`:

```bash
cd server
npm install
```

### 2. Configure as variáveis de ambiente

Copie `server/.env.example` para `server/.env` e preencha os valores:

```env
DATABASE_URL="mysql://root:@localhost:3306/interact_club"
JWT_SECRET=""
PORT=3001
APP_URL="http://localhost:3001"
TZ="America/Sao_Paulo"
TRUST_PROXY=""

# Envio de emails de confirmação e redefinição de senha
EMAIL_PROVIDER="resend"
SMTP_USER="usuario-smtp"
SMTP_PASS="senha-smtp"
SMTP_FROM="Interact Club <contato@exemplo.org>"

# Opcional: armazenamento de imagens no Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

- `APP_URL` é a URL pública do site. Também define a origem aceita pelo CORS e pelos emails enviados.
- Com `APP_URL` em `https`, o cookie de sessão passa a usar a flag `Secure` automaticamente.
- `TZ` mantém datas de eventos e mensagens no fuso do clube (`America/Sao_Paulo`).
- Defina `TRUST_PROXY=1` quando o app estiver atrás de nginx, Cloudflare ou outro proxy reverso; sem isso, o rate limit enxerga o IP do proxy.
- Sem as variáveis do Cloudinary, os uploads ficam em `public/uploads/`.

Gere um segredo JWT único antes de iniciar o servidor:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sem `JWT_SECRET` com pelo menos 32 bytes, o servidor não inicia. Ao trocar esse segredo, todas as sessões existentes precisam entrar novamente.

O envio de email é necessário para confirmar novos cadastros e para o fluxo de “esqueci minha senha”. Em produção, configure `APP_URL` com o endereço público do site (por exemplo, `https://interact.exemplo.org`).

Provedores disponíveis:

| `EMAIL_PROVIDER` | `SMTP_USER` | `SMTP_PASS` |
|---|---|---|
| `gmail` | Endereço Gmail completo | Senha de aplicativo do Google |
| `brevo` | Usuário SMTP da Brevo | Chave SMTP da Brevo |
| `resend` | Pode ser omitido (`resend` é usado automaticamente) | Chave de API da Resend |
| `hostinger` | Endereço de email completo | Senha da caixa de email |
| `smtp` | Usuário do serviço, se exigido | Senha do serviço, se exigida |

Nos quatro primeiros casos, servidor, porta e criptografia são preenchidos automaticamente. Para `smtp`, configure também `SMTP_HOST`, `SMTP_PORT` e `SMTP_SECURE`; esses campos também podem substituir o preset de qualquer provedor.

### 3. Crie o banco

Com o MySQL rodando (no XAMPP, clique em **Start** na linha do MySQL), rode a partir da raiz:

```bash
npm run migrate
```

Num banco novo, o comando cria todas as tabelas e já insere o conteúdo inicial do site (2 notícias, 2 eventos e 2 projetos de exemplo, em `007_conteudo_inicial.sql`).

O comando cria o banco do `DATABASE_URL` se ele não existir e aplica só as migrations que faltam. Ele guarda o que já rodou na tabela `schema_migrations`, então pode ser executado sempre que você atualizar o projeto. Em bancos criados antes desse comando existir, ele reconhece as migrations que já foram aplicadas à mão. Em produção, depois do `npm run build`, use `npm --prefix server run migrate:prod`.

Para criar uma migration nova, adicione `server/migrations/NNN_descricao.sql` com o próximo número **e** atualize o `001_schema.sql`, que sempre descreve o esquema completo usado em bancos novos. Exceção: migrations com `_conteudo` no nome só inserem dados (sem mudar o esquema) e rodam também em bancos novos; elas não podem duplicar o que já existe.

<details>
<summary>Sem o comando: aplicar pelo phpMyAdmin</summary>

Banco novo: execute o `001_schema.sql` e depois o `007_conteudo_inicial.sql` (aba **SQL** → cole o conteúdo → executar). Banco existente: execute, nesta ordem, apenas as migrations que ainda não rodaram:

| Migration | Quando executar |
|---|---|
| `001_schema.sql` | Banco novo (cria tudo) |
| `002_email_verification.sql` | Bancos criados antes da confirmação de email |
| `003_email_updates_consent.sql` | Bancos criados antes da preferência de novidades |
| `004_polish.sql` | Bancos criados antes da recuperação de senha e dos índices de desempenho |
| `005_project_updated_at.sql` | Bancos criados antes de `project.updatedAt` existir |
| `006_revoked_session.sql` | Bancos criados antes do "Sair" encerrar a sessão no servidor |
| `007_conteudo_inicial.sql` | Qualquer banco, inclusive novo: 2 notícias, 2 eventos e 2 projetos de exemplo (não duplica) |

</details>

### 4. Rode

A partir da raiz (os scripts delegam para o server):

```bash
npm run dev
```

Ou direto no server: `npm run dev` dentro de `server/`.

Acesse em http://localhost:3001.

Para abrir pelo celular na mesma rede Wi-Fi, use o IP do computador (veja com `ipconfig`), por exemplo `http://192.168.0.15:3001`. Se não abrir, libere a porta 3001 no Firewall do Windows para redes privadas. Os links dos emails usam o `APP_URL`; para que também abram no celular, coloque nele esse mesmo endereço com IP.

### 5. Crie o primeiro administrador

Um banco novo não tem usuários. Cadastre-se pelo site e depois, no phpMyAdmin (aba **SQL**), promova sua conta:

```sql
UPDATE user SET role = 'ADMIN', status = 'ACTIVE' WHERE email = 'seu-email@exemplo.com';
```

Se o email de confirmação não chegar (por exemplo, com o envio de email ainda não configurado), confirme a conta no mesmo comando acrescentando `, emailVerifiedAt = NOW()` antes do `WHERE`.

### 6. Dados de demonstração (opcional)

Para popular o banco com contas de teste e mais conteúdo de exemplo (notícias, projetos, eventos e avisos), separado do conteúdo inicial do passo 3:

No PowerShell, habilite explicitamente o seed somente para esta execução local:

```powershell
$env:ALLOW_DEMO_SEED="true"
npm run seed
Remove-Item Env:ALLOW_DEMO_SEED
```

O seed é bloqueado em produção e é **idempotente** — pode ser rodado várias vezes sem duplicar dados. Nunca publique as contas de demonstração com as senhas abaixo.

| Perfil | Email | Senha |
|---|---|---|
| Admin | admin@interactclub.com | admin123 |
| Diretora | diretora@interactclub.com | diretora123 |
| Membro | membro@interactclub.com | membro123 |

> Troque as senhas após os primeiros acessos.

## Permissões

| Área | `MEMBER` | `DIRECTOR` | `ADMIN` |
|---|---|---|---|
| Site público e área do membro | Sim | Sim | Sim |
| Eventos, projetos, notícias, avisos e contatos | Não | Sim | Sim |
| Gestão de membros, funções e status | Não | Não | Sim |

A diretoria pode criar e editar conteúdo pelo painel, mas não alterar contas de outros membros. Apenas a administração gerencia membros. O sistema impede remover ou rebaixar o último administrador ativo.

### Dados da conta

| Campo | Quem altera |
|---|---|
| Nome, telefone, bio, foto de perfil e preferência de emails | O próprio usuário, pelo perfil |
| Senha | O próprio usuário, pelo "Esqueci minha senha". A administração **não** troca senhas de membros |
| Email | Ninguém pelo site (é o login da conta) |
| Cargo | A administração. Membros veem o cargo, mas não editam; diretoria e administração podem editar o próprio |
| Função (`role`) e status | Somente a administração |

Validações de cadastro e perfil:

- **Senha:** pelo menos 8 caracteres, com letra maiúscula, letra minúscula, número e caractere especial. Vale no cadastro e na redefinição de senha.
- **Telefone (opcional):** padrão brasileiro com DDD existente e quantidade exata de dígitos: 10 para fixo (começando com 2 a 5) ou 11 para celular (começando com 9). Sequências óbvias como `99999-9999` ou `91234-5678` são recusadas. É guardado só com os dígitos e exibido como `(11) 98123-4567`.
- **Data de nascimento (opcional):** entre 01/01/1900 e hoje.
- **Email já confirmado** não pode ser cadastrado de novo. Um cadastro que nunca foi confirmado é substituído por um novo cadastro com o mesmo email.

## Segurança e privacidade

- Sessão em cookie `interact_session` com `HttpOnly`, `SameSite=Lax` e expiração de 7 dias. O token não fica acessível ao JavaScript da página.
- Trocar a senha invalida automaticamente as sessões abertas antes da mudança.
- O botão "Sair" encerra a sessão também no servidor (tabela `revoked_session`): o token deixa de valer mesmo que alguém tenha copiado o cookie.
- Proteção CSRF por verificação de `Origin` em requisições que alteram estado.
- Helmet com Content Security Policy restritiva, `frame-ancestors 'none'` e `object-src 'none'`.
- Rate limit separado para login/cadastro/recuperação de senha e para o formulário de contato, além do limite geral da API.
- Honeypot invisível no formulário de contato e limite de 256 KB para o corpo JSON.
- Senhas armazenadas com bcrypt (custo 12); tokens de verificação e redefinição guardados apenas como hash SHA-256.
- Recuperação de senha com link de uso único, válido por 1 hora, e resposta genérica para não revelar quais emails estão cadastrados.
- Upload de imagens valida a assinatura real do arquivo (JPEG, PNG, WebP ou GIF) e limita o tamanho a 5 MB. Na foto de perfil, o limite é 2 MB e GIF não é aceito.
- Imagens substituídas ou de itens excluídos (incluindo a foto de um membro excluído) são apagadas do armazenamento.
- A Política de Privacidade em `/privacidade` detalha cookies, armazenamento local e direitos previstos na LGPD.

## Testes

O backend compila e possui testes automatizados de segurança e regras de negócio:

```bash
cd server
npm test
```

Os testes não precisam de um MySQL em execução.

## Estrutura

```
public/                    Frontend estático (HTML, JS e fontes)
public/js/pages/           Script de cada página (e do painel admin, em admin/)
public/js/lib/             Peças compartilhadas: navbar, sessão, listagens, telefone…
public/css/style.css       Só importa as partes, na ordem da cascata
public/css/partes/         CSS dividido por área (base, componentes, páginas, tema escuro…)
server/src/routes/         Rotas públicas da API
server/src/routes/admin/   Rotas do painel, um arquivo por recurso
server/src/lib/types.ts    Formato das linhas de cada tabela
server/src/migrate.ts      Comando `npm run migrate`
server/migrations/         SQL de criação e atualização do banco
server/tests/              Testes automatizados (node:test)
```

No CSS, a ordem dos `@import` em `style.css` é a ordem da cascata: uma regra nova entra na parte da área dela, e uma parte nova entra na lista no ponto em que precisa vencer as anteriores.
