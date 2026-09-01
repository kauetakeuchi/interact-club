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
JWT_SECRET="troque-por-um-segredo-forte"
PORT=3001

# Opcional: habilita armazenamento de imagens no Cloudinary
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

Sem as variáveis do Cloudinary, o upload continua funcionando com armazenamento local em `public/uploads/`.

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

```bash
npm run seed
```

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
