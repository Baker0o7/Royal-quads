import express from 'express';
import { createServer as createViteServer } from 'vite';
import Database from 'better-sqlite3';
import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const db = new Database(join(__dirname, 'royal_quads.db'));

// Initialize DB
try { db.exec('ALTER TABLE quads ADD COLUMN imageUrl TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE quads ADD COLUMN imei TEXT'); } catch (e) {}
try { db.exec('ALTER TABLE bookings ADD COLUMN rating INTEGER'); } catch (e) {}
try { db.exec('ALTER TABLE bookings ADD COLUMN feedback TEXT'); } catch (e) {}

db.exec(`
  CREATE TABLE IF NOT EXISTS quads (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'available', -- available, rented, maintenance
    imageUrl TEXT,
    imei TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' -- user, admin
  );

  CREATE TABLE IF NOT EXISTS promotions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    code TEXT NOT NULL UNIQUE,
    discountPercentage INTEGER NOT NULL,
    isActive INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    quadId INTEGER NOT NULL,
    userId INTEGER,
    customerName TEXT NOT NULL,
    customerPhone TEXT NOT NULL,
    duration INTEGER NOT NULL, -- in minutes
    price INTEGER NOT NULL, -- in KES
    originalPrice INTEGER NOT NULL, -- in KES
    promoCode TEXT,
    startTime TEXT NOT NULL,
    endTime TEXT,
    status TEXT DEFAULT 'active', -- active, completed
    receiptId TEXT UNIQUE,
    rating INTEGER,
    feedback TEXT,
    FOREIGN KEY(quadId) REFERENCES quads(id),
    FOREIGN KEY(userId) REFERENCES users(id)
  );

  -- Insert initial quads if empty
  INSERT INTO quads (name) SELECT 'Quad 1' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name = 'Quad 1');
  INSERT INTO quads (name) SELECT 'Quad 2' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name = 'Quad 2');
  INSERT INTO quads (name) SELECT 'Quad 3' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name = 'Quad 3');
  INSERT INTO quads (name) SELECT 'Quad 4' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name = 'Quad 4');
  INSERT INTO quads (name) SELECT 'Quad 5' WHERE NOT EXISTS (SELECT 1 FROM quads WHERE name = 'Quad 5');
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/quads', (req, res) => {
    const quads = db.prepare('SELECT * FROM quads').all();
    res.json(quads);
  });

  app.post('/api/quads', (req, res) => {
    const { name, imageUrl, imei } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const result = db.prepare('INSERT INTO quads (name, imageUrl, imei) VALUES (?, ?, ?)').run(name, imageUrl || null, imei || null);
    res.json({ id: result.lastInsertRowid, name, status: 'available', imageUrl, imei });
  });

  app.put('/api/quads/:id', (req, res) => {
    const { id } = req.params;
    const { name, status, imageUrl, imei } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    if (!['available', 'rented', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.prepare('UPDATE quads SET name = ?, status = ?, imageUrl = ?, imei = ? WHERE id = ?').run(name, status, imageUrl || null, imei || null, id);
    res.json({ success: true, id, name, status, imageUrl, imei });
  });

  app.put('/api/quads/:id/status', (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!['available', 'rented', 'maintenance'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    db.prepare('UPDATE quads SET status = ? WHERE id = ?').run(status, id);
    res.json({ success: true, status });
  });

  app.post('/api/bookings', (req, res) => {
    const { quadId, customerName, customerPhone, duration, price, originalPrice, promoCode, userId } = req.body;
    
    // Check if quad is available
    const quad = db.prepare('SELECT status FROM quads WHERE id = ?').get(quadId) as any;
    if (!quad || quad.status !== 'available') {
      return res.status(400).json({ error: 'Quad is not available' });
    }

    const startTime = new Date().toISOString();
    const receiptId = 'RB-' + Math.random().toString(36).substring(2, 8).toUpperCase();

    const result = db.prepare(`
      INSERT INTO bookings (quadId, userId, customerName, customerPhone, duration, price, originalPrice, promoCode, startTime, receiptId)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(quadId, userId || null, customerName, customerPhone, duration, price, originalPrice || price, promoCode || null, startTime, receiptId);

    db.prepare('UPDATE quads SET status = ? WHERE id = ?').run('rented', quadId);

    res.json({ id: result.lastInsertRowid, receiptId, startTime });
  });

  app.post('/api/bookings/:id/complete', (req, res) => {
    const { id } = req.params;
    const booking = db.prepare('SELECT quadId, status FROM bookings WHERE id = ?').get(id) as any;
    
    if (!booking || booking.status === 'completed') {
      return res.status(400).json({ error: 'Booking not found or already completed' });
    }

    const endTime = new Date().toISOString();
    db.prepare('UPDATE bookings SET status = ?, endTime = ? WHERE id = ?').run('completed', endTime, id);
    db.prepare('UPDATE quads SET status = ? WHERE id = ?').run('available', booking.quadId);

    res.json({ success: true, endTime });
  });

  app.get('/api/bookings/active', (req, res) => {
    const bookings = db.prepare(`
      SELECT b.*, q.name as quadName, q.imageUrl as quadImageUrl, q.imei as quadImei 
      FROM bookings b 
      JOIN quads q ON b.quadId = q.id 
      WHERE b.status = 'active'
    `).all();
    res.json(bookings);
  });

  app.get('/api/bookings/history', (req, res) => {
    const bookings = db.prepare(`
      SELECT b.*, q.name as quadName 
      FROM bookings b 
      JOIN quads q ON b.quadId = q.id 
      WHERE b.status = 'completed'
      ORDER BY b.endTime DESC
    `).all();
    res.json(bookings);
  });

  app.post('/api/bookings/:id/feedback', (req, res) => {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    db.prepare('UPDATE bookings SET rating = ?, feedback = ? WHERE id = ?').run(rating, feedback || null, id);
    res.json({ success: true });
  });

  app.get('/api/sales', (req, res) => {
    const totalSales = db.prepare('SELECT SUM(price) as total FROM bookings WHERE status = ?').get('completed') as any;
    const todaySales = db.prepare('SELECT SUM(price) as total FROM bookings WHERE status = ? AND date(endTime) = date(?)').get('completed', new Date().toISOString()) as any;
    
    res.json({
      total: totalSales.total || 0,
      today: todaySales.total || 0
    });
  });

  // User Auth Routes
  app.post('/api/auth/register', (req, res) => {
    const { name, phone, password } = req.body;
    try {
      const result = db.prepare('INSERT INTO users (name, phone, password) VALUES (?, ?, ?)').run(name, phone, password);
      res.json({ id: result.lastInsertRowid, name, phone });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Phone number already registered' });
      } else {
        res.status(500).json({ error: 'Failed to register' });
      }
    }
  });

  app.post('/api/auth/login', (req, res) => {
    const { phone, password } = req.body;
    const user = db.prepare('SELECT id, name, phone, role FROM users WHERE phone = ? AND password = ?').get(phone, password) as any;
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });

  app.get('/api/users/:id/history', (req, res) => {
    const { id } = req.params;
    const bookings = db.prepare(`
      SELECT b.*, q.name as quadName 
      FROM bookings b 
      JOIN quads q ON b.quadId = q.id 
      WHERE b.userId = ?
      ORDER BY b.id DESC
    `).all(id);
    res.json(bookings);
  });

  // Promotions Routes
  app.get('/api/promotions', (req, res) => {
    const promos = db.prepare('SELECT * FROM promotions ORDER BY id DESC').all();
    res.json(promos);
  });

  app.post('/api/promotions', (req, res) => {
    const { code, discountPercentage } = req.body;
    try {
      const result = db.prepare('INSERT INTO promotions (code, discountPercentage) VALUES (?, ?)').run(code.toUpperCase(), discountPercentage);
      res.json({ id: result.lastInsertRowid, code: code.toUpperCase(), discountPercentage, isActive: 1 });
    } catch (err: any) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        res.status(400).json({ error: 'Promotion code already exists' });
      } else {
        res.status(500).json({ error: 'Failed to create promotion' });
      }
    }
  });

  app.post('/api/promotions/:id/toggle', (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body;
    db.prepare('UPDATE promotions SET isActive = ? WHERE id = ?').run(isActive ? 1 : 0, id);
    res.json({ success: true });
  });

  app.get('/api/promotions/validate/:code', (req, res) => {
    const { code } = req.params;
    const promo = db.prepare('SELECT * FROM promotions WHERE code = ? AND isActive = 1').get(code.toUpperCase()) as any;
    if (promo) {
      res.json(promo);
    } else {
      res.status(404).json({ error: 'Invalid or inactive promo code' });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
