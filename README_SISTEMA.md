# Sistema de Estoque — Documentação Completa

## 📋 Visão Geral

Sistema elegante e sofisticado de gerenciamento de estoque para armazém de itens de manutenção (parafusos, ferramentas, equipamentos, etc.). Construído com **Next.js + tRPC + SQLite** (desenvolvimento) com suporte a **PostgreSQL** em produção.

## 🎯 Funcionalidades Principais

### Autenticação e Controle de Acesso
- **Login local** com usuário e senha
- **3 perfis de acesso**:
  - **ADMIN**: Acesso total ao sistema, gerenciamento de usuários e logs
  - **MANAGER**: Criação/edição de itens e rotas, confirmação de despachos
  - **WORKER**: Visualização de itens, entrada/saída avulsa de estoque

### Gestão de Itens
- Listagem com busca por nome
- Filtros por categoria e subcategoria
- Criação, edição e exclusão de itens
- Campos: nome, categoria, subcategoria, quantidade, quantidade mínima, localização
- Alertas automáticos de estoque baixo

### Detalhes do Item
- Visualização de informações completas
- Movimentações avulsas (entrada/saída de estoque)
- Histórico de todas as movimentações com timestamps

### Gestão de Rotas/Despachos
- Listagem de rotas com status visual
- Criação de rotas com seleção de usuários e itens
- Confirmação de rota com **abatimento automático de estoque**
- Cancelamento de rota com **restauração de estoque**
- Status: PENDING, IN_PROGRESS, COMPLETED, CANCELLED

### Dashboard
- Cards de resumo: total de itens, rotas ativas, alertas de estoque baixo
- Lista de movimentações recentes (últimas 10)
- Visualização rápida do status do estoque

### Administração (ADMIN only)
- Gestão de usuários: listagem, criação, exclusão
- Visualização completa de logs do sistema
- Filtros por descrição de ação
- Rastreabilidade total de todas as operações

### Logging Automático
Todas as ações geram logs automáticos:
- Criação/edição/exclusão de itens
- Entrada/saída de estoque
- Criação/confirmação/cancelamento de rotas
- Criação/edição/exclusão de usuários

## 🏗️ Arquitetura

### Stack Tecnológico
- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui
- **Backend**: Express 4 + tRPC 11
- **Banco de Dados**: SQLite (dev) / PostgreSQL (prod)
- **Autenticação**: JWT + bcrypt
- **Build**: Vite + TypeScript

### Estrutura de Pastas
```
inventory-system/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas/telas
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários (tRPC client)
│   │   └── App.tsx           # Roteamento
│   └── index.html
├── server/                    # Backend Express + tRPC
│   ├── routers.ts            # Procedures tRPC
│   ├── db.ts                 # Helpers de banco de dados
│   ├── auth.ts               # Autenticação local
│   └── _core/                # Infraestrutura tRPC
├── drizzle/                   # Schema do banco (não usado em produção)
├── inventory.db              # Banco SQLite local
└── package.json
```

## 🚀 Setup e Execução

### Pré-requisitos
- Node.js 22.13.0+
- pnpm 10.4.1+

### Desenvolvimento Local

1. **Instalar dependências**
```bash
cd /home/ubuntu/inventory-system
pnpm install
```

2. **Iniciar servidor de desenvolvimento**
```bash
pnpm dev
```

O servidor estará disponível em `http://localhost:3000`

3. **Credenciais de Teste**
```
Usuário: admin
Senha: admin123
Perfil: ADMIN

Usuário: manager
Senha: manager123
Perfil: MANAGER

Usuário: worker
Senha: worker123
Perfil: WORKER
```

### Build para Produção

```bash
pnpm build
pnpm start
```

## 📊 Banco de Dados

### Tabelas SQLite

#### users
```sql
- id (TEXT, PK)
- name (TEXT)
- phone (TEXT)
- username (TEXT, UNIQUE)
- password (TEXT, hashed)
- role (TEXT: ADMIN, MANAGER, WORKER)
- createdAt (INTEGER, timestamp)
- updatedAt (INTEGER, timestamp)
```

#### items
```sql
- id (TEXT, PK)
- name (TEXT)
- imageUrl (TEXT, nullable)
- category (TEXT)
- subcategory (TEXT)
- quantity (INTEGER)
- minQuantity (INTEGER)
- location (TEXT)
- createdAt (INTEGER, timestamp)
- updatedAt (INTEGER, timestamp)
```

#### routes
```sql
- id (TEXT, PK)
- name (TEXT)
- scheduledDate (INTEGER, timestamp)
- status (TEXT: PENDING, IN_PROGRESS, COMPLETED, CANCELLED)
- createdBy (TEXT, FK → users.id)
- createdAt (INTEGER, timestamp)
- updatedAt (INTEGER, timestamp)
```

#### routeItems
```sql
- routeId (TEXT, FK → routes.id)
- itemId (TEXT, FK → items.id)
- quantity (INTEGER)
- PRIMARY KEY (routeId, itemId)
```

#### routeUsers
```sql
- routeId (TEXT, FK → routes.id)
- userId (TEXT, FK → users.id)
- PRIMARY KEY (routeId, userId)
```

