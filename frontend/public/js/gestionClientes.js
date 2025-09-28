$(document).ready(function () {
  console.log('🔧 Inicializando Gestión de Clientes');
  
  const token = localStorage.getItem('token'); // ✅ Obtenemos token
  console.log('Token disponible:', !!token);

  // ----------------------------
  // DataTable (clientes)
  // ----------------------------
  if (document.querySelector('#tablaClientes') && !$.fn.DataTable.isDataTable('#tablaClientes')) {
    try {
      $('#tablaClientes').DataTable({
        responsive: true,
        language: {
          search: "Buscar:",
          lengthMenu: "Mostrar _MENU_ registros",
          info: "Mostrando _START_ a _END_ de _TOTAL_ clientes",
          paginate: { first: "Primero", last: "Último", next: "Siguiente", previous: "Anterior" },
          emptyTable: "No hay clientes registrados",
          zeroRecords: "No se encontraron coincidencias"
        },
        columnDefs: [{ targets: 3, orderable: false }],
        drawCallback: function () {
          console.log('DataTable redibujado - agregando event listeners');
          // Re-agregar event listeners después del redibujado
          attachEditDeleteListeners();
        }
      });
      console.log('✅ DataTable inicializado OK');
    } catch (err) {
      console.warn('❌ No se pudo inicializar DataTable:', err.message);
    }
  }

  // Función para agregar event listeners
  function attachEditDeleteListeners() {
    // Remover listeners anteriores para evitar duplicados
    $(document).off('click', '.btn-editar');
    $(document).off('click', '.btn-eliminar');
    
    // Agregar nuevos listeners
    $(document).on('click', '.btn-editar', handleEditarCliente);
    $(document).on('click', '.btn-eliminar', handleEliminarCliente);
  }

  // Llamar inicialmente
  attachEditDeleteListeners();

  // ----------------------------
  // Editar cliente (abrir modal)
  // ----------------------------
  function handleEditarCliente() {
    console.log('🔧 Botón editar clickeado');
    const fila = $(this).closest('tr');
    const clienteId = fila.data('id');
    
    console.log('ID del cliente:', clienteId);
    console.log('Datos de la fila:', {
      nombre: fila.find('td:eq(0)').text().trim(),
      correo: fila.find('td:eq(1)').text().trim(),
      telefono: fila.find('td:eq(2)').text().trim(),
      direccion: fila.data('direccion')
    });

    $('#editarId').val(clienteId);
    $('#editarNombre').val(fila.find('td:eq(0)').text().trim());
    $('#editarCorreo').val(fila.find('td:eq(1)').text().trim());
    $('#editarTelefono').val(fila.find('td:eq(2)').text().trim());

    const direccion = fila.data('direccion') || '';
    $('#editarDireccion').val(direccion);

    console.log('Abriendo modal de edición');
    $('#editarModal').modal('show');
  }

  // ----------------------------
  // Guardar edición cliente
  // ----------------------------
  $('#formEditarCliente').on('submit', async function (e) {
    e.preventDefault();
    console.log('📝 Formulario de edición enviado');

    const id = $('#editarId').val();
    const data = {
      nombre: ($('#editarNombre').val() || '').trim(),
      email: ($('#editarCorreo').val() || '').trim().toLowerCase(),
      telefono: ($('#editarTelefono').val() || '').trim(),
      direccion: ($('#editarDireccion').val() || '').trim()
    };

    console.log('Datos a enviar:', data);
    console.log('ID del cliente:', id);

    // Validaciones básicas
    if (!data.nombre || !data.email) {
      alert('Nombre y correo son obligatorios');
      return;
    }

    if (!token) {
      console.error('❌ No hay token disponible');
      alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      return;
    }

    try {
      console.log('Enviando petición PUT a:', `/clientes/${id}`);
      const res = await fetch(`/clientes/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // ✅ token agregado
        },
        body: JSON.stringify(data)
      });

      console.log('Respuesta del servidor:', res.status, res.statusText);

      if (res.ok) {
        console.log('✅ Cliente actualizado exitosamente');
        $('#editarModal').modal('hide');
        
        const confirmModalId = 'confirmacionModal';
        if (document.getElementById(confirmModalId)) {
          const modal = new bootstrap.Modal(document.getElementById(confirmModalId));
          modal.show();
          setTimeout(() => {
            console.log('Recargando página...');
            location.reload();
          }, 1200);
        } else {
          console.log('Modal de confirmación no encontrado, recargando inmediatamente');
          location.reload();
        }
      } else {
        const err = await res.json().catch(() => null);
        const errorMsg = err?.mensaje || (res.status === 409 ? 'Este correo ya existe' : `Error al actualizar (${res.status})`);
        console.error('❌ Error del servidor:', errorMsg);
        alert(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error al editar cliente:', error);
      alert('Error de conexión al editar el cliente.');
    }
  });

  // ----------------------------
  // Eliminar cliente
  // ----------------------------
  function handleEliminarCliente() {
    console.log('🗑️ Botón eliminar clickeado');
    const fila = $(this).closest('tr');
    const clienteId = fila.data('id');
    const nombreCliente = fila.find('td:eq(0)').text().trim();
    
    console.log('ID del cliente a eliminar:', clienteId);
    console.log('Nombre del cliente:', nombreCliente);
    
    $('#btnConfirmarEliminar').data('id', clienteId);
    
    // Mostrar nombre del cliente en el modal de confirmación
    const modalBody = $('#confirmarEliminacionModal .modal-body');
    modalBody.html(`¿Estás seguro que deseas eliminar al cliente <strong>${nombreCliente}</strong>?`);
    
    console.log('Abriendo modal de confirmación');
    new bootstrap.Modal(document.getElementById('confirmarEliminacionModal')).show();
  }

  $('#btnConfirmarEliminar').on('click', async function () {
    const id = $(this).data('id');
    console.log('🗑️ Confirmando eliminación del cliente ID:', id);
    
    if (!id) {
      console.error('❌ No se encontró ID del cliente');
      alert('Error: No se pudo identificar el cliente a eliminar');
      return;
    }

    if (!token) {
      console.error('❌ No hay token disponible');
      alert('Error de autenticación. Por favor, inicia sesión nuevamente.');
      return;
    }

    try {
      console.log('Enviando petición DELETE a:', `/clientes/${id}`);
      const res = await fetch(`/clientes/${id}`, { 
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` } // ✅ token agregado
      });
      
      console.log('Respuesta del servidor:', res.status, res.statusText);
      
      if (res.ok) {
        console.log('✅ Cliente eliminado exitosamente');
        
        // Cerrar modal de confirmación
        const confirmModal = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminacionModal'));
        if (confirmModal) {
          confirmModal.hide();
        }
        
        // Mostrar modal de éxito
        const successModalElement = document.getElementById('eliminacionExitosaModal');
        if (successModalElement) {
          const modal = new bootstrap.Modal(successModalElement);
          modal.show();
          setTimeout(() => {
            console.log('Recargando página...');
            location.reload();
          }, 1200);
        } else {
          console.log('Modal de éxito no encontrado, recargando inmediatamente');
          location.reload();
        }
      } else {
        const errorText = await res.text().catch(() => 'Error desconocido');
        console.error('❌ Error del servidor:', res.status, errorText);
        alert(`Error al eliminar cliente (${res.status}): ${errorText}`);
      }
    } catch (error) {
      console.error('❌ Error al eliminar cliente:', error);
      alert('Error de conexión al eliminar el cliente');
    }
  });

  // ----------------------------
  // Verificaciones finales
  // ----------------------------
  
  // Verificar que los elementos necesarios existan
  setTimeout(() => {
    const verificaciones = {
      'Tabla de clientes': document.getElementById('tablaClientes'),
      'Modal de edición': document.getElementById('editarModal'),
      'Modal de confirmación eliminar': document.getElementById('confirmarEliminacionModal'),
      'Modal de éxito eliminación': document.getElementById('eliminacionExitosaModal'),
      'Botón confirmar eliminar': document.getElementById('btnConfirmarEliminar'),
      'Formulario editar': document.getElementById('formEditarCliente')
    };

    console.log('🔍 Verificando elementos necesarios:');
    Object.entries(verificaciones).forEach(([nombre, elemento]) => {
      if (elemento) {
        console.log(`  ✅ ${nombre}: Encontrado`);
      } else {
        console.error(`  ❌ ${nombre}: NO encontrado`);
      }
    });

    // Verificar botones en la tabla
    const botonesEditar = document.querySelectorAll('.btn-editar');
    const botonesEliminar = document.querySelectorAll('.btn-eliminar');
    
    console.log(`📊 Botones encontrados:`);
    console.log(`  ✏️ Botones editar: ${botonesEditar.length}`);
    console.log(`  🗑️ Botones eliminar: ${botonesEliminar.length}`);

    if (botonesEditar.length === 0 || botonesEliminar.length === 0) {
      console.warn('⚠️ No se encontraron botones de editar/eliminar. Verificar que la tabla tenga datos.');
    }
  }, 1000);

  console.log('✅ Gestión de Clientes inicializado completamente');
});
