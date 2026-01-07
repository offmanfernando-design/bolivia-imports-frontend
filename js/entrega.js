const entrega = JSON.parse(localStorage.getItem("entrega"));
const info = document.getElementById("info");
const estadoEl = document.getElementById("estado");

if (!entrega) {
  window.location.href = "./confirmar.html";
}

// Render info
info.innerHTML = `
  <p><strong>Cliente:</strong> ${entrega.cliente}</p>
  <p><strong>ID:</strong> ${entrega.id}</p>
  <p><strong>Descripción:</strong> ${entrega.descripcion}</p>
`;

// BLOQUEO SI YA ESTÁ ENTREGADO
if (entrega.estado === "ENTREGADO") {
  document.querySelector("button").style.display = "none";
  estadoEl.textContent = "⚠️ Esta entrega ya fue confirmada anteriormente.";
  estadoEl.style.color = "green";
}

// Confirmar entrega
async function confirmar() {
  estadoEl.textContent = "Confirmando entrega…";

  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        accion: "confirmarEntrega",
        id: entrega.id
      })
    });

    const data = await res.json();

    if (data.ok) {
      entrega.estado = "ENTREGADO";
      localStorage.setItem("entrega", JSON.stringify(entrega));
      window.location.href = "./resultado.html";
    } else {
      estadoEl.textContent = data.mensaje || "Error al confirmar";
    }

  } catch (err) {
    estadoEl.textContent = "Error de conexión";
  }
}
