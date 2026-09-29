# Interact Club

Site oficial do Interact Club - programa juvenil do Rotary International.

## Tecnologias

- **Backend:** Express.js (TypeScript)
- **Frontend:** HTML, CSS, JavaScript (vanilla, sem build)
- **Banco:** MySQL
- **Autenticação:** JWT
- **Upload:** Multer (local)

## Requisitos

- Node.js 18+
- MySQL (XAMPP, WAMP, ou nativo)

## Como rodar localmente

### 1. Configure o banco

O migration cria o banco e as tabelas automaticamente. Basta executar:

```
server/migrations/001_schema.sql
```

> No XAMPP: abra o phpMyAdmin → aba "SQL" → cole o conteúdo do arquivo e execute.
> Se você já tinha um banco com a versão antiga do schema, veja os comandos de atualização no final do arquivo.

### 2. Configure as variáveis de ambiente

Copie `server/.env.example` para `server/.env` e preencha com seus valores:

```env
DATABASE_URL="mysql://root:@localhost:3306/interact_club"
JWT_SECRET=""
PORT=3001
APP_URL="http://localhost:3001"

# Envio do link de confirmação de novos cadastros
EMAIL_PROVIDER="resend"
SMTP_USER="usuario-smtp"
SMTP_PASS="senha-smtp"
SMTP_FROM="Interact Club <contato@exemplo.org>"

# Opcional: habilita armazenamento de imagens no Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Sem as variáveis do Cloudinary, o upload continua funcionando com armazenamento local em `public/uploads/`.

Gere um segredo JWT único antes de iniciar o servidor:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Sem `JWT_SECRET` com pelo menos 32 bytes, o servidor não inicia. Ao trocar esse segredo, todas as sessões existentes precisam entrar novamente.

Novas senhas precisam ter pelo menos 8 caracteres, incluindo uma letra maiúscula, uma minúscula, um número e um caractere especial. A mesma regra vale quando um administrador troca a senha de um membro.

As variáveis de email são necessárias para novos cadastros: a conta só pode entrar depois que o usuário clicar no link recebido. Em produção, defina `APP_URL` com o endereço público do site (por exemplo, `https://interact.exemplo.org`).

Provedores disponíveis:

| `EMAIL_PROVIDER` | `SMTP_USER` | `SMTP_PASS` |
|---|---|---|
| `gmail` | Endereço Gmail completo | Senha de aplicativo do Google |
| `brevo` | Usuário SMTP da Brevo | Chave SMTP da Brevo |
| `resend` | Pode ser omitido (`resend` é usado automaticamente) | Chave de API da Resend |
| `hostinger` | Endereço de email completo | Senha da caixa de email |
| `smtp` | Usuário do serviço, se exigido | Senha do serviço, se exigida |

Nos quatro primeiros casos, servidor, porta e criptografia são preenchidos automaticamente. Para `smtp`, configure também `SMTP_HOST`, `SMTP_PORT` e `SMTP_SECURE`; esses campos também podem substituir o preset de qualquer provedor.

Se o banco já existia antes da verificação de email, execute uma vez:

```
server/migrations/002_email_verification.sql
```

### 3. Instale as dependências

As dependências ficam na pasta `server/`:

```bash
cd server
npm install
```

### 4. Rode

A partir da raiz (os scripts delegam para o server):

```bash
npm run dev
```

Ou direto no server: `npm run dev` dentro de `server/`.

Acesse em http://localhost:3001.

### 5. Dados de demonstração (opcional)

Para popular o banco com contas de acesso e conteúdo de exemplo (notícias, projetos, eventos e avisos):

No PowerShell, habilite explicitamente o seed somente para esta execução local:

```powershell
$env:ALLOW_DEMO_SEED="true"
npm run seed
Remove-Item Env:ALLOW_DEMO_SEED
```

O seed é bloqueado em produção. Nunca publique as contas de demonstração com as senhas abaixo.

O seed é **idempotente** — pode ser rodado várias vezes sem duplicar dados.

Contas criadas:

| Perfil | Email | Senha |
|---|---|---|
| Admin | admin@interactclub.com | admin123 |
| Diretora | diretora@interactclub.com | diretora123 |
| Membro | membro@interactclub.com | membro123 |

> Troque as senhas após os primeiros acessos.

Ou promova um usuário manualmente no banco:

```sql
UPDATE user SET role = 'ADMIN' WHERE email = 'seu-email@exemplo.com';
```
