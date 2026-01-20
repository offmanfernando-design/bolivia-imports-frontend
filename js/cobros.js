import { API_BASE } from './config.js';

const estadoSelect = document.getElementById('estadoSelect');
const contenedor = document.getElementById('listaCobros');

estadoSelect.addEventListener('change', cargarCobros);

async function cargarCobros() {
  const estado = estadoSelect.value;
  contenedor.innerHTML = 'Cargando...';

  try {
    const res = await fetch(`${API_BASE}/cobros?estado_cobro=${estado}`);
    const data = await res.json();

    // Orden por fecha_ultima_actualizacion (más antiguo primero)
    data.sort((a, b) => {
      const fa = a.fecha_ultima_actualizacion || '';
      const fb = b.fecha_ultima_actualizacion || '';
      return fa.localeCompare(fb);
    });

    renderCobros(data, estado);
  } catch (e) {
    contenedor.innerHTML = 'Error al cargar cobros';
  }
}

function renderCobros(clientes, estado) {
  contenedor.innerHTML = '';

  if (!clientes.length) {
    contenedor.innerHTML = 'No hay registros';
    return;
  }

  clientes.forEach(c => {
    const div = document.createElement('div');
    div.className = 'cliente-card'; // usa tu CSS actual

    div.innerHTML = `
      <h3>${c.cliente_nombre}</h3>
      <p><strong>Tel:</strong> ${c.cliente_telefono}</p>
      <p><strong>Items:</strong> ${c.cantidad_items}</p>
      <p><strong>Total Bs:</strong> ${c.monto_total_bs}</p>

      <button
        ${estado === 'pagado' ? 'disabled' : ''}
        onclick="avisar('${c.cliente_id}', '${estado}')"
      >
        ${estado === 'avisado' ? 'Re-avisar' : 'Avisar'}
      </button>

      <button
        ${estado !== 'avisado' ? 'disabled' : ''}
        onclick="pagar('${c.cliente_id}')"
      >
        Confirmar pago
      </button>
    `;

    contenedor.appendChild(div);
  });
}

async function avisar(clienteId) {
  if (!confirm('¿Enviar aviso al cliente?')) return;

  await fetch(`${API_BASE}/cobros/avisar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
}

async function pagar(clienteId) {
  if (!confirm('¿Confirmar pago del cliente?')) return;

  await fetch(`${API_BASE}/cobros/pagar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cliente_id: clienteId })
  });

  cargarCobros();
}

// inicial
cargarCobros();
