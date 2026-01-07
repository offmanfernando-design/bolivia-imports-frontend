function buscar() {
  const codigo = document.getElementById("codigo").value.trim();
  const estado = document.getElementById("estado");

  if (!codigo) {
    estado.textContent = "Ingrese un código";
    return;
  }

  estado.textContent = "Buscando...";

  fetch(`${API_BASE}?accion=buscarEntrega&codigo=${encodeURIComponent(codigo)}`)
    .then(res => res.json())
    .then(data => {
      if (!data.ok) {
        estado.textContent = data.mensaje || "Entrega no encontrada";
        return;
      }

      // 🔑 DATOS REALES DEL BACKEND
      localStorage.setItem("entrega", JSON.stringify(data.entrega));

      window.location.href = "entrega.html";
    })
    .catch(err => {
      console.error(err);
      estado.textContent = "Error de conexión";
    });
}
