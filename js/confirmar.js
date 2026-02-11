console.log('CONFIRMAR.JS CARGADO', new Date().toISOString());

import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

/* 🔹 FIX DUPLICACIÓN: token de render */
let renderToken = 0;

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');

const tabAlmacen = document.getElementById('tab-almacen');
const tabTerminal = document.getElementById('tab-terminal');
const tabHistorial = document.getElementById('tab-historial');

const syncStatus = document.getElementById('syncStatus');

/* =========================
   CONEXIÓN
   ========================= */
function setConectando() {
  syncStatus.classList.add('loading');
  syncStatus.querySelector('.text').textContent = 'Conectando';
}

function setConectado() {
  syncStatus.classList.remove('loading');
  syncStatus.querySelector('.text').textContent = 'Conectado';
}

function setOffline() {
  syncStatus.classList.remove('loading');
  syncStatus.querySelector('.text').textContent = 'Sin conexión';
}

/* =========================
   TABS
   ========================= */
tabAlmacen.onclick = () => cambiarEstado('en_almacen');
tabTerminal.onclick = () => cambiarEstado('terminal');
tabHistorial.onclick = () => cambiarEstado('entregado');

function cambiarEstado(estado) {
  estadoActual = estado;

  tabAlmacen.classList.toggle('active', estado === 'en_almacen');
  tabTerminal.classList.toggle('active', estado === 'terminal');
  tabHistorial.classList.toggle('active', estado === 'entregado');

  cargarEntregas();
}

/* =========================
   BUSCADOR INTELIGENTE
   ========================= */
function filtrarResultados(data, search) {
  if (!search) return data;

  const q = search.trim().toLowerCase();

  // 1️⃣ ENTREGA_ID exacto
  if (q.startsWith('ent-')) {
    return data.filter(e =>
      (e.entrega_id || '').toLowerCase() === q
    );
  }

  // 2️⃣ TELÉFONO (solo números, >=6)
  if (/^\d{6,}$/.test(q)) {
    return data.filter(e =>
      (e.cliente_telefono || '').includes(q)
    );
  }

  // 3️⃣ NOMBRE
  return data.filter(e =>
    (e.cliente_nombre || '').toLowerCase().includes(q)
  );
}

/* =========================
   CARGAR
   ========================= */
async function cargarEntregas() {
  console.log('🔁 cargarEntregas', estadoActual);

  const currentToken = ++renderToken;
  lista.innerHTML = '';

  const search = searchInput.value.trim();
  const url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;

  setConectando();

  try {
    const res = await fetch(url, { cache: 'no-store' });
    const json = await res.json();

    if (currentToken !== renderToken) return;

    let data = json.data || [];
    data = filtrarResultados(data, search);

    if (!data.length) {
      lista.innerHTML = `
        <div style="
          padding: 24px;
          text-align: center;
          color: var(--muted);
          font-size: 14px;
        ">
          No hay entregas para mostrar.
        </div>
      `;
      setConectado();
      return;
    }

    if (estadoActual === 'terminal') {
      data.forEach(r => lista.appendChild(renderTerminal(r)));
      setConectado();
      return;
    }

    const grupos = agruparPorCliente(data);

    Object.entries(grupos).forEach(([cliente, entregas]) => {
      const h = document.createElement('div');
      h.className = 'cliente-header';
      h.textContent = cliente;
      lista.appendChild(h);

      entregas.forEach(e => lista.appendChild(renderEntrega(e)));
    });

    setConectado();
  } catch (err) {
    console.error(err);
    if (currentToken === renderToken) setOffline();
  }
}

/* 🔹 debounce search */
let searchTimer;
searchInput.oninput = () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(cargarEntregas, 300);
};

/* =========================
   AGRUPAR
   ========================= */
function agruparPorCliente(entregas) {
  return entregas.reduce((acc, e) => {
    acc[e.cliente_nombre] ??= [];
    acc[e.cliente_nombre].push(e);
    return acc;
  }, {});
}

/* =========================
   RENDER ENTREGA (ALMACÉN)
   ========================= */
function renderEntrega(entrega) {
  const card = document.createElement('div');
  card.className = 'entrega swipe-card';

  card.innerHTML = `
    <div class="swipe-bg">Entregado</div>
    <div class="swipe-content">
      <div class="entrega-row">
        <div class="entrega-monto">Bs ${entrega.monto_total_bs}</div>
        <div class="entrega-producto">${entrega.descripcion_producto || ''}</div>
        <div class="entrega-ubicacion">
          <span class="material-symbols-rounded">location_on</span>
          ${entrega.ubicacion_fisica || 'Sin ubicación'}
        </div>
      </div>
    </div>
  `;

  // 🔹 Activamos swipe solo en almacén
  if (estadoActual === 'en_almacen') {
    activarSwipe(card, entrega.entrega_id);
  }

  return card;
}

