# UniEventos — Backend & Integrações

## Estrutura do projeto

```
unieventos-backend/
├── src/
│   ├── server.js            ← ponto de entrada
│   ├── db/
│   │   └── database.js      ← SQLite + criação das tabelas
│   ├── middleware/
│   │   └── auth.js          ← validação JWT
│   └── routes/
│       ├── auth.js          ← POST /api/auth/login
│       ├── clients.js       ← CRUD de clientes
│       └── bookings.js      ← CRUD de reservas + stats
├── admin/
│   └── index.html           ← painel admin (abre no browser)
├── data/
│   └── unieventos.db        ← criado automaticamente
├── checkout-update.js       ← trechos para atualizar no site
├── .env.example             ← copie para .env e preencha
└── package.json
```

---

## Como rodar

### 1. Pré-requisitos
- **Node.js** versão 18 ou superior: https://nodejs.org

### 2. Instalar dependências
```bash
cd unieventos-backend
npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Abra o .env e preencha as chaves
```

### 4. Iniciar o servidor
```bash
npm start
# Desenvolvimento com auto-reload:
npm run dev
```

O servidor sobe em **http://localhost:3001**

---

## Acessar o painel admin

Abra no navegador: **http://localhost:3001/admin**

**Login padrão** (configurado no .env):
- E-mail: `admin@unieventos.com.br`
- Senha: `UniEventos@2026`

---

## Endpoints da API

| Método | Rota                            | Descrição                    | Auth |
|--------|---------------------------------|------------------------------|------|
| POST   | /api/auth/login                 | Login admin                  | —    |
| POST   | /api/clients/register           | Cadastro de cliente          | —    |
| POST   | /api/clients/login              | Login do cliente             | —    |
| GET    | /api/clients                    | Lista todos os clientes      | JWT  |
| GET    | /api/clients/:id                | Detalhe + reservas do cliente| JWT  |
| DELETE | /api/clients/:id                | Remove cliente               | JWT  |
| POST   | /api/bookings                   | Cria nova reserva            | —    |
| GET    | /api/bookings                   | Lista todas as reservas      | JWT  |
| GET    | /api/bookings/stats             | Estatísticas gerais          | JWT  |
| GET    | /api/bookings/:orderId          | Detalhe de uma reserva       | JWT  |
| PUT    | /api/bookings/:orderId/cancel   | Cancela reserva              | JWT  |

---

## Integrações do front-end

### EmailJS
1. Crie conta em https://www.emailjs.com (gratuito)
2. Crie um serviço de e-mail (Gmail, Outlook)
3. Crie um template com as variáveis: `{{to_email}}`, `{{order_id}}`, `{{pkg_name}}`, `{{stadium}}`, `{{event_date}}`, `{{quantity}}`, `{{total}}`
4. Adicione no `index.html` antes de `</body>`:
   ```html
   <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
   <script>emailjs.init('SUA_PUBLIC_KEY');</script>
   ```
5. Preencha as constantes em `checkout-update.js`

### Google Maps + Places Autocomplete
1. Crie chave em https://console.cloud.google.com
2. Ative "Maps JavaScript API" e "Places API"
3. Adicione no `index.html`:
   ```html
   <script src="https://maps.googleapis.com/maps/api/js?key=SUA_CHAVE&libraries=places"></script>
   ```
4. Adicione ao `main.js`:
   ```js
   const autocomplete = new google.maps.places.Autocomplete(
     document.getElementById('s-local'),
     { types: ['establishment'], componentRestrictions: { country: 'br' } }
   );
   ```

### Google reCAPTCHA v3
1. Cadastre em https://www.google.com/recaptcha/admin
2. Escolha "reCAPTCHA v3" e registre seu domínio (localhost para dev)
3. Adicione no `index.html`:
   ```html
   <script src="https://www.google.com/recaptcha/api.js?render=SUA_SITE_KEY"></script>
   ```
4. No `checkout.js`, substitua `openCaptcha()` por:
   ```js
   function openCaptcha(pkgKey) {
     grecaptcha.ready(async () => {
       const token = await grecaptcha.execute('SUA_SITE_KEY', { action: 'reserva' });
       // token gerado → prossegue direto para o checkout
       currentPackageKey = pkgKey;
       openCheckout(pkgKey);
     });
   }
   ```

### ViaCEP (geolocalização por cidade)
```js
// Adicione ao main.js
navigator.geolocation.getCurrentPosition(async pos => {
  const { latitude: lat, longitude: lon } = pos.coords;
  const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`);
  const data = await r.json();
  const city = data.address?.city || '';
  // Ativa a pílula do estádio correspondente
  const cityMap = { 'São Paulo':'Neo Química Arena','Rio de Janeiro':'Maracanã','Campinas':'Neo Química Arena' };
  const target = cityMap[city];
  if (target) {
    document.querySelectorAll('.stadium-pill').forEach(p => {
      p.classList.toggle('active', p.textContent.includes(target));
    });
  }
});
```

### Google Analytics 4
1. Crie propriedade em https://analytics.google.com
2. Adicione no `<head>` do `index.html`:
   ```html
   <script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
   <script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>
   ```
3. Adicione eventos no `checkout.js`:
   ```js
   // No openCheckout:
   gtag('event','begin_checkout',{package: pkgKey, value: pkg.price});
   // Na confirmação:
   gtag('event','purchase',{transaction_id: currentOrderId, value: total, currency: 'BRL'});
   ```

### API-Football
```js
// Busca jogos reais nos estádios. Adicione ao main.js
async function loadRealMatches() {
  const res = await fetch('https://v3.football.api-sports.io/fixtures?league=71&season=2026&next=10', {
    headers: { 'x-apisports-key': 'SUA_CHAVE' }
  });
  const { response } = await res.json();
  // Mapeia jogos para os cards de experiência
}
```

### Mercado Pago (sandbox)
Para o modo sandbox (sem cobranças reais):
1. Crie conta no Mercado Pago Developers: https://developers.mercadopago.com
2. Use o token que começa com `TEST-` (sandbox)
3. Cartões de teste: https://www.mercadopago.com.br/developers/pt/docs/checkout-pro/additional-content/your-integrations/test/cards

---

## Banco de dados

O SQLite cria o arquivo `data/unieventos.db` automaticamente.
Para visualizar os dados diretamente:
- **DB Browser for SQLite**: https://sqlitebrowser.org (gratuito, visual)
- **CLI**: `sqlite3 data/unieventos.db "SELECT * FROM bookings;"`
