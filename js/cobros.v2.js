import API_BASE_URL from './config.js';

let tabActual = 'pendiente';
let datos = [];

document.addEventListener('DOMContentLoaded', cargarCobros);

async function cargarCobros() {
  const res = await fetch(`${API_BASE_URL}/api/cobros?estado_cobro=${tabActual}`);
  datos = await res.json();
  render();
}

window.cambiarTab = function (tab, btn) {
  tabActual = tab;
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  cargarCobros();
};

function render() {
  const cont = document.getElementById('listaCobros');
  cont.innerHTML = '';

  datos.forEach(c => {
    const div = document.createElement('div');
    let bottom = '';

    if (tabActual === 'pendiente') {
      bottom = `<button class="cobro-action primary"
        onclick="avisar('${c.cliente_id}','${c.cliente_telefono}')">Avisar</button>`;
    }

    if (tabActual === 'avisado') {
      bottom = `
        <span class="cobro-estado">Avisado · ${c.avisos_count}</span>
        <button class="cobro-action"
          onclick="avisar('${c.cliente_id}','${c.cliente_telefono}')">Reavisar</button>
        <button class="cobro-action primary"
          onclick="pagar('${c.cliente_id}')">Confirmar pago</button>`;
    }

    if (tabActual === 'pagado') {
      bottom = `<span class="cobro-estado pagado">Pago confirmado</span>`;
    }

    div.className = 'cobro-card';
    div.innerHTML = `
      <div class="cobro-top">
        <div>
          <strong>${c.cliente_nombre}</strong><br>
          <small>${c.cliente_id}</small>
        </div>
        <div><strong>${c.monto_total_bs} Bs</strong></div>
      </div>
      <div class="cobro-bottom">${bottom}</div>
    `;
    cont.appendChild(div);
  });
}

/* =========================
   MENSAJE FINAL (AGRUPADO)
   ========================= */
async function generarMensaje(clienteId) {
  const res = await fetch(`${API_BASE_URL}/api/cobros/detalle/${clienteId}`);
  const productos = await res.json();

  const c0 = productos[0];
  const esSantaCruz =
    (c0.departamento_destino || '').toLowerCase().includes('santa cruz');

  let msg = `Hola ${c0.cliente_nombre}\n\n`;
  msg += esSantaCruz
    ? 'Tu pedido llegó a nuestra oficina.\n\n'
    : 'Tu pedido ya se encuentra disponible para envío.\n\n';

  let total = 0;

  productos.forEach((p, i) => {
    total += Number(p.monto_total_bs || 0);
    msg += `${i + 1}) Producto: ${p.descripcion_producto}\n`;
    msg += `Costo: ${p.peso_cobrado} kg × ${p.tipo_de_cobro} × ${p.dolar_cliente} = ${p.monto_total_bs} Bs\n\n`;
  });

  if (productos.length > 1) {
    msg += `Total a pagar: ${total} Bs\n\n`;
  }

  msg += 'Pago: QR o efectivo (solo Bs)\n\n';

  msg += esSantaCruz
    ? 'Horario: 09:30–12:00 / 14:30–18:00\nUbicación: https://maps.app.goo.gl/fP472SmY3XjTmJBL8\n\n'
    : 'Para envío confirma:\nNombre completo:\nDepartamento:\nCelular:\n\n';

  msg += '— Bolivia Imports';
  return encodeURIComponent(msg);
}

window.avisar = async function (clienteId, telefono) {
  const mensaje = await generarMensaje(clienteId);
  window.open(`https://wa.me/${telefono}?text=${mensaje}`, '_blank');

  await fetch(`${API_BASE_URL}/api/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
};

window.pagar = async function (clienteId) {
  await fetch(`${API_BASE_URL}/api/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });
  cargarCobros();
};
