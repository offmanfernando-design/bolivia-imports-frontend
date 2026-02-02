import API_BASE_URL from './config.js';

let estadoActual = 'en_almacen';

const lista = document.getElementById('listaEntregas');
const searchInput = document.getElementById('searchInput');
const tabAlmacen = document.getElementById('tab-almacen');
const tabHistorial = document.getElementById('tab-historial');

tabAlmacen.onclick = () => cambiarEstado('en_almacen');
tabHistorial.onclick = () => cambiarEstado('entregado');

searchInput.addEventListener('input', cargarEntregas);

/* =========================
   CAMBIO DE TAB
   ========================= */
async function cambiarEstado(estado) {
  estadoActual = estado;

  tabAlmacen.classList.toggle('active', estado === 'en_almacen');
  tabHistorial.classList.toggle('active', estado === 'entregado');

  cargarEntregas();
}

/* =========================
   CARGAR ENTREGAS
   ========================= */
async function cargarEntregas() {
  const search = searchInput.value.trim();
  let url = `${API_BASE_URL}/gestor-entregas?estado=${estadoActual}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const res = await fetch(url);
  const json = await res.json();

  lista.innerHTML = '';

  if (!json.data || json.data.length === 0) {
    lista.innerHTML = `<p style="text-align:center;color:#777;">Sin resultados</p>`;
    return;
  }

  json.data.forEach(renderFila);
}

/* =========================
   FILA DE ENTREGA
   ========================= */
function renderFila(entrega) {
  const div = document.createElement('div');
  div.className = 'fila';

  div.innerHTML = `
    <strong>${entrega.cliente_nombre}</strong>
    <div class="ubicacion">📍 <b>${entrega.ubicacion_fisica}</b></div>
    <div class="monto">💰 Bs ${entrega.monto_total_bs}</div>
  `;

  div.onclick = () => abrirDetalle(entrega.entrega_id);
  lista.appendChild(div);
}

/* =========================
   DETALLE / MODAL
   ========================= */
async function abrirDetalle(entrega_id) {
  const res = await fetch(`${API_BASE_URL}/gestor-entregas/${entrega_id}`);
  const json = await res.json();
  const e = json.data;

  document.getElementById('modal-content').innerHTML = `
    <h3>📍 UBICACIÓN: ${e.ubicacion_fisica}</h3>

    <p><b>Cliente:</b> ${e.cliente_nombre}</p>
    <p><b>Descripción:</b> ${e.descripcion_producto}</p>
    <p><b>Ítems:</b> ${e.cantidad_items}</p>
    <p><b>Monto:</b> Bs ${e.monto_total_bs}</p>

    ${
      e.estado_operativo === 'en_almacen'
        ? `<button class="confirmar" onclick="confirmarEntrega('${e.entrega_id}')">
             ✅ Confirmar entrega
           </button>`
        : `<p style="text-align:center;color:#777;"><i>Entrega ya realizada</i></p>`
    }
  `;

  document.getElementById('modal').classList.remove('hidden');
}

/* =========================
   CONFIRMAR ENTREGA
   ========================= */
async function confirmarEntrega(entrega_id) {
  if (!confirm('¿Confirmar entrega?')) return;

  await fetch(`${API_BASE_URL}/gestor-entregas/${entrega_id}/entregar`, {
    method: 'PATCH',
  });

  cerrarModal();
  cargarEntregas();
}

/* =========================
   CERRAR MODAL
   ========================= */
function cerrarModal() {
  document.getElementById('modal').classList.add('hidden');
}

/* =========================
   INIT
   ========================= */
cargarEntregas();
