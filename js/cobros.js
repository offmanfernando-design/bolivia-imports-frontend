const lista = document.getElementById("lista-cobros");
const estado = document.getElementById("estado");

fetch(`${API_BASE}?accion=listarCobros`)
  .then(res => res.json())
  .then(data => {
    if (!data.ok) {
      estado.textContent = "Error al cargar cobros";
      return;
    }

    if (data.cobros.length === 0) {
      lista.innerHTML = "<p>No hay cobros pendientes</p>";
      return;
    }

    lista.innerHTML = "";

    data.cobros.forEach(c => {
      const div = document.createElement("div");
      div.className = "home-card";

      div.innerHTML = `
        <strong>${c.nombre}</strong>
        <p>ID: ${c.entrega_id}</p>
        <p>Monto: Bs ${c.monto}</p>
        <p>Avisos: ${c.avisos}</p>

        <button onclick="avisar('${c.entrega_id}')">Avisar</button>
        <button onclick="pagar('${c.entrega_id}')">Marcar pagado</button>
      `;

      lista.appendChild(div);
    });
  })
  .catch(() => {
    estado.textContent = "Error de conexión";
  });

function avisar(id) {
  estado.textContent = "Enviando aviso...";

  fetch(`${API_BASE}?accion=avisarCobro&id=${id}`)
    .then(r => r.json())
    .then(res => {
      if (res.ok) {
        estado.textContent = "Aviso registrado";
        location.reload();
      } else {
        estado.textContent = res.mensaje || "Error al avisar";
      }
    })
    .catch(() => {
      estado.textContent = "Error de conexión";
    });
}


function pagar(id) {
  estado.textContent = `Cobro marcado como pagado: ${id}`;
  // luego lo conectamos al backend
}
