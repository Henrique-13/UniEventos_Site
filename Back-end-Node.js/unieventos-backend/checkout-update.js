/* ════════════════════════════════════════
   checkout.js — TRECHO ATUALIZADO
   Substitua a função window.ueConfirmPurchase
   e adicione saveBookingToBackend abaixo

   ATENÇÃO: mantenha todo o restante do
   checkout.js original. Apenas substitua
   o bloco indicado.
════════════════════════════════════════ */

/* ─── URL do backend (ajuste se necessário) ─── */
const BACKEND_URL = 'http://localhost:3001';

/* ─── SUBSTITUIR a função ueConfirmPurchase existente ─── */
window.ueConfirmPurchase = async function(pkgKey) {
  const btn = document.getElementById('ue-confirm-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Processando...'; }

  currentOrderId = generateOrderId();

  // Salva no backend (não bloqueia o fluxo se falhar)
  await saveBookingToBackend(pkgKey);

  openConfirmation(pkgKey);
};

/* ─── NOVA FUNÇÃO: salva reserva no backend ─── */
async function saveBookingToBackend(pkgKey) {
  const pkg = PACKAGES[pkgKey];
  if (!pkg) return;

  const payMethod = PAYMENT_METHODS.find(m => m.id === selectedPayment);

  const payload = {
    order_id:       currentOrderId,
    client_name:    'Cliente UniEventos',    // substituir por campo de nome no checkout
    client_email:   '',                       // preenchido na etapa de e-mail (ver abaixo)
    package_key:    pkgKey,
    package_name:   pkg.name,
    stadium:        pkg.stadium,
    sector:         pkg.sector,
    gate:           pkg.gate,
    event_date:     pkg.date,
    quantity:       quantity,
    unit_price:     pkg.price,
    total_price:    pkg.price * quantity,
    payment_method: payMethod ? payMethod.name : selectedPayment,
  };

  try {
    await fetch(`${BACKEND_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    // Falha silenciosa — não bloqueia a experiência do usuário
    console.warn('[UniEventos] Não foi possível salvar reserva no backend:', err.message);
  }
}

/* ─── SUBSTITUIR a função window.ueSendEmail existente ─── */
window.ueSendEmail = async function(pkgKey, qty, total) {
  const input = document.getElementById('ue-email-input');
  const sent  = document.getElementById('ue-email-sent');
  const email = input ? input.value.trim() : '';

  if (!email || !email.includes('@')) {
    input.style.borderColor = '#e74c3c';
    input.placeholder = 'Por favor, insira um e-mail válido';
    setTimeout(() => { input.style.borderColor = ''; input.placeholder = 'seu@email.com'; }, 2000);
    return;
  }

  input.disabled = true;
  const btn = input.nextElementSibling;
  if (btn) { btn.disabled = true; btn.textContent = 'Enviando…'; }

  /* ── Atualiza e-mail do cliente na reserva do backend ── */
  try {
    const pkg = PACKAGES[pkgKey];
    await fetch(`${BACKEND_URL}/api/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        order_id:       currentOrderId,
        client_name:    'Cliente UniEventos',
        client_email:   email,
        package_key:    pkgKey,
        package_name:   pkg.name,
        stadium:        pkg.stadium,
        sector:         pkg.sector,
        gate:           pkg.gate,
        event_date:     pkg.date,
        quantity:       qty,
        unit_price:     pkg.price,
        total_price:    total,
        payment_method: (PAYMENT_METHODS.find(m => m.id === selectedPayment)||{}).name || selectedPayment,
      }),
    });
  } catch { /* silencioso */ }

  /* ── Envia e-mail real via EmailJS ── */
  // Substitua os valores abaixo com suas chaves do EmailJS
  const EMAILJS_SERVICE_ID  = 'SEU_SERVICE_ID';
  const EMAILJS_TEMPLATE_ID = 'SEU_TEMPLATE_ID';
  const EMAILJS_PUBLIC_KEY  = 'SUA_PUBLIC_KEY';

  try {
    await emailjs.send(
      EMAILJS_SERVICE_ID,
      EMAILJS_TEMPLATE_ID,
      {
        to_email:   email,
        order_id:   currentOrderId,
        pkg_name:   PACKAGES[pkgKey].name,
        stadium:    PACKAGES[pkgKey].stadium,
        sector:     PACKAGES[pkgKey].sector,
        gate:       PACKAGES[pkgKey].gate,
        event_date: PACKAGES[pkgKey].date,
        quantity:   qty,
        total:      `R$ ${total.toFixed(2).replace('.', ',')}`,
        payment:    (PAYMENT_METHODS.find(m => m.id === selectedPayment)||{}).name || selectedPayment,
      },
      EMAILJS_PUBLIC_KEY
    );
    if (sent) { sent.style.display = 'flex'; }
  } catch (err) {
    console.warn('[UniEventos] EmailJS falhou:', err);
    // Fallback: mostra confirmação mesmo sem e-mail real
    if (sent) { sent.style.display = 'flex'; }
  }
};
