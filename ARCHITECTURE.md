# Arquitetura e Design System — Sistema de Estoque Elegante

## 1. Stack Tecnológica

O projeto utiliza uma stack moderna e sofisticada para garantir performance, elegância visual e manutenibilidade:

| Componente | Tecnologia | Justificativa |
|---|---|---|
| **Framework** | Next.js (App Router) + React 19 | Front-end e back-end integrados, renderização otimizada |
| **Linguagem** | TypeScript | Type safety e previsibilidade do código |
| **Estilização** | Tailwind CSS 4 + shadcn/ui | Design system consistente e componentes acessíveis |
| **ORM** | Drizzle ORM | Queries type-safe, migrations versionadas |
| **Banco de Dados** | SQLite (dev) → PostgreSQL (prod) | Desenvolvimento local rápido, produção robusta |
| **Autenticação** | Credentials Provider (JWT) | Controle fino de sessão e perfis de acesso |
| **RPC** | tRPC | Type-safe procedures, sem REST boilerplate |

## 2. Modelagem do Banco de Dados

### Tabelas Principais

#### `users` — Usuários do Sistema
Armazena informações de autenticação e controle de acesso.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `name` | String | Nome completo |
| `phone` | String | Telefone para contato |
| `username` | String (Único) | Login do usuário |
| `password` | String | Hash bcrypt da senha |
| `role` | Enum: ADMIN \| MANAGER \| WORKER | Nível de acesso |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

#### `items` — Itens de Manutenção
Catálogo de peças e equipamentos do armazém.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `name` | String | Nome do item |
| `imageUrl` | String (Opcional) | URL da imagem no S3 |
| `category` | String | Categoria (ex: "Parafusos", "Ferramentas") |
| `subcategory` | String | Subcategoria (ex: "M8", "Lixadeiras Orbitais") |
| `quantity` | Int | Quantidade em estoque |
| `minQuantity` | Int | Quantidade mínima para alerta |
| `location` | String | Localização (ex: "A-12", "Corredor B") |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

#### `routes` — Rotas de Despacho
Representa despachos e movimentações planejadas.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `name` | String | Nome da rota (ex: "Manutenção Preventiva Setor B") |
| `scheduledDate` | DateTime | Data/hora do despacho |
| `status` | Enum: PENDING \| IN_PROGRESS \| COMPLETED \| CANCELLED | Estado da rota |
| `createdBy` | UUID (FK: users) | Usuário que criou a rota |
| `createdAt` | DateTime | Data de criação |
| `updatedAt` | DateTime | Última atualização |

#### `routeItems` — Itens Alocados em Rotas
Relacionamento N:M entre rotas e itens (com quantidade alocada).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `routeId` | UUID (FK: routes) | Referência à rota |
| `itemId` | UUID (FK: items) | Referência ao item |
| `quantity` | Int | Quantidade alocada para esta rota |

#### `routeUsers` — Usuários Atribuídos a Rotas
Relacionamento N:M entre rotas e usuários (técnicos/operadores).

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `routeId` | UUID (FK: routes) | Referência à rota |
| `userId` | UUID (FK: users) | Referência ao usuário |

#### `logs` — Histórico de Ações
Rastreamento automático de todas as operações relevantes.

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único |
| `userId` | UUID (FK: users) | Usuário que realizou a ação |
| `action` | Enum | Tipo de ação (ITEM_CREATED, ITEM_UPDATED, ITEM_DELETED, STOCK_IN, STOCK_OUT, ROUTE_CREATED, ROUTE_CONFIRMED, ROUTE_CANCELLED, USER_CREATED, USER_UPDATED, USER_DELETED) |
| `description` | String | Descrição legível da ação |
| `itemId` | UUID (FK: items, Opcional) | Item afetado (se aplicável) |
| `routeId` | UUID (FK: routes, Opcional) | Rota afetada (se aplicável) |
| `metadata` | JSON (Opcional) | Dados adicionais (ex: quantidade anterior/nova) |
| `createdAt` | DateTime | Timestamp da ação |

## 3. Controle de Acesso por Perfil

O sistema implementa três níveis de acesso com permissões rigorosamente segregadas:

### ADMIN
- Acesso total ao sistema
- Criar, editar, excluir usuários
- Visualizar todos os logs
- Criar, editar, excluir itens
- Criar, editar, cancelar rotas
- Entrada e saída de estoque

### MANAGER
- Criar, editar, excluir itens
- Criar, editar, cancelar rotas
- Entrada e saída de estoque
- Visualizar logs de itens e rotas (não de usuários)
- Não pode gerenciar usuários

### WORKER
- Visualizar itens e rotas
- Entrada e saída de estoque (apenas itens avulsos)
- Não pode criar/editar rotas
- Visualizar apenas logs de suas próprias ações

## 4. Design System Elegante

### Paleta de Cores

A paleta segue princípios de sofisticação e clareza visual:

| Uso | Cor | Código | Descrição |
|---|---|---|---|
| **Background Principal** | Branco/Cinza 50 | `#FAFAFA` | Fundo limpo e minimalista |
| **Foreground (Texto)** | Cinza 900 | `#111827` | Texto principal com alto contraste |
| **Accent Primário** | Azul Profundo | `#0F172A` | Ações principais e destaques |
| **Accent Secundário** | Azul Claro | `#3B82F6` | Links e elementos interativos |
| **Sucesso** | Verde | `#10B981` | Confirmações, rotas completadas |
| **Alerta** | Âmbar | `#F59E0B` | Estoque baixo, avisos |
| **Erro** | Vermelho | `#EF4444` | Erros, ações destrutivas |
| **Border** | Cinza 200 | `#E5E7EB` | Separadores, bordas sutis |
| **Hover** | Cinza 100 | `#F3F4F6` | Estados hover em elementos |

