import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const db = new Database(join(__dirname, 'royal_quads.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run migrations safely
const migrations = [
  'ALTER TABLE quads ADD COLUMN imageUrl TEXT',
  'ALTER TABLE quads ADD COLUMN imei TEXT',
  'ALTER TABLE bookings ADD COLUMN rating INTEGER',
  'ALTER TABLE bookings ADD COLUMN feedback TEXT',
];
migrations.forEach(sql => { try { db.exec(sql); } catch { /* column already exists */ } });

// Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS quads (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    name      TEXT    NOT NULL,
    status    TEXT    NOT NULL DEFAULT 'available' CHECK(status IN ('available','rented','maintenance')),
    imageUrl  TEXT,
    imei      TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id       INTEGER PRIMARY KEY AUTOINCREMENT,
    name     TEXT NOT NULL,
    phone    TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role     TEXT NOT NULL DEFAULT 'user' CHECK(role IN ('user','admin'))
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    code               TEXT    NOT NULL UNIQUE,
    discountPercentage INTEGER NOT NULL CHECK(discountPercentage BETWEEN 1 AND 100),
    isActive           INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1))
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    quadId        INTEGER NOT NULL REFERENCES quads(id),
    userId        INTEGER REFERENCES users(id),
    customerName  TEXT    NOT NULL,
    customerPhone TEXT    NOT NULL,
    duration      INTEGER NOT NULL CHECK(duration > 0),
    price         INTEGER NOT NULL CHECK(price >= 0),
    originalPrice INTEGER NOT NULL CHECK(originalPrice >= 0),
    promoCode     TEXT,
    startTime     TEXT    NOT NULL,
    endTime       TEXT,
    status        TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','completed')),
    receiptId     TEXT    UNIQUE,
    rating        INTEGER CHECK(rating BETWEEN 1 AND 5),
    feedback      TEXT
  );

  INSERT INTO quads (name) SELECT 'Quad 1' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name='Quad 1');
  INSERT INTO quads (name) SELECT 'Quad 2' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name='Quad 2');
  INSERT INTO quads (name) SELECT 'Quad 3' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name='Quad 3');
  INSERT INTO quads (name) SELECT 'Quad 4' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name='Quad 4');
  INSERT INTO quads (name) SELECT 'Quad 5' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name='Quad 5');
