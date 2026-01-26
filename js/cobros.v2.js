import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let textoBusqueda = '';
let fechaFiltro = '';
let datos = [];
let contadorAvisos = {}; // contador visual (frontend)

document.addEventListener('DOMContentLoaded', cargarCobros);

/* ========================= */
/* TABS                      */
/* ========================= */

window.cambiarTab = function (tab, btn) {
  tabActual = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cargarCobros();
};

window.aplicarBusqueda = function () {
  textoBusqueda = document.getElementById('buscadorCobros').value.toLowerCase();
  fechaFiltro = document.getElementById('filtroFecha').value;
  render();
};

/* ========================= */
/* DATA LOAD                 */
/* ========================= */

async function cargarCobros() {
  const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
  datos = await res.json();
  render();
}

/* ========================= */
/* RENDER                    */
/* ========================= */

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  // Agrupar por cliente_id
  const grupos = {};
  datos.forEach(c => {
    if (!grupos[c.cliente_id]) grupos[c.cliente_id] = [];
    grupos[c.cliente_id].push(c);
  });

  Object.values(grupos).forEach(grupo => {
    const c0 = grupo[0]; // cliente base

    if (
      textoBusqueda &&
      !c0.cliente_nombre.toLowerCase().includes(textoBusqueda)
    ) return;

    const div = document.createElement('div');
    div.className = 'cobro-card';
    div.dataset.id = c0.cliente_id;

    const total = grupo.reduce(
      (sum, p) => sum + Number(p.monto_total_bs || 0),
      0
    );

    const avisos = contadorAvisos[c0.cliente_id] || 0;

    let bottom = '';

    if (tabActual === 'pendiente') {
      bottom = `
        <button class="cobro-action primary"
          onclick="avisar('${c0.cliente_id}', '${c0.cliente_telefono}', this)">
          Avisar
        </button>`;
    }

    if (tabActual === 'avisado') {
      bottom = `
        <span class="cobro-estado">Avisado · ${avisos}</span>

        <button class="cobro-action"
          onclick="avisar('${c0.cliente_id}', '${c0.cliente_telefono}', this)">
          Reavisar
        </button>

        <button class="cobro-action primary"
          onclick="pagar('${c0.cliente_id}', this)">
          Confirmar pago
        </button>`;
    }

    if (tabActual === 'pagado') {
      bottom = `<span class="cobro-estado pagado">Pago confirmado</span>`;
    }

    div.innerHTML = `
      <div class="cobro-top">
        <div class="cobro-cliente">
          <strong>${c0.cliente_nombre}</strong>
          <span class="cobro-codigo">${c0.cliente_id}</span>
        </div>
        <div class="cobro-monto">${total} Bs</div>
      </div>
      <div class="cobro-bottom">${bottom}</div>
    `;

    cont.appendChild(div);
  });
}

/* ========================= */
/* MENSAJE WHATSAPP (FINAL)  */
/* ========================= */

function generarMensajeWhatsApp(clienteId) {
  const productos = datos.filter(d => d.cliente_id === clienteId);

  if (!productos.length) return '';

  const c0 = productos[0];
  const esSantaCruz =
    (c0.departamento_destino || '').toLowerCase().includes('santa cruz');

  let mensaje = `Hola ${c0.cliente_nombre}\n\n`;

  mensaje += esSantaCruz
    ? 'Tu pedido llegó a nuestra oficina.\n\n'
    : 'Tu pedido ya se encuentra disponible para envío.\n\n';

  let total = 0;

  productos.forEach((p, i) => {
    const peso = Number(p.peso_cobrado) || 0;
    const tipo = Number(p.tipo_de_cobro) || 0;
    const dolar = Number(p.dolar_cliente) || 0;
    const subtotal = Number(p.monto_total_bs) || 0;

    total += subtotal;

    mensaje += `${i + 1}) Producto: ${p.descripcion_producto}\n`;
    mensaje += `Costo: ${peso} kg × ${tipo} × ${dolar} = ${subtotal} Bs\n\n`;
  });

  if (productos.length > 1) {
    mensaje += `Total a pagar: ${total} Bs\n\n`;
  }

  mensaje += 'Pago: QR o efectivo (solo Bs)\n\n';

  if (esSantaCruz) {
    mensaje +=
      'Horario: 09:30 a 12:00 y 14:30 a 18:00\n' +
      'Ubicación: https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n';
  } else {
    mensaje +=
      'Para realizar el envío, por favor confirma los siguientes datos:\n\n' +
      'Nombre completo:\n' +
      'Departamento / destino:\n' +
      'Número de celular:\n\n';
  }

  mensaje += '— Bolivia Imports';

  return encodeURIComponent(mensaje);
}

/* ========================= */
/* ACCIONES                  */
/* ========================= */

window.avisar = async function (clienteId, telefono, btn) {
  contadorAvisos[clienteId] = (contadorAvisos[clienteId] || 0) + 1;

  const card = btn.closest('.cobro-card');
  card.classList.add('leaving');

  const mensaje = generarMensajeWhatsApp(clienteId);

  if (telefono) {
    window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');
  }

  await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  setTimeout(cargarCobros, 160);
};

window.pagar = async function (clienteId, btn) {
  const card = btn.closest('.cobro-card');
  card.classList.add('leaving');

  await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  setTimeout(cargarCobros, 160);
};
