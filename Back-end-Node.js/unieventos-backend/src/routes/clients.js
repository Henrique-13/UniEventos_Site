/* routes/clients.js */
const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { prepare } = require('../db/database');
const auth     = require('../middleware/auth');

const router = express.Router();

/* ── Cadastro público ── */
router.post('/register', async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: 'name, email e password são obrigatórios' });

  try {
    const existing = await prepare('SELECT id FROM clients WHERE email = ?').get(email);
    if (existing)
      return res.status(409).json({ error: 'E-mail já cadastrado', clientId: existing.id });

    const hash = bcrypt.hashSync(password, 10);
    const info = await prepare(
      `INSERT INTO clients (name, email, phone, password) VALUES (?, ?, ?, ?)`
    ).run(name, email, phone || null, hash);

    res.status(201).json({ id: info.lastInsertRowid, name, email });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao cadastrar cliente', detail: err.message });
  }
});

/* ── Login do cliente ── */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const client = await prepare('SELECT * FROM clients WHERE email = ?').get(email);
    if (!client || !bcrypt.compareSync(password, client.password))
      return res.status(401).json({ error: 'Credenciais inválidas' });

    await prepare(
      `UPDATE clients SET last_login = datetime('now','localtime') WHERE id = ?`
    ).run(client.id);

    const token = jwt.sign(
      { role: 'client', id: client.id, email: client.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, client: { id: client.id, name: client.name, email: client.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Lista todos os clientes (admin) ── */
router.get('/', auth, async (req, res) => {
  try {
    const clients = await prepare(`
      SELECT
        c.id, c.name, c.email, c.phone, c.created_at, c.last_login,
        COUNT(b.id)                    AS total_bookings,
        COALESCE(SUM(b.total_price),0) AS total_spent
      FROM clients c
      LEFT JOIN bookings b ON b.client_id = c.id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `).all();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Detalhe de um cliente + reservas (admin) ── */
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await prepare(
      'SELECT id, name, email, phone, created_at, last_login FROM clients WHERE id = ?'
    ).get(req.params.id);

    if (!client) return res.status(404).json({ error: 'Cliente não encontrado' });

    const bookings = await prepare(
      'SELECT * FROM bookings WHERE client_id = ? ORDER BY created_at DESC'
    ).all(req.params.id);

    res.json({ ...client, bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Remove cliente (admin) ── */
router.delete('/:id', auth, async (req, res) => {
  try {
    const info = await prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Cliente não encontrado' });

    await prepare(
      `INSERT INTO admin_logs (action, details) VALUES (?, ?)`
    ).run('client_deleted', `Cliente ID ${req.params.id} removido`);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
