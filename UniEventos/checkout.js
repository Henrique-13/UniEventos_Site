/* ════════════════════════════════════════
   UNIEVENTOS — checkout.js
   Fluxo completo:
   1. CAPTCHA de estádios (modal)
   2. Página de compra (modal)
   3. Confirmação + comprovante por e-mail
════════════════════════════════════════ */

/* ─────────────────────────────────────
   DADOS DOS PACOTES
───────────────────────────────────── */
const PACKAGES = {
  basico: {
    name: 'Pacote Básico',
    price: 150,
    stadium: 'Neo Química Arena · Corinthians',
    features: ['Área reservada no estádio', 'Telão de apoio', 'Segurança exclusiva', 'Equipe de limpeza', 'Acessibilidade garantida'],
    date: '15 de Junho de 2026',
    gate: 'Portão B — Setor Norte',
    sector: 'Área Family — Bloco 4',
  },
  premium: {
    name: 'Family Premium',
    price: 280,
    stadium: 'Allianz Parque · Palmeiras',
    features: ['Área reservada VIP', 'Visão privilegiada do campo', 'Barman exclusivo', 'Comidas e bebidas inclusas', 'Segurança e acessibilidade', 'Espaço infantil'],
    date: '22 de Junho de 2026',
    gate: 'Portão A — Acesso VIP',
    sector: 'Camarote UniEventos — Andar 3',
  },
  vip: {
    name: 'Camarote VIP',
    price: 400,
    stadium: 'Maracanã · Rio de Janeiro',
    features: ['Camarote exclusivo', 'Vista frontal do campo', 'Open bar premium', 'Equipe de atendimento dedicada', 'Branding personalizado', 'Transfer incluso'],
    date: '30 de Junho de 2026',
    gate: 'Entrada Exclusiva VIP — Av. Eurico Rabelo',
    sector: 'Sky Lounge UniEventos — Cobertura',
  },
};

