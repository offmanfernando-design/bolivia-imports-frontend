/* =========================================================
   COBROS UI – FRONTEND (ROBUSTO V1)
   Bolivia Imports – Sistema Logístico
   ========================================================= */

const API_URL = 'https://script.google.com/macros/s/AKfycbzbxPWwcJI6XoNlrAA5QlfxNaAg1l78SMB90v2syYOaEIyLpI8j4_ttsyFH3lqF4SfO/exec';

let tabActual = 'pendiente';
let datos = [];
let textoBusqueda = '';

document.addEventListener('DOMContentLoaded', cargarCobros);

/* ===============================
   CARGA BACKEND
================================ */
function cargarCobros() {
  fetch(`${API_URL}?accion=listarCobros`)
    .then(r => r.json())
    .then(res => {
      if (!res.ok) {
        alert(res.mensaje || 'Error backend');
        return;
      }
      datos = res.cobros || [];
      render();
    })
    .catch(() => alert('No conecta con Apps Script'));
}

/* ===============================
   CAMBIO DE TAB
================================ */
function cambiarTab(tab, btn) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  render();
}

/* ===============================
   BUSCADOR
================================ */
function aplicarBusqueda() {
  const input = document.getElementById('buscadorCobros');
  textoBusqueda = (input.value || '').toLowerCase();
  render();
}

/* ===============================
   DETERMINAR ESTADO REAL
================================ */
function estadoCobro(entrega) {
  const cobrado = Number(entrega.monto_cobrado_bs || 0);
  const total = Number(entrega.cobro_total_bs || 0);
  const avisos = Number(entrega.cantidad_avisos || 0);

  if (total > 0 && cobrado >= total) return 'pagado';
  if (avisos > 0) return 'avisado';
  return 'pendiente';
}

/* ===============================
   RENDER
================================ */
function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  const filtrados = datos.filter(d => {

    /* Estado */
    if (estadoCobro(d) !== tabActual) return false;

    /* Búsqueda */
    if (!textoBusqueda) return true;

    const tracking = (d.tracking || '').toString();
    const ultimos4 = tracking.slice(-4);

    const texto = `
      ${d.nombre || ''}
      ${d.numero || ''}
      ${tracking}
      ${ultimos4}
      ${d.entrega_id || ''}
    `.toLowerCase();

    return texto.includes(textoBusqueda);
  });

  if (filtrados.length === 0) {
    cont.innerHTML = `<p style="color:#6b6b6b">Sin resultados</p>`;
    return;
  }

  filtrados.forEach(d => {
    cont.innerHTML += `
      <div class="card">
        <strong>${d.nombre || 'Sin nombre'}</strong>
        <small>Monto: ${Number(d.cobro_total_bs || 0).toFixed(2)} Bs</small>
        ${acciones(d)}
      </div>
    `;
  });
}

/* ===============================
   ACCIONES
================================ */
function acciones(d) {

  if (tabActual === 'pendiente') {
    return `
      <div class="actions">
        <button class="primary" onclick="avisar('${d.entrega_id}')">
          Avisar
        </button>
      </div>
    `;
  }

  if (tabActual === 'avisado') {
    return `
      <div class="actions">
        <button onclick="avisar('${d.entrega_id}')">Reavisar</button>
        <button class="primary" onclick="pagar('${d.entrega_id}')">Pagar</button>
      </div>
    `;
  }

  return '';
}

/* ===============================
   AVISAR
================================ */
function avisar(id) {
  if (!confirm('¿Enviar aviso de cobro?')) return;

  fetch(`${API_URL}?accion=avisarCobro&id=${encodeURIComponent(id)}`)
    .then(() => cargarCobros())
    .catch(() => alert('Error al avisar'));
}

/* ===============================
   PAGAR
================================ */
function pagar(id) {
  if (!confirm('¿Confirmar pago recibido?')) return;

  fetch(`${API_URL}?accion=pagarCobro&id=${encodeURIComponent(id)}&metodo=EFECTIVO`)
    .then(() => cargarCobros())
    .catch(() => alert('Error al pagar'));
}
