import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');
const tabAlmacen = document.getElementById('tab-almacen');
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
tabHistorial.onclick = () => cambiarEstado('entregado');

function cambiarEstado(estado) {
  estadoActual = estado;
  tabAlmacen.classList.toggle('active', estado === 'en_almacen');
  tabHistorial.classList.toggle('active', estado === 'entregado');
  cargarEntregas();
}

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
   CARGAR
   ========================= */
async function cargarEntregas() {
  setConectando();

  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    lista.innerHTML = '';

    const grupos = agruparPorCliente(json.data || []);

    Object.entries(grupos).forEach(([cliente, entregas]) => {
      const h = document.createElement('div');
      h.className = 'cliente-header';
      h.textContent = cliente;
      lista.appendChild(h);

      entregas.forEach(e => lista.appendChild(renderEntrega(e)));
    });

    setConectado();
  } catch {
    setOffline();
  }
}

searchInput.oninput = cargarEntregas;

/* =========================
   RENDER ENTREGA
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

  if (estadoActual !== 'en_almacen') return card;

  let startX = 0;
  let startY = 0;
  let currentX = 0;

  const content = card.querySelector('.swipe-content');

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    card.classList.add('swiping');
    content.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    const dx = e.touches[0].clientX - startX;
    const dy = e.touches[0].clientY - startY;

    if (Math.abs(dy) > Math.abs(dx)) return;

    if (dx < 0) {
      currentX = dx;
      content.style.transform = `translateX(${dx}px)`;
    }
  });

  card.addEventListener('touchend', async () => {
    content.style.transition = 'transform .25s ease';

    if (currentX < -120) {
      card.classList.add('confirmed');
      await confirmarEntrega(entrega.entrega_id);
    }

    card.classList.remove('swiping');
    content.style.transform = 'translateX(0)';
    currentX = 0;
  });

  return card;
}

/* =========================
   CONFIRMAR
   ========================= */
async function confirmarEntrega(id) {
  await fetch(`${API_BASE_URL}/gestor-entregas/${id}/entregar`, {
    method: 'PATCH'
  });
  setTimeout(cargarEntregas, 200);
}

/* INIT */
cargarEntregas();
