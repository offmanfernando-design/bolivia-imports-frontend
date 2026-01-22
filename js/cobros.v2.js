import API_BASE_URL from './config.js';

let fechaFiltro = '';
let tabActual = 'pendiente';
let textoBusqueda = '';
let datos = [];

/* ===============================
   INIT
================================ */
document.addEventListener('DOMContentLoaded', () => {
  cargarCobros();
});

/* ===============================
   TABS
================================ */
window.cambiarTab = function (tab, btn) {
  tabActual = tab;

  document.querySelectorAll('.tab')
    .forEach(b => b.classList.remove('active'));

  if (btn) btn.classList.add('active');

  cargarCobros();
};

/* ===============================
   BUSCADOR
================================ */
window.aplicarBusqueda = function () {
  const input = document.getElementById('buscadorCobros');
  const fechaInput = document.getElementById('filtroFecha');

  textoBusqueda = (input.value || '').toLowerCase();
  fechaFiltro = fechaInput ? fechaInput.value : '';

  render();
};

/* ===============================
   CARGAR COBROS
================================ */
async function cargarCobros() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = 'Cargando...';

  try {
    const res = await fetch(
      `${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`
    );

    datos = await res.json();
    render();
  } catch (e) {
    cont.innerHTML = 'Error al cargar cobros';
    console.error(e);
  }
}

/* ===============================
   RENDER
================================ */
function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  const filtrados = datos.filter(c => {
    if (textoBusqueda) {
      const texto = `
        ${c.cliente_nombre}
        ${c.cliente_telefono}
      `.toLowerCase();
      if (!texto.includes(textoBusqueda)) return false;
    }
    return true;
  });

  filtrados.forEach(c => {
    const div = document.createElement('div');
    div.className = 'card';

    let accionesHTML = '';

    if (tabActual === 'pendiente') {
      accionesHTML = `
        <button onclick="avisar('${c.cliente_id}', '${c.cliente_telefono || ''}')">
          Avisar
        </button>
      `;
    }

    if (tabActual === 'avisado') {
      accionesHTML = `
        <button onclick="pagar('${c.cliente_id}')">
          Confirmar pago
        </button>
      `;
    }

    if (tabActual === 'pagado') {
      accionesHTML = `<small>Pago confirmado</small>`;
    }

    div.innerHTML = `
      <strong>${c.cliente_nombre}</strong>
      <small>Total: ${c.monto_total_bs} Bs</small>
      ${accionesHTML}
    `;

    cont.appendChild(div);
  });
}

/* ===============================
   ACCIONES
================================ */
window.avisar = async function (clienteId, telefono) {
  if (!confirm('¿Enviar aviso de cobro por WhatsApp?')) return;

  // 👉 1. Abrir WhatsApp (ESTO FALTABA)
  if (telefono) {
    const mensaje = encodeURIComponent(
      'Hola, te escribimos de Bolivia Imports para informarte que tienes un pago pendiente. Gracias.'
    );
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  // 👉 2. Marcar como avisado en backend
  await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};

window.pagar = async function (clienteId) {
  if (!confirm('¿Confirmar pago recibido?')) return;

  await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};