/* ─────────────────────────────────────
   BANCO DE IMAGENS DO CAPTCHA
   (usando Unsplash + Picsum para evitar
    problemas de CORS — imagens reais)
───────────────────────────────────── */
const CAPTCHA_IMAGES = [
  // Estádios — label: true
  { url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=300&h=200&fit=crop', label: 'Estádio de futebol iluminado', isStadium: true },
  { url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&h=200&fit=crop', label: 'Arquibancada lotada', isStadium: true },
  { url: 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=300&h=200&fit=crop', label: 'Campo de futebol aéreo', isStadium: true },
  { url: 'https://images.unsplash.com/photo-1551280857-2b9bbe52acf9?w=300&h=200&fit=crop', label: 'Arena esportiva', isStadium: true },
  { url: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=300&h=200&fit=crop', label: 'Estádio com gramado verde', isStadium: true },
  { url: 'https://images.unsplash.com/photo-1497919845431-74c5e4b93a38?w=300&h=200&fit=crop', label: 'Campo de futebol noturno', isStadium: true },
  // Outros — label: false
  { url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop', label: 'Paisagem de montanhas', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1559827291-72ee739d0d9a?w=300&h=200&fit=crop', label: 'Praia com ondas', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1518791841217-8f162f1912da?w=300&h=200&fit=crop', label: 'Gatinho fofo', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&h=200&fit=crop', label: 'Sofá confortável', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=300&h=200&fit=crop', label: 'Prato de comida', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1444492756963-da08a3463b87?w=300&h=200&fit=crop', label: 'Floresta densa', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=300&h=200&fit=crop', label: 'Cidade noturna', isStadium: false },
  { url: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&h=200&fit=crop', label: 'Campo de flores', isStadium: false },
];

/* ─────────────────────────────────────
   UTILITÁRIOS
───────────────────────────────────── */
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

function generateOrderId() {
  return 'UE-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function formatCurrency(val) {
  return 'R$\u00a0' + val.toFixed(2).replace('.', ',');
}

/* ─────────────────────────────────────
   INJEÇÃO DE ESTILOS
───────────────────────────────────── */
const style = document.createElement('style');
style.textContent = `
  /* ── OVERLAY MODAL ── */
  .ue-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.75);
    backdrop-filter: blur(6px);
    z-index: 9000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    animation: ue-fade-in 0.25s ease;
  }
  @keyframes ue-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  .ue-modal {
    background: #fff;
    border-radius: 24px;
    max-width: 680px;
    width: 100%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 32px 80px rgba(0,0,0,0.4);
    animation: ue-slide-up 0.3s cubic-bezier(.22,1,.36,1);
  }
  @keyframes ue-slide-up {
    from { transform: translateY(40px); opacity: 0; }
    to   { transform: translateY(0);    opacity: 1; }
  }
  .ue-modal-dark {
    background: #0d0d0d;
    color: #fff;
  }

  /* ── CAPTCHA ── */
  .ue-captcha-header {
    padding: 32px 36px 0;
  }
  .ue-captcha-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 22px;
    color: #F5C842;
    letter-spacing: 3px;
    margin-bottom: 20px;
  }
  .ue-captcha-logo span { color: #1a1a1a; }
  .ue-captcha-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 28px;
    color: #1a1a1a;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }
  .ue-captcha-sub {
    font-size: 13.5px;
    color: #666;
    line-height: 1.6;
    margin-bottom: 8px;
  }
  .ue-captcha-hint {
    display: inline-block;
    background: rgba(245,200,66,0.12);
    border: 1px solid rgba(245,200,66,0.3);
    color: #a07a00;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    padding: 5px 14px;
    border-radius: 100px;
    margin-bottom: 24px;
  }
  .ue-captcha-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    padding: 0 36px;
  }
  .ue-captcha-cell {
    position: relative;
    aspect-ratio: 1;
    border-radius: 10px;
    overflow: hidden;
    cursor: pointer;
    border: 3px solid transparent;
    transition: border-color 0.15s, transform 0.15s;
    user-select: none;
  }
  .ue-captcha-cell img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    pointer-events: none;
  }
  .ue-captcha-cell.selected {
    border-color: #F5C842;
    transform: scale(0.96);
  }
  .ue-captcha-cell.selected::after {
    content: '✓';
    position: absolute;
    top: 6px;
    right: 6px;
    width: 22px;
    height: 22px;
    background: #F5C842;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #1a1a1a;
    line-height: 22px;
    text-align: center;
  }
  .ue-captcha-footer {
    padding: 20px 36px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }
  .ue-captcha-counter {
    font-size: 12px;
    color: #999;
  }
  .ue-captcha-counter span { color: #F5C842; font-weight: 700; }
  .ue-captcha-error {
    background: #fff0f0;
    border: 1px solid #ffcccc;
    color: #c0392b;
    font-size: 12px;
    font-weight: 600;
    padding: 8px 16px;
    border-radius: 8px;
    display: none;
    animation: ue-shake 0.4s ease;
  }
  @keyframes ue-shake {
    0%,100% { transform: translateX(0); }
    25%      { transform: translateX(-8px); }
    75%      { transform: translateX(8px); }
  }
  .ue-btn {
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    padding: 13px 28px;
    border-radius: 10px;
    border: none;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, opacity 0.2s;
  }
  .ue-btn:disabled { opacity: 0.4; cursor: not-allowed; transform: none !important; }
  .ue-btn-primary {
    background: #F5C842;
    color: #1a1a1a;
  }
  .ue-btn-primary:hover:not(:disabled) { background: #D4A800; transform: translateY(-2px); }
  .ue-btn-ghost {
    background: transparent;
    color: #666;
    border: 1.5px solid #e8e8e8;
  }
  .ue-btn-ghost:hover { border-color: #aaa; color: #333; }
  .ue-btn-dark {
    background: #0d0d0d;
    color: #fff;
  }
  .ue-btn-dark:hover:not(:disabled) { background: #222; transform: translateY(-2px); }

  /* ── PÁGINA DE COMPRA ── */
  .ue-checkout-header {
    background: #0d0d0d;
    padding: 28px 36px 24px;
    border-radius: 24px 24px 0 0;
    position: relative;
  }
  .ue-checkout-logo {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 20px;
    color: #F5C842;
    letter-spacing: 3px;
    margin-bottom: 6px;
  }
  .ue-checkout-logo span { color: #fff; }
  .ue-checkout-close {
    position: absolute;
    top: 20px;
    right: 24px;
    width: 32px;
    height: 32px;
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.12);
    color: rgba(255,255,255,0.6);
    border-radius: 8px;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    font-family: 'DM Sans', sans-serif;
  }
  .ue-checkout-close:hover { background: rgba(255,255,255,0.15); color: #fff; }
  .ue-checkout-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 32px;
    color: #fff;
    letter-spacing: 1px;
  }
  .ue-checkout-stadium {
    font-size: 12px;
    color: rgba(255,255,255,0.45);
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  /* imagem do estádio */
  .ue-stadium-visual {
    width: 100%;
    height: 160px;
    background: linear-gradient(135deg, #1a2a1a 0%, #0d1f0d 50%, #1a1a2a 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }
  .ue-stadium-visual::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: repeating-linear-gradient(
      45deg,
      rgba(245,200,66,0.04) 0, rgba(245,200,66,0.04) 1px,
      transparent 0, transparent 50%
    );
    background-size: 28px 28px;
  }
  .ue-stadium-svg {
    opacity: 0.5;
  }
  .ue-stadium-badge {
    position: absolute;
    bottom: 14px;
    left: 16px;
    background: rgba(245,200,66,0.12);
    border: 1px solid rgba(245,200,66,0.3);
    color: #F5C842;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 5px 12px;
    border-radius: 100px;
  }

  /* corpo */
  .ue-checkout-body {
    padding: 28px 36px;
  }
  .ue-section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2.5px;
    text-transform: uppercase;
    color: #F5C842;
    margin-bottom: 14px;
  }
  .ue-info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
    margin-bottom: 28px;
  }
  .ue-info-card {
    background: #f9f9f9;
    border: 1px solid #e8e8e8;
    border-radius: 12px;
    padding: 16px 18px;
  }
  .ue-info-card-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 1.2px;
    text-transform: uppercase;
    color: #aaa;
    margin-bottom: 5px;
  }
  .ue-info-card-value {
    font-size: 14px;
    font-weight: 600;
    color: #1a1a1a;
  }

  /* features */
  .ue-features-list {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 28px;
  }
  .ue-feature-tag {
    background: rgba(39,174,96,0.08);
    border: 1px solid rgba(39,174,96,0.2);
    color: #1a7a40;
    font-size: 11.5px;
    font-weight: 600;
    padding: 5px 12px;
    border-radius: 100px;
    display: flex;
    align-items: center;
    gap: 5px;
  }
  .ue-feature-tag::before { content: '✓'; font-size: 9px; }

  /* qty */
  .ue-qty-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 28px;
    flex-wrap: wrap;
  }
  .ue-qty-label { font-size: 13px; color: #555; flex: 1; }
  .ue-qty-ctrl {
    display: flex;
    align-items: center;
    gap: 0;
    border: 1.5px solid #e8e8e8;
    border-radius: 10px;
    overflow: hidden;
  }
  .ue-qty-btn {
    width: 38px;
    height: 38px;
    background: #f5f5f5;
    border: none;
    font-size: 18px;
    font-weight: 300;
    color: #333;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.15s;
    font-family: 'DM Sans', sans-serif;
  }
  .ue-qty-btn:hover { background: #ebebeb; }
  .ue-qty-val {
    min-width: 40px;
    text-align: center;
    font-size: 16px;
    font-weight: 700;
    color: #1a1a1a;
    border-left: 1.5px solid #e8e8e8;
    border-right: 1.5px solid #e8e8e8;
    padding: 0 8px;
    height: 38px;
    line-height: 38px;
  }

  /* pagamento */
  .ue-payment-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 28px;
  }
  .ue-payment-option {
    border: 2px solid #e8e8e8;
    border-radius: 12px;
    padding: 14px 10px;
    text-align: center;
    cursor: pointer;
    transition: border-color 0.15s, background 0.15s;
    background: #fff;
  }
  .ue-payment-option:hover { border-color: #bbb; }
  .ue-payment-option.active {
    border-color: #F5C842;
    background: rgba(245,200,66,0.06);
  }
  .ue-payment-icon {
    font-size: 24px;
    margin-bottom: 6px;
    display: block;
  }
  .ue-payment-name {
    font-size: 11px;
    font-weight: 700;
    color: #333;
    letter-spacing: 0.3px;
  }
  .ue-payment-sub {
    font-size: 10px;
    color: #aaa;
    margin-top: 2px;
  }

  /* total */
  .ue-total-row {
    background: #0d0d0d;
    border-radius: 14px;
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 20px;
  }
  .ue-total-label { font-size: 12px; color: rgba(255,255,255,0.4); letter-spacing: 1px; text-transform: uppercase; }
  .ue-total-price {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 42px;
    color: #F5C842;
    line-height: 1;
  }
  .ue-total-breakdown {
    font-size: 11px;
    color: rgba(255,255,255,0.3);
    margin-top: 2px;
  }
  .ue-checkout-actions {
    display: flex;
    gap: 12px;
  }
  .ue-checkout-actions .ue-btn { flex: 1; text-align: center; }

  /* ── CONFIRMAÇÃO / COMPROVANTE ── */
  .ue-confirm-header {
    background: linear-gradient(135deg, #0d0d0d 0%, #1a2010 100%);
    padding: 40px 36px 32px;
    border-radius: 24px 24px 0 0;
    text-align: center;
  }
  .ue-confirm-check {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    background: rgba(245,200,66,0.12);
    border: 2px solid rgba(245,200,66,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    margin: 0 auto 20px;
    animation: ue-pop 0.4s cubic-bezier(.22,1,.36,1);
  }
  @keyframes ue-pop {
    from { transform: scale(0.4); opacity: 0; }
    to   { transform: scale(1);   opacity: 1; }
  }
  .ue-confirm-title {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 36px;
    color: #fff;
    letter-spacing: 1.5px;
    margin-bottom: 6px;
  }
  .ue-confirm-sub {
    font-size: 13px;
    color: rgba(255,255,255,0.45);
    line-height: 1.6;
  }
  .ue-confirm-body {
    padding: 28px 36px 36px;
  }
  .ue-receipt-card {
    background: #f9f9f9;
    border: 1px solid #e8e8e8;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
  }
  .ue-receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 8px 0;
    border-bottom: 1px solid #f0f0f0;
    font-size: 13px;
  }
  .ue-receipt-row:last-child { border-bottom: none; }
  .ue-receipt-key { color: #999; }
  .ue-receipt-val { font-weight: 600; color: #1a1a1a; text-align: right; max-width: 60%; }
  .ue-receipt-val.gold { color: #D4A800; font-family: 'Bebas Neue', sans-serif; font-size: 22px; }
  .ue-receipt-order {
    font-family: 'Bebas Neue', sans-serif;
    font-size: 13px;
    letter-spacing: 2px;
    color: #bbb;
    text-align: center;
    margin-bottom: 20px;
  }

  /* e-mail form */
  .ue-email-section {
    background: rgba(245,200,66,0.06);
    border: 1px solid rgba(245,200,66,0.2);
    border-radius: 14px;
    padding: 20px 24px;
    margin-bottom: 20px;
  }
  .ue-email-title {
    font-size: 13px;
    font-weight: 600;
    color: #1a1a1a;
    margin-bottom: 4px;
  }
  .ue-email-desc {
    font-size: 12px;
    color: #888;
    margin-bottom: 14px;
  }
  .ue-email-row {
    display: flex;
    gap: 10px;
  }
  .ue-email-input {
    flex: 1;
    border: 1.5px solid #e8e8e8;
    border-radius: 9px;
    padding: 11px 16px;
    font-size: 13.5px;
    font-family: 'DM Sans', sans-serif;
    color: #1a1a1a;
    outline: none;
    transition: border-color 0.15s;
  }
  .ue-email-input:focus { border-color: #F5C842; }
  .ue-email-sent {
    display: none;
    background: rgba(39,174,96,0.08);
    border: 1px solid rgba(39,174,96,0.25);
    color: #1a7a40;
    font-size: 12px;
    font-weight: 600;
    padding: 10px 16px;
    border-radius: 9px;
    align-items: center;
    gap: 8px;
  }
  .ue-done-btn-wrap {
    text-align: center;
  }
`;
document.head.appendChild(style);


/* ─────────────────────────────────────
   ESTADO GLOBAL
───────────────────────────────────── */
let currentPackageKey = null;
let currentOverlay = null;
let captchaImages = [];
let selectedCells = new Set();
let quantity = 2;
let selectedPayment = null;
let currentOrderId = null;

/* ─────────────────────────────────────
   HELPERS DE MODAL
───────────────────────────────────── */
function openModal(html) {
  closeModal();
  const overlay = document.createElement('div');
  overlay.className = 'ue-overlay';
  overlay.innerHTML = `<div class="ue-modal">${html}</div>`;
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.body.appendChild(overlay);
  currentOverlay = overlay;
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  if (currentOverlay) {
    currentOverlay.remove();
    currentOverlay = null;
    document.body.style.overflow = '';
  }
}

/* ─────────────────────────────────────
   1. CAPTCHA
───────────────────────────────────── */
function openCaptcha(pkgKey) {
  currentPackageKey = pkgKey;
  selectedCells.clear();
  buildCaptcha();
}

function buildCaptcha() {
  // Seleciona 3 estádios + 5 outros aleatórios = 8 células
  const stadiums = shuffle(CAPTCHA_IMAGES.filter(i => i.isStadium)).slice(0, 3);
  const others   = shuffle(CAPTCHA_IMAGES.filter(i => !i.isStadium)).slice(0, 5);
  captchaImages  = shuffle([...stadiums, ...others]);
  selectedCells.clear();

  const cells = captchaImages.map((img, idx) => `
    <div class="ue-captcha-cell" data-idx="${idx}" onclick="ueToggleCell(this)">
      <img src="${img.url}" alt="${img.label}" loading="lazy" />
    </div>
  `).join('');

  const html = `
    <div class="ue-captcha-header">
      <div class="ue-captcha-logo">UNI<span>EVENTOS</span></div>
      <div class="ue-captcha-title">Verificação de Segurança</div>
      <p class="ue-captcha-sub">Para prosseguir com a reserva, confirme que você é humano.</p>
      <div class="ue-captcha-hint">🏟 Selecione todas as imagens de estádios</div>
    </div>
    <div class="ue-captcha-grid" id="ue-captcha-grid">${cells}</div>
    <div class="ue-captcha-footer">
      <div>
        <div class="ue-captcha-counter">Selecionadas: <span id="ue-sel-count">0</span></div>
        <div class="ue-captcha-error" id="ue-captcha-error">❌ Seleção incorreta. Tente novamente!</div>
      </div>
      <div style="display:flex;gap:10px;">
        <button class="ue-btn ue-btn-ghost" onclick="closeModal()">Cancelar</button>
        <button class="ue-btn ue-btn-primary" id="ue-captcha-submit" onclick="ueSubmitCaptcha()">Verificar →</button>
      </div>
    </div>
  `;
  openModal(html);
}

window.ueToggleCell = function(el) {
  const idx = parseInt(el.dataset.idx);
  if (selectedCells.has(idx)) {
    selectedCells.delete(idx);
    el.classList.remove('selected');
  } else {
    selectedCells.add(idx);
    el.classList.add('selected');
  }
  document.getElementById('ue-sel-count').textContent = selectedCells.size;
};

window.ueSubmitCaptcha = function() {
  const correctIndices = new Set(
    captchaImages.map((img, i) => img.isStadium ? i : null).filter(i => i !== null)
  );
  // Verificar se exatamente os estádios estão marcados e nada a mais
  const correct =
    correctIndices.size === selectedCells.size &&
    [...correctIndices].every(i => selectedCells.has(i));

  if (correct) {
    openCheckout(currentPackageKey);
  } else {
    const err = document.getElementById('ue-captcha-error');
    err.style.display = 'flex';
    setTimeout(() => {
      err.style.display = 'none';
      buildCaptcha(); // reinicia com novas imagens
    }, 1800);
  }
};

/* ─────────────────────────────────────
   2. CHECKOUT
───────────────────────────────────── */
const PAYMENT_METHODS = [
  { id: 'pix',    icon: '⚡', name: 'PIX',          sub: 'Instantâneo' },
  { id: 'bb',     icon: '🏦', name: 'Banco do Brasil', sub: 'Débito/Crédito' },
  { id: 'itau',   icon: '🔶', name: 'Itaú',         sub: 'Débito/Crédito' },
  { id: 'caixa',  icon: '💙', name: 'Caixa',        sub: 'Débito/Crédito' },
  { id: 'nubank', icon: '💜', name: 'Nubank',        sub: 'Crédito/Roxinho' },
  { id: 'brad',   icon: '🔴', name: 'Bradesco',      sub: 'Débito/Crédito' },
];

function openCheckout(pkgKey) {
  const pkg = PACKAGES[pkgKey];
  quantity = 2;
  selectedPayment = null;

  const paymentCards = PAYMENT_METHODS.map(m => `
    <div class="ue-payment-option" data-id="${m.id}" onclick="ueSelectPayment(this, '${m.id}')">
      <span class="ue-payment-icon">${m.icon}</span>
      <div class="ue-payment-name">${m.name}</div>
      <div class="ue-payment-sub">${m.sub}</div>
    </div>
  `).join('');

  const featureTags = pkg.features.map(f => `<div class="ue-feature-tag">${f}</div>`).join('');

  // SVG campo de futebol
  const pitchSVG = `
    <svg class="ue-stadium-svg" width="260" height="140" viewBox="0 0 300 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="296" height="196" rx="10" stroke="white" stroke-width="1.5" stroke-opacity="0.4"/>
      <line x1="150" y1="2" x2="150" y2="198" stroke="white" stroke-width="0.8" stroke-opacity="0.4"/>
      <circle cx="150" cy="100" r="36" stroke="white" stroke-width="0.8" stroke-opacity="0.4"/>
      <circle cx="150" cy="100" r="3" fill="white" fill-opacity="0.4"/>
      <rect x="2" y="66" width="46" height="68" rx="2" stroke="white" stroke-width="0.8" stroke-opacity="0.4"/>
      <rect x="252" y="66" width="46" height="68" rx="2" stroke="white" stroke-width="0.8" stroke-opacity="0.4"/>
      <rect x="2" y="82" width="18" height="36" rx="1" stroke="white" stroke-width="0.8" stroke-opacity="0.4"/>
      <rect x="280" y="82" width="18" height="36" rx="1" stroke="white" stroke-width="0.8" stroke-opacity="0.4"/>
    </svg>
  `;

  const html = `
    <div class="ue-checkout-header">
      <div class="ue-checkout-logo">UNI<span>EVENTOS</span></div>
      <div class="ue-checkout-title">${pkg.name}</div>
      <div class="ue-checkout-stadium">${pkg.stadium}</div>
      <button class="ue-checkout-close" onclick="closeModal()">✕</button>
    </div>

    <div class="ue-stadium-visual">
      ${pitchSVG}
      <div class="ue-stadium-badge">📅 ${pkg.date}</div>
    </div>

    <div class="ue-checkout-body">

      <div class="ue-section-label">Informações do Evento</div>
      <div class="ue-info-grid">
        <div class="ue-info-card">
          <div class="ue-info-card-label">Data do Evento</div>
          <div class="ue-info-card-value">📅 ${pkg.date}</div>
        </div>
        <div class="ue-info-card">
          <div class="ue-info-card-label">Local</div>
          <div class="ue-info-card-value">🏟 ${pkg.stadium.split('·')[0].trim()}</div>
        </div>
        <div class="ue-info-card">
          <div class="ue-info-card-label">Portão de Entrada</div>
          <div class="ue-info-card-value">🚪 ${pkg.gate}</div>
        </div>
        <div class="ue-info-card">
          <div class="ue-info-card-label">Setor / Área</div>
          <div class="ue-info-card-value">📍 ${pkg.sector}</div>
        </div>
      </div>

      <div class="ue-section-label">O que está incluso</div>
      <div class="ue-features-list">${featureTags}</div>

      <div class="ue-section-label">Quantidade de Pessoas</div>
      <div class="ue-qty-row">
        <div class="ue-qty-label">Número de ingressos</div>
        <div class="ue-qty-ctrl">
          <button class="ue-qty-btn" onclick="ueChangeQty(-1)">−</button>
          <div class="ue-qty-val" id="ue-qty-display">2</div>
          <button class="ue-qty-btn" onclick="ueChangeQty(1)">+</button>
        </div>
      </div>

      <div class="ue-section-label">Forma de Pagamento</div>
      <div class="ue-payment-grid">${paymentCards}</div>

      <div class="ue-total-row">
        <div>
          <div class="ue-total-label">Total a pagar</div>
          <div class="ue-total-breakdown" id="ue-total-breakdown">2 × ${formatCurrency(pkg.price)}</div>
        </div>
        <div class="ue-total-price" id="ue-total-price">${formatCurrency(pkg.price * 2)}</div>
      </div>

      <div class="ue-checkout-actions">
        <button class="ue-btn ue-btn-ghost" onclick="openCaptcha('${pkgKey}')">← Voltar</button>
        <button class="ue-btn ue-btn-primary" id="ue-confirm-btn" onclick="ueConfirmPurchase('${pkgKey}')" disabled>
          Confirmar Reserva →
        </button>
      </div>

    </div>
  `;
  openModal(html);
}

window.ueChangeQty = function(delta) {
  const pkg = PACKAGES[currentPackageKey];
  quantity = Math.max(1, Math.min(20, quantity + delta));
  document.getElementById('ue-qty-display').textContent = quantity;
  document.getElementById('ue-total-price').textContent = formatCurrency(pkg.price * quantity);
  document.getElementById('ue-total-breakdown').textContent = `${quantity} × ${formatCurrency(pkg.price)}`;
};

window.ueSelectPayment = function(el, id) {
  document.querySelectorAll('.ue-payment-option').forEach(o => o.classList.remove('active'));
  el.classList.add('active');
  selectedPayment = id;
  const btn = document.getElementById('ue-confirm-btn');
  if (btn) btn.removeAttribute('disabled');
};

window.ueConfirmPurchase = function(pkgKey) {
  currentOrderId = generateOrderId();
  openConfirmation(pkgKey);
};

/* ─────────────────────────────────────
   3. CONFIRMAÇÃO + COMPROVANTE
───────────────────────────────────── */
function openConfirmation(pkgKey) {
  const pkg = PACKAGES[pkgKey];
  const total = pkg.price * quantity;
  const now = new Date();
  const purchaseDate = now.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
  const purchaseTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const payMethod = PAYMENT_METHODS.find(m => m.id === selectedPayment) || PAYMENT_METHODS[0];

  const html = `
    <div class="ue-confirm-header">
      <div class="ue-confirm-check">✅</div>
      <div class="ue-confirm-title">RESERVA CONFIRMADA!</div>
      <p class="ue-confirm-sub">
        Sua experiência UniEventos está garantida.<br>
        Guarde seu comprovante com carinho.
      </p>
    </div>

    <div class="ue-confirm-body">

      <div class="ue-receipt-order">PEDIDO Nº ${currentOrderId}</div>

      <div class="ue-receipt-card">
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Pacote</span>
          <span class="ue-receipt-val">${pkg.name}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Estádio</span>
          <span class="ue-receipt-val">${pkg.stadium}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Setor / Área</span>
          <span class="ue-receipt-val">${pkg.sector}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Portão</span>
          <span class="ue-receipt-val">${pkg.gate}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Data do Evento</span>
          <span class="ue-receipt-val">${pkg.date}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Ingressos</span>
          <span class="ue-receipt-val">${quantity} pessoa${quantity > 1 ? 's' : ''}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Pagamento</span>
          <span class="ue-receipt-val">${payMethod.icon} ${payMethod.name}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Data da Compra</span>
          <span class="ue-receipt-val">${purchaseDate} · ${purchaseTime}</span>
        </div>
        <div class="ue-receipt-row">
          <span class="ue-receipt-key">Valor Total</span>
          <span class="ue-receipt-val gold">${formatCurrency(total)}</span>
        </div>
      </div>

      <div class="ue-email-section">
        <div class="ue-email-title">📧 Receber comprovante por e-mail</div>
        <div class="ue-email-desc">Insira seu e-mail para receber todos os detalhes da reserva.</div>
        <div class="ue-email-row">
          <input
            class="ue-email-input"
            type="email"
            id="ue-email-input"
            placeholder="seu@email.com"
          />
          <button class="ue-btn ue-btn-dark" onclick="ueSendEmail('${pkgKey}', ${quantity}, ${total})">
            Enviar
          </button>
        </div>
        <div class="ue-email-sent" id="ue-email-sent">
          ✅ Comprovante enviado com sucesso!
        </div>
      </div>

      <div class="ue-done-btn-wrap">
        <button class="ue-btn ue-btn-primary" onclick="closeModal()" style="min-width:200px;">
          Concluir ✓
        </button>
      </div>

    </div>
  `;
  openModal(html);
}

window.ueSendEmail = function(pkgKey, qty, total) {
  const input = document.getElementById('ue-email-input');
  const sent  = document.getElementById('ue-email-sent');
  const email = input ? input.value.trim() : '';

  if (!email || !email.includes('@')) {
    input.style.borderColor = '#e74c3c';
    input.placeholder = 'Por favor, insira um e-mail válido';
    setTimeout(() => { input.style.borderColor = ''; input.placeholder = 'seu@email.com'; }, 2000);
    return;
  }

  // Simula envio (empresa fictícia — sem backend real)
  input.disabled = true;
  const btn = input.nextElementSibling;
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

  setTimeout(() => {
    if (sent) { sent.style.display = 'flex'; }
    console.log(`[UniEventos] Comprovante simulado para: ${email} | Pedido: ${currentOrderId}`);
  }, 1200);
};

/* ─────────────────────────────────────
   HOOKUP — botões "Reservar agora"
───────────────────────────────────── */
document.querySelectorAll('.pkg-btn').forEach((btn, idx) => {
  const keys = ['basico', 'premium', 'vip'];
  btn.addEventListener('click', () => openCaptcha(keys[idx] || 'premium'));
});

// Também conecta o botão "Reserve agora" da navbar e hero
document.querySelectorAll('.navbar__cta, .btn-primary').forEach(btn => {
  if (btn.textContent.trim().toLowerCase().includes('reserv')) {
    btn.addEventListener('click', () => openCaptcha('premium'));
  }
});