### Tipografia

| Elemento | Font | Tamanho | Peso | Uso |
|---|---|---|---|---|
| **Heading 1** | Inter | 32px | 700 | Títulos de página |
| **Heading 2** | Inter | 24px | 600 | Subtítulos principais |
| **Heading 3** | Inter | 18px | 600 | Títulos de seção |
| **Body** | Inter | 14px | 400 | Texto principal |
| **Small** | Inter | 12px | 400 | Labels, captions |
| **Code** | Fira Code | 13px | 400 | Conteúdo técnico |

### Espaçamento e Layout

- **Padding padrão:** 16px (componentes), 24px (seções)
- **Gap entre elementos:** 12px (compacto), 16px (padrão), 24px (espaçoso)
- **Border radius:** 8px (componentes), 12px (cards)
- **Sombra sutil:** `0 1px 3px rgba(0,0,0,0.1)` (cards), `0 4px 12px rgba(0,0,0,0.15)` (modais)

### Componentes Principais

Todos os componentes utilizam **shadcn/ui** para garantir consistência e acessibilidade:

- **Button:** Variantes `default`, `outline`, `ghost`, `destructive`
- **Card:** Container com sombra sutil e padding padrão
- **Input:** Com labels integrados e validação visual
- **Select:** Dropdown com busca e ícones
- **Table:** Com zebra striping, sorting e paginação
- **Dialog:** Modal elegante com overlay
- **Toast:** Notificações não-intrusivas no canto inferior direito
- **Skeleton:** Placeholders de carregamento

## 5. Fluxos Principais

### Autenticação e Sessão
1. Usuário acessa `/login` com username e password
2. Backend valida credenciais e gera JWT
3. JWT armazenado em cookie seguro (httpOnly, secure, sameSite)
4. Middleware valida token em cada requisição
5. Acesso negado se perfil não tem permissão

### Gestão de Itens
1. ADMIN/MANAGER acessa `/items`
2. Listagem com busca e filtros por categoria/subcategoria
3. Clique em item → `/items/[id]` com detalhes e histórico
4. Botão "Novo Item" → formulário com upload de imagem
5. Imagem enviada para S3, URL armazenada no banco
6. Log automático: `ITEM_CREATED` ou `ITEM_UPDATED`

### Movimentação Avulsa de Estoque
1. Usuário em `/items/[id]` clica "Entrada" ou "Saída"
2. Dialog solicita quantidade
3. Backend atualiza `items.quantity` e cria log com metadata
4. Log registra: quantidade anterior, nova, usuário, timestamp

### Gestão de Rotas
1. ADMIN/MANAGER acessa `/routes`
2. Clica "Nova Rota" → formulário com:
   - Nome da rota
   - Data/hora do despacho
   - Seleção de usuários (WORKER ou MANAGER)
   - Adição de itens com quantidades
3. Ao confirmar, rota criada com status `PENDING`
4. Log: `ROUTE_CREATED`
5. Quando rota é confirmada/despachada:
   - Status muda para `IN_PROGRESS`
   - Estoque de cada item é abatido
   - Log: `ROUTE_CONFIRMED` com metadata de itens abatidos
6. Rota pode ser cancelada (status `CANCELLED`) → estoque restaurado

### Logs Automáticos
Cada ação relevante gera log com:
- `userId`: Quem fez
- `action`: Tipo de ação (enum)
- `description`: Texto legível
- `metadata`: JSON com dados adicionais
- `createdAt`: Timestamp UTC

## 6. Estrutura de Pastas do Projeto

```
inventory-system/
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Items.tsx
│   │   │   ├── ItemDetail.tsx
│   │   │   ├── Routes.tsx
│   │   │   ├── Admin.tsx
│   │   │   └── NotFound.tsx
│   │   ├── components/
│   │   │   ├── Layout/
│   │   │   ├── Forms/
│   │   │   └── ui/ (shadcn/ui)
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useItems.ts
│   │   │   └── useRoutes.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   └── index.html
├── server/
│   ├── routers/
│   │   ├── auth.ts
│   │   ├── items.ts
│   │   ├── routes.ts
│   │   ├── users.ts
│   │   ├── logs.ts
│   │   └── index.ts
│   ├── db.ts
│   ├── middleware.ts
│   └── index.ts
├── drizzle/
│   ├── schema.ts
│   └── migrations/
├── shared/
│   ├── types.ts
│   └── constants.ts
├── package.json
└── tsconfig.json
```

## 7. Segurança e Boas Práticas

- **Senhas:** Hashed com bcrypt (salt rounds: 12)
- **JWT:** Assinado com secret robusto, expiração de 24h
- **CORS:** Configurado para origem do frontend
- **Rate Limiting:** Proteção contra brute force no login
- **SQL Injection:** Prevenida via Drizzle ORM (prepared statements)
- **XSS:** Mitigada via React sanitization e CSP headers
- **CSRF:** Token validado em mutações críticas
- **Logs:** Imutáveis, armazenados em ordem cronológica
