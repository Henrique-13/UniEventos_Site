/* routes/auth.js */
require('dotenv').config();
const express = require('express');
const jwt     = require('jsonwebtoken');
const { prepare } = require('../db/database');

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (
    email    !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    try {
      await prepare(
        `INSERT INTO admin_logs (action, details, ip) VALUES (?, ?, ?)`
      ).run('login_failed', `Tentativa com email: ${email}`, req.ip);
    } catch (_) {}

    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = jwt.sign(
    { role: 'admin', email },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  try {
    await prepare(
      `INSERT INTO admin_logs (action, details, ip) VALUES (?, ?, ?)`
    ).run('login_success', `Admin logado: ${email}`, req.ip);
  } catch (_) {}

  res.json({ token, expiresIn: '8h' });
});

module.exports = router;
