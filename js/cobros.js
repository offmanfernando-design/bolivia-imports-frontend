const lista = document.getElementById("lista-cobros");
const estado = document.getElementById("estado");

/**
 * =========================
 * Cargar cobros pendientes
 * =========================
 */
function cargarCobros() {
  fetch(`${API_BASE}?accion=listarCobros`)
    .then(res => res.json())
    .then(data => {
      lista.innerHTML = "";
      estado.textContent = "";

      if (!data.ok || data.cobros.length === 0) {
        lista.innerHTML = "<p>No hay cobros pendientes</p>";
        return;
      }

      data.cobros.forEach(c => {
        const div = document.createElement("div");
        div.className = "home-card";

        div.innerHTML = `
          <strong>${c.nombre}</strong>
          <p>ID: ${c.entrega_id}</p>
          const montoFormateado = Number(c.monto).toLocaleString("es-BO", {
          minimumFractionDigits: c.monto % 1 === 0 ? 0 : 2,
          maximumFractionDigits: 2
         });

          <p>Avisos: ${c.avisos}</p>

          <button class="btn-avisar">Avisar</button>
          <button class="btn-pagar">Marcar pagado</button>
        `;

        div.querySelector(".btn-avisar")
          .addEventListener("click", () => avisar(c.entrega_id));

        div.querySelector(".btn-pagar")
          .addEventListener("click", () => pagar(c.entrega_id));

        lista.appendChild(div);
      });
    })
    .catch(() => {
      estado.textContent = "Error de conexión";
    });
}

/**
 * =========================
 * Avisar cobro
 * =========================
 */
function avisar(id) {
  fetch(`${API_BASE}?accion=avisarCobro&id=${id}&canal=WHATSAPP`)
    .then(res => res.json())
    .then(data => {
      if (data.ok) {
        alert("Aviso registrado");
        cargarCobros(); // refresca sin recargar la página
      } else {
        alert("Error al avisar");
      }
    })
    .catch(() => alert("Error de conexión"));
}

/**
 * =========================
 * Marcar cobro pagado
 * =========================
 */
function pagar(id) {
  if (!confirm("¿Confirmar que el cobro fue PAGADO?")) return;

  fetch(`${API_BASE}?accion=pagarCobro&id=${id}`)
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        estado.textContent = "Error al marcar como pagado";
        return;
      }

      estado.textContent = "Cobro marcado como PAGADO";
      cargarCobros(); // desaparece de la lista
    })
    .catch(() => {
      estado.textContent = "Error de conexión";
    });
}

// 🚀 Inicial
cargarCobros();
