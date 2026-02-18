// confirmar.js

console.log('CONFIRMAR.JS CARGADO', new Date().toISOString());

import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

/* 🔹 FIX DUPLICACIÓN: token de render */
let renderToken = 0;

/* 🔹 NUEVO: selección múltiple etiquetas */
let etiquetasSeleccionadas = [];

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

  if (q.startsWith('ent-')) {
    return data.filter(e =>
      (e.entrega_id || '').toLowerCase() === q
    );
  }

  if (/^\d{6,}$/.test(q)) {
    return data.filter(e =>
      (e.cliente_telefono || '').includes(q)
    );
  }

  return data.filter(e =>
    (e.cliente_nombre || '').toLowerCase().includes(q)
  );
}

/* =========================
   CARGAR
   ========================= */
async function cargarEntregas() {
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
          <span>${r.nombre_receptor || '—'}</span>
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

        <div class="entrega-print">
          <button 
            class="btn-print"
            data-id="${r.entrega_id}"
            data-nombre="${r.nombre_receptor || ''}"
            data-destino="${r.destino || ''}"
            data-telefono="${r.telefono_receptor || ''}"
          >
            <span class="material-symbols-rounded">print</span>
          </button>

          <button 
            class="btn-select"
            data-id="${r.entrega_id}"
            data-nombre="${r.nombre_receptor || ''}"
            data-destino="${r.destino || ''}"
            data-telefono="${r.telefono_receptor || ''}"
          >
            <span class="material-symbols-rounded">check_circle</span>
          </button>
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
   EVENTOS BOTONES IMPRESIÓN
   ========================= */
document.addEventListener('click', function(e) {

  const printBtn = e.target.closest('.btn-print');
  if (printBtn) {
    e.stopPropagation();

    const nombre = printBtn.dataset.nombre || '';
    const destino = printBtn.dataset.destino || '';
    const telefono = printBtn.dataset.telefono || '';

    imprimirLote([{ nombre, destino, telefono }]);
    return;
  }

  const selectBtn = e.target.closest('.btn-select');
  if (selectBtn) {
    e.stopPropagation();

    const data = {
      id: selectBtn.dataset.id,
      nombre: selectBtn.dataset.nombre || '',
      destino: selectBtn.dataset.destino || '',
      telefono: selectBtn.dataset.telefono || ''
    };

    const existe = etiquetasSeleccionadas.find(e => e.id === data.id);

    if (existe) {
      etiquetasSeleccionadas = etiquetasSeleccionadas.filter(e => e.id !== data.id);
      selectBtn.classList.remove('selected');
    } else {
      etiquetasSeleccionadas.push(data);
      selectBtn.classList.add('selected');
    }

    actualizarBotonLote();
  }

});

function actualizarBotonLote() {
  let btn = document.getElementById('btnLote');

  if (!btn && etiquetasSeleccionadas.length) {
    btn = document.createElement('button');
    btn.id = 'btnLote';
    btn.textContent = `Imprimir (${etiquetasSeleccionadas.length})`;
    btn.className = 'btn-lote';
    btn.onclick = () => {
      imprimirLote(etiquetasSeleccionadas);
      etiquetasSeleccionadas = [];
      btn.remove();
      document.querySelectorAll('.btn-select').forEach(b => b.classList.remove('selected'));
    };
    document.body.appendChild(btn);
  }

  if (btn) {
    if (!etiquetasSeleccionadas.length) {
      btn.remove();
    } else {
      btn.textContent = `Imprimir (${etiquetasSeleccionadas.length})`;
    }
  }
}

function imprimirLote(lista) {

  const etiquetasHTML = lista.map(e => `
    <div class="envio">
      <div class="cliente">${e.nombre}</div>
      <div class="destino">${e.destino}</div>
      <div class="telefono">${e.telefono || ''}</div>
    </div>
  `).join('');

  const html = `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<title>Etiquetas</title>
<style>
@page {
  size: letter;
  margin: 8mm;
}

body {
  margin: 0;
  font-family: Arial, Helvetica, sans-serif;
  color: #000;
  text-transform: uppercase;
}

/* Letter: 279.4mm alto */
/* Área útil vertical: 279.4 - 16mm = 263.4mm */
/* 263.4 / 4 = 65.85mm */

.envio {
  height: 65.8mm;
  border: 2px solid #000;
  padding: 8mm;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  page-break-inside: avoid;
}

.envio .cliente {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 5mm;
}

.envio .destino {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5mm;
}

.envio .telefono {
  font-size: 22px;
}
</style>
</head>
<body>

${etiquetasHTML}

<script>
window.onload = function() {
  window.print();
  window.onafterprint = function() {
    window.close();
  };
};
</script>

</body>
</html>
`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
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

async function confirmarEntrega(id, card) {
  try {
    card.classList.add('confirmed');

    await fetch(`${API_BASE_URL}/gestor-entregas/${id}/entregar`, {
      method: 'PATCH'
    });

    setTimeout(() => {
      card.remove();
    }, 250);

  } catch (err) {
    console.error('Error confirmando entrega', err);
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