`);

// ─── Helpers ─────────────────────────────────────────────────────────────────
const VALID_STATUSES = ['available', 'rented', 'maintenance'] as const;

function validatePhone(phone: string): boolean {
  return /^0[17]\d{8}$/.test(phone.replace(/\s/g, ''));
}

// ─── Server ───────────────────────────────────────────────────────────────────
async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '1mb' }));

  // ── Quads ──
  app.get('/api/quads', (_req, res) => {
    res.json(db.prepare('SELECT * FROM quads ORDER BY id').all());
  });

  app.post('/api/quads', (req: Request, res: Response) => {
    const { name, imageUrl, imei } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' }) as unknown as void;
    const result = db.prepare('INSERT INTO quads (name, imageUrl, imei) VALUES (?, ?, ?)')
      .run(name.trim(), imageUrl || null, imei || null);
    res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), status: 'available', imageUrl: imageUrl || null, imei: imei || null });
  });

  app.put('/api/quads/:id', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { name, status, imageUrl, imei } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' }) as unknown as void;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' }) as unknown as void;
    db.prepare('UPDATE quads SET name=?, status=?, imageUrl=?, imei=? WHERE id=?')
      .run(name.trim(), status, imageUrl || null, imei || null, id);
    res.json({ success: true });
  });

  app.put('/api/quads/:id/status', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' }) as unknown as void;
    db.prepare('UPDATE quads SET status=? WHERE id=?').run(status, id);
    res.json({ success: true, status });
  });

  // ── Bookings ──
  app.post('/api/bookings', (req: Request, res: Response) => {
    const { quadId, customerName, customerPhone, duration, price, originalPrice, promoCode, userId } = req.body;

    if (!customerName?.trim()) return res.status(400).json({ error: 'Customer name is required' }) as unknown as void;
    if (!validatePhone(customerPhone)) return res.status(400).json({ error: 'Invalid phone number' }) as unknown as void;
    if (!duration || duration < 1) return res.status(400).json({ error: 'Invalid duration' }) as unknown as void;
    if (price < 0 || originalPrice < 0) return res.status(400).json({ error: 'Invalid price' }) as unknown as void;

    const quad = db.prepare('SELECT status FROM quads WHERE id=?').get(quadId) as { status: string } | undefined;
    if (!quad) return res.status(404).json({ error: 'Quad not found' }) as unknown as void;
    if (quad.status !== 'available') return res.status(400).json({ error: 'Quad is not available' }) as unknown as void;

    const startTime = new Date().toISOString();
    const receiptId = 'RQ-' + Math.random().toString(36).slice(2, 8).toUpperCase();

    const result = db.prepare(`
      INSERT INTO bookings (quadId, userId, customerName, customerPhone, duration, price, originalPrice, promoCode, startTime, receiptId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(quadId, userId ?? null, customerName.trim(), customerPhone.replace(/\s/g, ''), duration, price, originalPrice ?? price, promoCode ?? null, startTime, receiptId);

    db.prepare('UPDATE quads SET status=? WHERE id=?').run('rented', quadId);

    res.status(201).json({ id: result.lastInsertRowid, receiptId, startTime });
  });

  app.post('/api/bookings/:id/complete', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const booking = db.prepare('SELECT quadId, status FROM bookings WHERE id=?').get(id) as { quadId: number; status: string } | undefined;
    if (!booking) return res.status(404).json({ error: 'Booking not found' }) as unknown as void;
    if (booking.status === 'completed') return res.status(400).json({ error: 'Already completed' }) as unknown as void;

    const endTime = new Date().toISOString();
    db.prepare('UPDATE bookings SET status=?, endTime=? WHERE id=?').run('completed', endTime, id);
    db.prepare('UPDATE quads SET status=? WHERE id=?').run('available', booking.quadId);
    res.json({ success: true, endTime });
  });

  app.get('/api/bookings/active', (_req, res) => {
    res.json(db.prepare(`
      SELECT b.*, q.name AS quadName, q.imageUrl AS quadImageUrl, q.imei AS quadImei
      FROM bookings b JOIN quads q ON b.quadId = q.id
      WHERE b.status = 'active'
      ORDER BY b.startTime DESC
    `).all());
  });

  app.get('/api/bookings/history', (_req, res) => {
    res.json(db.prepare(`
      SELECT b.*, q.name AS quadName
      FROM bookings b JOIN quads q ON b.quadId = q.id
      WHERE b.status = 'completed'
      ORDER BY b.endTime DESC
    `).all());
  });

  app.post('/api/bookings/:id/feedback', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { rating, feedback } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ error: 'Rating must be 1–5' }) as unknown as void;
    db.prepare('UPDATE bookings SET rating=?, feedback=? WHERE id=?').run(rating, feedback ?? null, id);
    res.json({ success: true });
  });

  // ── Sales ──
  app.get('/api/sales', (_req, res) => {
    const total  = (db.prepare("SELECT COALESCE(SUM(price),0) AS v FROM bookings WHERE status='completed'").get() as { v: number }).v;
    const today  = (db.prepare("SELECT COALESCE(SUM(price),0) AS v FROM bookings WHERE status='completed' AND date(endTime)=date('now')").get() as { v: number }).v;
    res.json({ total, today });
  });

  // ── Users ──
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { name, phone, password } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' }) as unknown as void;
    if (!validatePhone(phone)) return res.status(400).json({ error: 'Invalid phone number' }) as unknown as void;
    if (!password || password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' }) as unknown as void;
    try {
      const result = db.prepare('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)').run(name.trim(), phone, password);
      res.status(201).json({ id: result.lastInsertRowid, name: name.trim(), phone, role: 'user' });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') res.status(409).json({ error: 'Phone number already registered' });
      else res.status(500).json({ error: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ error: 'Phone and password are required' }) as unknown as void;
    const user = db.prepare('SELECT id, name, phone, role FROM users WHERE phone=? AND password=?').get(phone, password);
    if (user) res.json(user);
    else res.status(401).json({ error: 'Invalid phone number or password' });
  });

  app.get('/api/users/:id/history', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    res.json(db.prepare(`
      SELECT b.*, q.name AS quadName
      FROM bookings b JOIN quads q ON b.quadId = q.id
      WHERE b.userId=? ORDER BY b.id DESC
    `).all(id));
  });

  // ── Promotions ──
  app.get('/api/promotions', (_req, res) => {
    res.json(db.prepare('SELECT * FROM promotions ORDER BY id DESC').all());
  });

  app.post('/api/promotions', (req: Request, res: Response) => {
    const { code, discountPercentage } = req.body;
    if (!code?.trim()) return res.status(400).json({ error: 'Code is required' }) as unknown as void;
    if (!discountPercentage || discountPercentage < 1 || discountPercentage > 100)
      return res.status(400).json({ error: 'Discount must be 1–100%' }) as unknown as void;
    try {
      const result = db.prepare('INSERT INTO promotions (code, discountPercentage) VALUES (?, ?)')
        .run(code.toUpperCase().trim(), discountPercentage);
      res.status(201).json({ id: result.lastInsertRowid, code: code.toUpperCase().trim(), discountPercentage, isActive: 1 });
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e.code === 'SQLITE_CONSTRAINT_UNIQUE') res.status(409).json({ error: 'Promo code already exists' });
      else res.status(500).json({ error: 'Failed to create promotion' });
    }
  });

  app.post('/api/promotions/:id/toggle', (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { isActive } = req.body;
    db.prepare('UPDATE promotions SET isActive=? WHERE id=?').run(isActive ? 1 : 0, id);
    res.json({ success: true });
  });

  app.delete('/api/promotions/:id', (req: Request, res: Response) => {
    db.prepare('DELETE FROM promotions WHERE id=?').run(Number(req.params.id));
    res.json({ success: true });
  });

  app.get('/api/promotions/validate/:code', (req: Request, res: Response) => {
    const promo = db.prepare("SELECT * FROM promotions WHERE code=? AND isActive=1").get(req.params.code.toUpperCase());
    if (promo) res.json(promo);
    else res.status(404).json({ error: 'Invalid or inactive promo code' });
  });

  // ── Error Handler ──
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal server error' });
  });

  // ── Vite Dev Server ──
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Royal Quads server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => { console.error('Failed to start server:', err); process.exit(1); });