#### logs
```sql
- id (TEXT, PK)
- userId (TEXT, FK → users.id)
- action (TEXT)
- description (TEXT)
- itemId (TEXT, FK → items.id, nullable)
- routeId (TEXT, FK → routes.id, nullable)
- metadata (TEXT, JSON, nullable)
- createdAt (INTEGER, timestamp)
```

### Migração SQLite → PostgreSQL

Para usar PostgreSQL em produção:

1. **Instalar driver PostgreSQL**
```bash
pnpm add pg
```

2. **Atualizar DATABASE_URL**
```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/inventory"
```

3. **Criar tabelas no PostgreSQL** (executar SQL similar ao SQLite, adaptando tipos)

4. **Migrar dados** (usando ferramentas como pgloader ou scripts custom)

## 🔌 API tRPC Procedures

### Autenticação (`auth`)
- `login(username, password)` → `{ token, user }`
- `me()` → `{ user }` ou `null`

### Itens (`items`)
- `list()` → `Item[]`
- `getById(id)` → `Item | null`
- `create(data)` → `Item`
- `update(id, data)` → `Item`
- `delete(id)` → `{ success: boolean }`
- `addStock(itemId, quantity)` → `Item` (com log automático)
- `removeStock(itemId, quantity)` → `Item` (com log automático)

### Rotas (`routes`)
- `list()` → `Route[]`
- `getById(id)` → `Route | null`
- `create(data)` → `Route`
- `confirm(id)` → `Route` (abate estoque automaticamente)
- `cancel(id)` → `Route` (restaura estoque)

### Usuários (`users`)
- `list()` → `User[]` (ADMIN only)
- `create(data)` → `User` (ADMIN only)
- `delete(id)` → `{ success: boolean }` (ADMIN only)

### Logs (`logs`)
- `list(filters?)` → `Log[]`
  - Filtros: `itemId`, `userId`, `action`, `limit`

## 🎨 Design e UX

### Paleta de Cores
- **Primária**: Slate 900 (navegação, botões principais)
- **Secundária**: Slate 50-100 (backgrounds)
- **Sucesso**: Green (estoque normal, confirmação)
- **Alerta**: Yellow (pendente)
- **Erro**: Red (estoque baixo, cancelamento)

### Tipografia
- **Headings**: Fonte sans-serif, pesos 600-700
- **Body**: Fonte sans-serif, peso 400
- **Monospace**: Para IDs e dados técnicos

### Responsividade
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px)
- Tabelas com scroll horizontal em mobile

## 🔒 Segurança

### Implementado
- ✅ Autenticação JWT com expiração
- ✅ Senhas hasheadas com bcrypt (salt rounds: 12)
- ✅ Controle de acesso por perfil em procedures tRPC
- ✅ Validação de entrada em todas as mutations
- ✅ Logging de todas as ações para auditoria

### Recomendações Futuras
- [ ] Rate limiting em endpoints
- [ ] CORS configurado para domínios específicos
- [ ] Refresh tokens com rotação
- [ ] 2FA para usuários ADMIN
- [ ] Encriptação de dados sensíveis em repouso

## 📝 Variáveis de Ambiente

### Desenvolvimento
```bash
DATABASE_URL=sqlite:./inventory.db
JWT_SECRET=seu_segredo_jwt_aqui
NODE_ENV=development
```

### Produção
```bash
DATABASE_URL=postgresql://user:password@host:5432/inventory
JWT_SECRET=segredo_forte_aleatorio
NODE_ENV=production
```

## 🧪 Testes

Testes unitários para procedures críticas estão em `server/items.test.ts`:

```bash
pnpm test
```

**Nota**: Testes requerem build nativo de `better-sqlite3`. Se houver erro, instale build tools:
```bash
sudo apt-get install build-essential python3
pnpm rebuild better-sqlite3
```

## 📦 Deployment

### Opção 1: Manus (Recomendado)
O projeto está configurado para deploy no Manus. Use o botão "Publish" na UI.

### Opção 2: Heroku
```bash
git push heroku main
```

### Opção 3: Self-hosted
```bash
pnpm build
pnpm start
```

## 🐛 Troubleshooting

### Erro: "Cannot find module 'better-sqlite3'"
```bash
pnpm rebuild better-sqlite3
```

### Erro: "Database connection failed"
Verifique se `inventory.db` existe e tem permissões de leitura/escrita:
```bash
ls -la inventory.db
chmod 644 inventory.db
```

### Erro: "JWT token expired"
Faça login novamente. Tokens expiram após 24 horas.

## 📚 Referências

- [tRPC Documentation](https://trpc.io)
- [Tailwind CSS](https://tailwindcss.com)
- [shadcn/ui](https://ui.shadcn.com)
- [SQLite](https://www.sqlite.org)
- [PostgreSQL](https://www.postgresql.org)

## 📄 Licença

MIT

## 👤 Autor

Sistema desenvolvido com ❤️ para gerenciamento eficiente de estoque.

---

**Versão**: 1.0.0  
**Última atualização**: 2026-06-08
