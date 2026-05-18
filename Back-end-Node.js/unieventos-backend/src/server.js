/* ════════════════════════════════════════
   server.js — Servidor principal UniEventos
   Porta padrão: 3001
════════════════════════════════════════ */
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');

const authRoutes    = require('./routes/auth');
const clientRoutes  = require('./routes/clients');
const bookingRoutes = require('./routes/bookings');

const app  = express();
const PORT = process.env.PORT || 3001;

/* ── Middlewares ── */
app.use(cors({
  origin: ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ── Serve o painel admin (arquivos estáticos) ── */
app.use('/admin', express.static(path.join(__dirname, '../admin')));

/* ── Rotas da API ── */
app.use('/api/auth',     authRoutes);
app.use('/api/clients',  clientRoutes);
app.use('/api/bookings', bookingRoutes);

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0', timestamp: new Date().toISOString() });
});

/* ── 404 ── */
app.use((req, res) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

/* ── Inicia o servidor ── */
app.listen(PORT, () => {
  console.log(`\n✅ UniEventos Backend rodando em http://localhost:${PORT}`);
  console.log(`📊 Painel admin: http://localhost:${PORT}/admin`);
  console.log(`🗄️  Banco de dados: ./data/unieventos.db\n`);
});
