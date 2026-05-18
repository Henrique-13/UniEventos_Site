/* ════════════════════════════════════════
   UNIEVENTOS — main.js
   Interações da página inicial:
   1. Navbar — sombra ao rolar
   2. Estádios — pílulas clicáveis
   3. Animação de entrada dos cards
════════════════════════════════════════ */


/* ─────────────────────────────────────
   1. NAVBAR — sombra ao rolar a página
───────────────────────────────────── */
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 10) {
    navbar.style.boxShadow = '0 4px 32px rgba(0,0,0,0.4)';
  } else {
    navbar.style.boxShadow = 'none';
  }
});


/* ─────────────────────────────────────
   2. ESTÁDIOS — toggle das pílulas
───────────────────────────────────── */
document.querySelectorAll('.stadium-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    document.querySelectorAll('.stadium-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');
  });
});


/* ─────────────────────────────────────
   3. ANIMAÇÃO DE ENTRADA — cards
   (usa IntersectionObserver para
   animar somente quando visível)
───────────────────────────────────── */
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';

      // o card em destaque (featured) tem transform scale, os outros não
      if (entry.target.classList.contains('pkg-card--featured')) {
        entry.target.style.transform = 'scale(1.03) translateY(0)';
      } else {
        entry.target.style.transform = 'translateY(0)';
      }

      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.exp-card, .pkg-card, .social-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transition = 'opacity 0.5s ease, transform 0.5s ease, box-shadow 0.25s';

  if (el.classList.contains('pkg-card--featured')) {
    el.style.transform = 'scale(1.03) translateY(24px)';
  } else {
    el.style.transform = 'translateY(24px)';
  }

  observer.observe(el);
});
