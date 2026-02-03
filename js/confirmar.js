import API_BASE_URL from './config.js';

/* =========================
   ESTADO GLOBAL
   ========================= */
let estadoActual = 'en_almacen';

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');
const tabAlmacen = document.getElementById('tab-almacen');
const tabHistorial = document.getElementById('tab-historial');

/* =========================
   MODAL
   ========================= */
const appModal = document.getElementById('appModal');
const appModalMessage = document.getElementById('appModalMessage');
const appModalClose = document.getElementById('appModalClose');

function showModal(msg) {
  appModalMessage.textContent = msg;
  appModal.classList.remove('hidden');
}

appModalClose.onclick = () => {
  appModal.classList.add('hidden');
};

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
   AGRUPAR POR CLIENTE
   ========================= */
function agruparPorCliente(entregas) {
  return entregas.reduce((acc, e) => {
    if (!acc[e.cliente_nombre]) acc[e.cliente_nombre] = [];
    acc[e.cliente_nombre].push(e);
    return acc;
  }, {});
}

/* =========================
   CARGAR ENTREGAS
   ========================= */
async function cargarEntregas() {
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  try {
    const res = await fetch(url);
    const json = await res.json();

    lista.innerHTML = '';

    if (!json.data || json.data.length === 0) {
      lista.innerHTML = `<p class="empty">No hay entregas</p>`;
      return;
    }

    const grupos = agruparPorCliente(json.data);

    Object.entries(grupos).forEach(([cliente, entregas]) => {
      renderGrupo(cliente, entregas);
    });

  } catch (e) {
    console.error(e);
    showModal('Error al cargar entregas');
  }
}

searchInput.oninput = cargarEntregas;

/* =========================
   RENDER GRUPO CLIENTE
   ========================= */
function renderGrupo(cliente, entregas) {
  const grupo = document.createElement('div');
  grupo.className = 'cliente-group';

  grupo.innerHTML = `
    <div class="cliente-header">${cliente}</div>
  `;

  entregas.forEach(e => {
    grupo.appendChild(renderEntrega(e));
  });

  lista.appendChild(grupo);
}

/* =========================
   RENDER ENTREGA (SWIPE)
   ========================= */
function renderEntrega(entrega) {
  const card = document.createElement('div');
  card.className = 'entrega swipe-card';

  card.innerHTML = `
    <div class="swipe-bg">✔ Entregado</div>

    <div class="swipe-content">
      <div class="entrega-row">

        <div class="entrega-monto">
          Bs ${entrega.monto_total_bs}
        </div>

        <div class="entrega-producto">
          ${entrega.descripcion_producto || 'Producto sin descripción'}
        </div>

        <div class="entrega-ubicacion">
          <span class="material-symbols-rounded">location_on</span>
          ${entrega.ubicacion_fisica || 'Sin ubicación'}
        </div>

      </div>
    </div>
  `;

  let startX = 0;
  let currentX = 0;
  let dragging = false;
  const content = card.querySelector('.swipe-content');

  card.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    dragging = true;
    content.style.transition = 'none';
  });

  card.addEventListener('touchmove', e => {
    if (!dragging) return;
    currentX = e.touches[0].clientX - startX;
    if (currentX > 0) {
      content.style.transform = `translateX(${currentX}px)`;
    }
  });

  card.addEventListener('touchend', () => {
    dragging = false;
    content.style.transition = 'transform .25s ease';

    if (currentX > 90) {
      confirmarEntrega(entrega.entrega_id, entrega);
    }

    content.style.transform = 'translateX(0)';
    currentX = 0;
  });

  return card;
}

/* =========================
   CONFIRMAR ENTREGA
   ========================= */
async function confirmarEntrega(id, entrega) {
  showModal(`Confirmar entrega:\n${entrega.cliente_nombre}`);

  appModalClose.onclick = async () => {
    appModal.classList.add('hidden');

    try {
      await fetch(`${API_BASE_URL}/gestor-entregas/${id}/entregar`, {
        method: 'PATCH'
      });
      cargarEntregas();
    } catch {
      showModal('Error al confirmar');
    }
  };
}

/* INIT */
cargarEntregas();
