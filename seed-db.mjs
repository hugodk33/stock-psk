import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcrypt';

const { Pool } = pg;

const raw = process.env.DATABASE_URL || process.env.DB_STRING || '';
function parseDbString(str) {
  const parts = str.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim().toLowerCase();
      const val = part.slice(idx + 1).trim();
      acc[key] = val;
    }
    return acc;
  }, {});
  const password = encodeURIComponent(parts['password'] || '');
  return `postgresql://${parts['user id'] || parts['user']}:${password}@${parts['server'] || parts['host']}:${parts['port'] || 5432}/${parts['database'] || parts['db']}`;
}

const connectionString = raw.startsWith('postgresql://') || raw.startsWith('postgres://')
  ? raw
  : parseDbString(raw);

const pool = new Pool({ connectionString });

try {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'WORKER',
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      "imageUrl" TEXT,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      quantity INTEGER NOT NULL DEFAULT 0,
      "minQuantity" INTEGER NOT NULL DEFAULT 5,
      location TEXT NOT NULL,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS logs (
      id TEXT PRIMARY KEY,
      "userId" TEXT NOT NULL,
      action TEXT NOT NULL,
      description TEXT NOT NULL,
      "itemId" TEXT,
      metadata TEXT,
      "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
      FOREIGN KEY ("userId") REFERENCES users(id),
      FOREIGN KEY ("itemId") REFERENCES items(id)
    );
  `;

  // Create tables
  await pool.query(schema);

  const now = new Date().toISOString();
  const adminPassword = await bcrypt.hash('admin123', 12);
  const managerPassword = await bcrypt.hash('manager123', 12);
  const workerPassword = await bcrypt.hash('worker123', 12);

  const users = [
    { id: 'user-1', name: 'Admin User', phone: '11999999999', username: 'admin', password: adminPassword, role: 'ADMIN' },
    { id: 'user-2', name: 'Manager User', phone: '11988888888', username: 'manager', password: managerPassword, role: 'MANAGER' },
    { id: 'user-3', name: 'Worker User', phone: '11977777777', username: 'worker', password: workerPassword, role: 'WORKER' },
  ];

  const insertUser = `
    INSERT INTO users (id, name, phone, username, password, role, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, phone = EXCLUDED.phone, password = EXCLUDED.password, role = EXCLUDED.role, "updatedAt" = EXCLUDED."updatedAt"
  `;

  for (const u of users) {
    await pool.query(insertUser, [u.id, u.name, u.phone, u.username, u.password, u.role, now, now]);
  }

  const itemsData = [
    { id: 'item-1', name: 'Parafuso M8', imageUrl: null, category: 'Parafusos', subcategory: 'M8', quantity: 150, minQuantity: 50, location: 'A-01' },
    { id: 'item-2', name: 'Parafuso M10', imageUrl: null, category: 'Parafusos', subcategory: 'M10', quantity: 30, minQuantity: 50, location: 'A-02' },
    { id: 'item-3', name: 'Lixadeira Orbital', imageUrl: null, category: 'Ferramentas', subcategory: 'Lixadeiras', quantity: 5, minQuantity: 2, location: 'B-01' },
    { id: 'item-4', name: 'Furadeira de Impacto', imageUrl: null, category: 'Ferramentas', subcategory: 'Furadeiras', quantity: 3, minQuantity: 2, location: 'B-02' },
    { id: 'item-5', name: 'Pneu 10 polegadas', imageUrl: null, category: 'Pneus', subcategory: 'Pneus Pequenos', quantity: 20, minQuantity: 10, location: 'C-01' },
  ];

  const insertItem = `
    INSERT INTO items (id, name, "imageUrl", category, subcategory, quantity, "minQuantity", location, "createdAt", "updatedAt")
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, quantity = EXCLUDED.quantity, "minQuantity" = EXCLUDED."minQuantity", location = EXCLUDED.location, "updatedAt" = EXCLUDED."updatedAt"
  `;

  for (const item of itemsData) {
    await pool.query(insertItem, [item.id, item.name, item.imageUrl, item.category, item.subcategory, item.quantity, item.minQuantity, item.location, now, now]);
  }

  console.log('✓ Banco de dados PostgreSQL inicializado com sucesso!');
  console.log('✓ Usuários criados:');
  console.log('  - admin / admin123 (ADMIN)');
  console.log('  - manager / manager123 (MANAGER)');
  console.log('  - worker / worker123 (WORKER)');
  console.log('✓ 5 itens de exemplo criados');

} catch (err) {
  console.error('Erro ao inicializar seed:', err);
  process.exit(1);
} finally {
  await pool.end();
}
