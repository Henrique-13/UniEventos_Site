/* routes/bookings.js */
const express     = require('express');
const { prepare } = require('../db/database');
const auth        = require('../middleware/auth');

const router = express.Router();

/* ── Criar reserva (público) ── */
router.post('/', async (req, res) => {
  const {
    order_id, client_name, client_email,
    package_key, package_name,
    stadium, sector, gate, event_date,
    quantity, unit_price, total_price,
    payment_method, client_id
  } = req.body;

  if (!order_id || !client_email || !package_key || !quantity)
    return res.status(400).json({ error: 'Campos obrigatórios faltando' });

  try {
    let resolvedClientId = client_id || null;
    if (!resolvedClientId && client_email) {
      const found = await prepare('SELECT id FROM clients WHERE email = ?').get(client_email);
      if (found) resolvedClientId = found.id;
    }

    // Se o order_id já existe, só atualiza o e-mail (caso do ueSendEmail)
    const existing = await prepare('SELECT id FROM bookings WHERE order_id = ?').get(order_id);
    if (existing) {
      await prepare(
        `UPDATE bookings SET client_email = ?, client_id = COALESCE(?, client_id) WHERE order_id = ?`
      ).run(client_email, resolvedClientId, order_id);
      return res.json({ id: existing.id, order_id, status: 'updated' });
    }

    const info = await prepare(`
      INSERT INTO bookings
        (order_id, client_id, client_name, client_email,
         package_key, package_name, stadium, sector, gate, event_date,
         quantity, unit_price, total_price, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      order_id, resolvedClientId, client_name || 'Cliente UniEventos', client_email,
      package_key, package_name, stadium, sector, gate, event_date,
      quantity, unit_price, total_price, payment_method
    );

    res.status(201).json({ id: info.lastInsertRowid, order_id, status: 'confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Estatísticas (admin) — DEVE VIR ANTES DE /:orderId ── */
router.get('/stats', auth, async (req, res) => {
  try {
    const stats = await prepare(`
      SELECT
        COUNT(*)                                              AS total_bookings,
        COALESCE(SUM(total_price), 0)                        AS total_revenue,
        COALESCE(AVG(total_price), 0)                        AS avg_ticket,
        SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END)  AS confirmed,
        SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END)  AS cancelled,
        COALESCE(SUM(quantity), 0)                           AS total_tickets
      FROM bookings
    `).get();

    const byPackage = await prepare(`
      SELECT package_name, package_key, COUNT(*) AS count, SUM(total_price) AS revenue
      FROM bookings GROUP BY package_key
    `).all();

    const byMonth = await prepare(`
      SELECT strftime('%Y-%m', created_at) AS month,
             COUNT(*) AS count, SUM(total_price) AS revenue
      FROM bookings GROUP BY month ORDER BY month DESC LIMIT 12
    `).all();

    res.json({ ...stats, byPackage, byMonth });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Lista todas as reservas (admin) ── */
router.get('/', auth, async (req, res) => {
  try {
    const { status, package_key } = req.query;
    let sql = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];

    if (status)      { sql += ' AND status = ?';      params.push(status); }
    if (package_key) { sql += ' AND package_key = ?'; params.push(package_key); }
    sql += ' ORDER BY created_at DESC';

    const bookings = await prepare(sql).all(...params);
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Detalhe de 1 reserva ── */
router.get('/:orderId', auth, async (req, res) => {
  try {
    const booking = await prepare(
      'SELECT * FROM bookings WHERE order_id = ?'
    ).get(req.params.orderId);

    if (!booking) return res.status(404).json({ error: 'Reserva não encontrada' });
    res.json(booking);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ── Cancelar reserva (admin) ── */
router.put('/:orderId/cancel', auth, async (req, res) => {
  try {
    const info = await prepare(
      `UPDATE bookings SET status = 'cancelled' WHERE order_id = ?`
    ).run(req.params.orderId);

    if (info.changes === 0) return res.status(404).json({ error: 'Reserva não encontrada' });

    await prepare(
      `INSERT INTO admin_logs (action, details) VALUES (?, ?)`
    ).run('booking_cancelled', `Reserva ${req.params.orderId} cancelada`);

    res.json({ success: true, order_id: req.params.orderId, status: 'cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
