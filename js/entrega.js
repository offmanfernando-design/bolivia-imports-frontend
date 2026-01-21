import API_BASE_URL from './config.js';

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('entrega-form');

  if (!form) {
    console.error('No se encontró el formulario entrega-form');
    return;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const entregaId = document.getElementById('entrega_id').value.trim();

    if (!entregaId) {
      alert('Ingresa un ID de entrega');
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/etiquetas/${entregaId}`
      );

      if (!response.ok) {
        throw new Error('Error en la API');
      }

      const html = await response.text();

      const nuevaVentana = window.open('', '_blank');
      nuevaVentana.document.write(html);
      nuevaVentana.document.close();

    } catch (err) {
      console.error(err);
      alert('No se pudo obtener la etiqueta');
    }
  });
});