/* =========================
   TERMINAL
   ========================= */
function renderTerminal(r) {
  const card = document.createElement('div');
  card.className = 'entrega swipe-card';

  card.innerHTML = `
    <div class="swipe-bg">Entregado</div>
    <div class="swipe-content">
      <div class="entrega-row entrega-terminal">
        <div class="entrega-header">
          <strong>Entrega ${r.entrega_id}</strong><br>
          <span class="cliente-linea">
            Cliente: ${r.cliente_nombre || '—'}
          </span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">location_on</span>
          <span>${r.destino || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">person</span>
          <span>${r.nombre_receptor || r.cliente_nombre || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">call</span>
          <span>${r.telefono_receptor || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">local_shipping</span>
          <span>${r.transportadora || '—'}</span>
        </div>

        <div class="entrega-info">
          <span class="material-symbols-rounded">inventory_2</span>
          <span id="ubicacion-${r.entrega_id}">—</span>
        </div>

        <div class="entrega-info total">
          <span class="material-symbols-rounded">payments</span>
          <span id="total-${r.entrega_id}">— Bs</span>
        </div>
      </div>

      <div class="detalle hidden" id="detalle-${r.entrega_id}"></div>
    </div>
  `;

  cargarResumenEntrega(r.entrega_id);
  activarSwipe(card, r.entrega_id);

  let tapTimer = 0;
  card.addEventListener('touchstart', () => {
    tapTimer = Date.now();
  });
  card.addEventListener('touchend', () => {
    if (Date.now() - tapTimer < 200) {
      toggleDetalleTerminal(r.entrega_id);
    }
  });

  return card;
}

/* =========================
   CONFIRMAR ENTREGA
   ========================= */
async function confirmarEntrega(id, card) {
  try {
    // 🔹 Optimistic UI (desaparece suave)
    card.classList.add('confirmed');

    await fetch(`${API_BASE_URL}/gestor-entregas/${id}/entregar`, {
      method: 'PATCH'
    });

    // 🔹 Eliminamos del DOM sin recargar lista
    setTimeout(() => {
      card.remove();
    }, 250);

  } catch (err) {
    console.error('Error confirmando entrega', err);

    // 🔁 Si falla, revertimos visual
    card.classList.remove('confirmed');
  }
}

function activarSwipe(card, entregaId) {
  let startX = 0;
  let currentX = 0;
  const content = card.querySelector('.swipe-content');

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    currentX = 0;
    card.classList.add('swiping');
    content.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    if (dx < 0) {
      currentX = dx;
      content.style.transform = `translateX(${dx}px)`;
    }
  });

  card.addEventListener('touchend', async () => {
    content.style.transition = 'transform .25s ease';

    if (currentX < -120) {
      await confirmarEntrega(entregaId, card);
    }

    content.style.transform = 'translateX(0)';
    card.classList.remove('swiping');
    currentX = 0;
  });
}


/* INIT */
cargarEntregas();

/* =========================
   DETALLE ENTREGA TERMINAL
   ========================= */
async function cargarResumenEntrega(entregaId) {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/entregas/detalle/${entregaId}`,
      { cache: 'no-store' }
    );

    const productos = await res.json();
    const cont = document.getElementById(`detalle-${entregaId}`);
    if (!cont) return;

    let html = '';
    let total = 0;
    let ubicacionFisica = '';

    productos.forEach((p, i) => {
      const monto = Number(p.monto_total_bs || 0);
      total += monto;

      if (!ubicacionFisica && p.ubicacion_fisica) {
        ubicacionFisica = p.ubicacion_fisica;
      }

      html += `
        <div class="detalle-item">
          <strong>${i + 1}) ${p.descripcion_producto}</strong><br>
          <small>${monto} Bs</small>
        </div>
      `;
    });

    html += `
      <div class="detalle-total">
        <strong>Total: ${total} Bs</strong>
      </div>
    `;

    cont.innerHTML = html;

    const ubEl = document.getElementById(`ubicacion-${entregaId}`);
    if (ubEl) ubEl.textContent = ubicacionFisica || '—';

    const totalEl = document.getElementById(`total-${entregaId}`);
    if (totalEl) totalEl.textContent = `${total} Bs`;

    cont.classList.add('hidden');
  } catch (err) {
    console.error('Error cargando detalle entrega', err);
  }
}

function toggleDetalleTerminal(entregaId) {
  const cont = document.getElementById(`detalle-${entregaId}`);
  if (!cont) return;
  cont.classList.toggle('open');
}
