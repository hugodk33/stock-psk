import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';

const db = new Database('inventory.db');

// Habilita foreign keys
db.pragma('foreign_keys = ON');

// Cria as tabelas
const schema = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'WORKER',
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  imageUrl TEXT,
  category TEXT NOT NULL,
  subcategory TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  minQuantity INTEGER NOT NULL DEFAULT 5,
  location TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  scheduledDate INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING',
  createdBy TEXT NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  FOREIGN KEY (createdBy) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS routeItems (
  id TEXT PRIMARY KEY,
  routeId TEXT NOT NULL,
  itemId TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  PRIMARY KEY (routeId, itemId),
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (itemId) REFERENCES items(id)
);

CREATE TABLE IF NOT EXISTS routeUsers (
  id TEXT PRIMARY KEY,
  routeId TEXT NOT NULL,
  userId TEXT NOT NULL,
  PRIMARY KEY (routeId, userId),
  FOREIGN KEY (routeId) REFERENCES routes(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS logs (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  itemId TEXT,
  routeId TEXT,
  metadata TEXT,
  createdAt INTEGER NOT NULL,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (itemId) REFERENCES items(id),
  FOREIGN KEY (routeId) REFERENCES routes(id)
);
`;

const statements = schema.split(';').filter(s => s.trim());
statements.forEach(stmt => {
  try {
    db.exec(stmt);
  } catch (e) {
    console.log('Table already exists or error:', e.message);
  }
});

// Cria usuários de teste
const now = Date.now();
const adminPassword = await bcrypt.hash('admin123', 12);
const managerPassword = await bcrypt.hash('manager123', 12);
const workerPassword = await bcrypt.hash('worker123', 12);

const insertUser = db.prepare(`
  INSERT OR REPLACE INTO users (id, name, phone, username, password, role, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertUser.run('user-1', 'Admin User', '11999999999', 'admin', adminPassword, 'ADMIN', now, now);
insertUser.run('user-2', 'Manager User', '11988888888', 'manager', managerPassword, 'MANAGER', now, now);
insertUser.run('user-3', 'Worker User', '11977777777', 'worker', workerPassword, 'WORKER', now, now);

// Cria itens de exemplo
const insertItem = db.prepare(`
  INSERT OR REPLACE INTO items (id, name, imageUrl, category, subcategory, quantity, minQuantity, location, createdAt, updatedAt)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

insertItem.run('item-1', 'Parafuso M8', null, 'Parafusos', 'M8', 150, 50, 'A-01', now, now);
insertItem.run('item-2', 'Parafuso M10', null, 'Parafusos', 'M10', 30, 50, 'A-02', now, now);
insertItem.run('item-3', 'Lixadeira Orbital', null, 'Ferramentas', 'Lixadeiras', 5, 2, 'B-01', now, now);
insertItem.run('item-4', 'Furadeira de Impacto', null, 'Ferramentas', 'Furadeiras', 3, 2, 'B-02', now, now);
insertItem.run('item-5', 'Pneu 10 polegadas', null, 'Pneus', 'Pneus Pequenos', 20, 10, 'C-01', now, now);

console.log('✓ Banco de dados inicializado com sucesso!');
console.log('✓ Usuários criados:');
console.log('  - admin / admin123 (ADMIN)');
console.log('  - manager / manager123 (MANAGER)');
console.log('  - worker / worker123 (WORKER)');
console.log('✓ 5 itens de exemplo criados');

db.close();
