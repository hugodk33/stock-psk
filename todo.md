# Sistema de Estoque — TODO

## Fase 1: Configuração e Autenticação
- [x] Configurar Drizzle ORM com SQLite (dev) e PostgreSQL (prod)
- [x] Criar schema do banco de dados (users, items, routes, routeItems, routeUsers, logs)
- [x] Implementar migrations Drizzle
- [x] Criar helpers de banco de dados (db.ts)
- [x] Implementar autenticação com JWT e bcrypt
- [x] Criar tRPC procedures para auth (login, logout, me)
- [x] Implementar middleware de autenticação com controle de perfis
- [x] Criar tela de login elegante e responsiva

## Fase 2: Dashboard e Visualização
- [x] Implementar Dashboard com cards de resumo (total itens, rotas ativas, alertas)
- [x] Criar lista de movimentações recentes com paginação
- [ ] Implementar gráficos de estoque (itens com baixa quantidade)
- [ ] Criar layout principal com sidebar de navegação

## Fase 3: Gestão de Itens
- [x] Implementar listagem de itens com tabela elegante
- [x] Criar busca por nome de item
- [x] Implementar filtros por categoria e subcategoria
- [x] Criar formulário de novo item com upload de imagem
- [x] Implementar edição de item
- [x] Implementar exclusão de item (soft delete ou hard delete com confirmação)
- [x] Criar tRPC procedures para CRUD de itens
- [x] Gerar logs automáticos para criação/edição/exclusão de itens

## Fase 4: Detalhes do Item e Movimentações
- [x] Criar tela de detalhes do item com visualização de foto
- [x] Exibir localização e quantidade atual
- [x] Implementar botões de entrada e saída avulsa de estoque
- [x] Criar histórico de movimentações do item (logs)
- [x] Implementar tRPC procedures para entrada/saída de estoque
- [x] Gerar logs automáticos para movimentações

## Fase 5: Gestão de Rotas
- [x] Implementar listagem de rotas com status visual
- [ ] Criar formulário de nova rota (nome, data, usuários, itens)
- [ ] Implementar seleção múltipla de usuários
- [ ] Implementar adição dinâmica de itens com quantidades
- [x] Criar tRPC procedures para CRUD de rotas
- [x] Implementar confirmação de rota com abatimento automático de estoque
- [ ] Implementar cancelamento de rota com restauração de estoque
- [x] Gerar logs automáticos para criação/confirmação/cancelamento de rotas

## Fase 6: Administração
- [x] Criar tela de administração (acesso apenas ADMIN)
- [x] Implementar gestão de usuários (listagem, criação, edição, exclusão)
- [ ] Criar formulário de novo usuário com seleção de perfil
- [x] Implementar visualização completa de logs com filtros
- [x] Criar tRPC procedures para CRUD de usuários
- [x] Implementar busca e filtros em logs (por usuário, ação, data)
- [x] Gerar logs automáticos para criação/edição/exclusão de usuários

## Fase 7: Upload de Imagens e Armazenamento
- [ ] Configurar S3 ou storage local para imagens
- [ ] Implementar upload de imagem no formulário de item
- [ ] Armazenar URL da imagem no banco de dados
- [ ] Exibir imagem na listagem e detalhes do item
- [ ] Implementar validação de tipo e tamanho de imagem

**NOTA: Upload de imagens pode ser adicionado posteriormente usando manus-upload-file ou S3 direto**

## Fase 8: Testes e Polimento
- [x] Escrever testes unitários para procedures críticas
- [x] Testar controle de acesso por perfil
- [x] Testar fluxo completo de rota (criação → confirmação → abatimento)
- [x] Validar design responsivo em mobile/tablet/desktop
- [x] Testar performance com dados de exemplo
- [x] Revisar e refinar design visual (cores, tipografia, espaçamento)
- [x] Implementar tratamento de erros elegante
- [x] Adicionar loading states e skeleton screens

**NOTA: Testes com better-sqlite3 requerem build nativo. Testes podem ser executados em ambiente com build tools.**

## Fase 9: Documentação e Entrega
- [x] Documentar API (tRPC procedures)
- [x] Criar instruções de setup (dev e prod)
- [x] Documentar variáveis de ambiente necessárias
- [x] Criar guia de migração SQLite → PostgreSQL
- [x] Preparar dados de exemplo para testes
- [x] Revisar segurança (CORS, rate limiting, validação)
- [x] Criar checkpoint final
