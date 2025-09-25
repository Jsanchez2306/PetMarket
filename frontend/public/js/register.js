document.getElementById('formRegistro').addEventListener('submit', async (e) => {
  e.preventDefault();

  // Obtener todos los valores del formulario
  const nombre = document.getElementById('registroNombre').value.trim();
  const email = document.getElementById('registroCorreo').value.trim();
  const telefono = document.getElementById('registroTelefono').value.trim();
  const direccion = document.getElementById('registroDireccion').value.trim();
  const contrasena = document.getElementById('registroPassword').value;
  const confirmar = document.getElementById('registroConfirmarPassword').value;

  const errorElement = document.getElementById('registroMensajeError');
  errorElement.classList.add('d-none');

  // Validaciones del lado del cliente
  if (!nombre) {
    errorElement.textContent = 'El nombre es obligatorio';
    errorElement.classList.remove('d-none');
    return;
  }

  if (nombre.length < 2 || nombre.length > 50) {
    errorElement.textContent = 'El nombre debe tener entre 2 y 50 caracteres';
    errorElement.classList.remove('d-none');
    return;
  }

  if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/.test(nombre)) {
    errorElement.textContent = 'El nombre solo puede contener letras y espacios';
    errorElement.classList.remove('d-none');
    return;
  }

  if (!email) {
    errorElement.textContent = 'El correo electrónico es obligatorio';
    errorElement.classList.remove('d-none');
    return;
  }

  if (!contrasena) {
    errorElement.textContent = 'La contraseña es obligatoria';
    errorElement.classList.remove('d-none');
    return;
  }

  if (contrasena.length < 6) {
    errorElement.textContent = 'La contraseña debe tener al menos 6 caracteres';
    errorElement.classList.remove('d-none');
    return;
  }

  if (contrasena !== confirmar) {
    errorElement.textContent = 'Las contraseñas no coinciden';
    errorElement.classList.remove('d-none');
    return;
  }

  // Validar teléfono si se proporciona
  if (telefono && !/^[0-9]{7,15}$/.test(telefono)) {
    errorElement.textContent = 'El teléfono debe tener entre 7 y 15 dígitos numéricos';
    errorElement.classList.remove('d-none');
    return;
  }

  // Validar dirección si se proporciona
  if (direccion && (direccion.length < 5 || direccion.length > 100)) {
    errorElement.textContent = 'La dirección debe tener entre 5 y 100 caracteres';
    errorElement.classList.remove('d-none');
    return;
  }

  try {
    // Preparar datos para enviar
    const datosRegistro = {
      nombre,
      email,
      contrasena
    };

    // Agregar campos opcionales solo si tienen valor
    if (telefono) datosRegistro.telefono = telefono;
    if (direccion) datosRegistro.direccion = direccion;

    const res = await fetch('/auth/registro', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(datosRegistro)
    });

    const data = await res.json();

    if (res.ok) {
      // Cerrar el modal de registro
      bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();

      // Guardar token y información del usuario (ya viene del registro)
      if (data.token) {
        localStorage.setItem('token', data.token);
        
        // Guardar información del usuario incluyendo tipo y rol
        const userInfo = {
          usuario: data.usuario || data.cliente,
          tipoUsuario: data.tipoUsuario,
          rol: data.rol
        };
        sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

        // Actualizar header si existe el sistema de autenticación
        if (window.authSystem) {
          window.authSystem.token = data.token;
          window.authSystem.userInfo = window.authSystem.getUserInfo();
          window.authSystem.updateHeader();
        }

        // Mostrar mensaje de éxito
        const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
        modal.show();
      } else {
        // Si no hay token, realizar auto-login
        await autoLoginAfterRegister(email, contrasena);
      }
    } else {
      // Cerrar modal de registro y mostrar modal de error
      bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
      
      // Configurar mensaje de error
      const mensajeElemento = document.getElementById('registroErrorMensaje');
      mensajeElemento.textContent = data.mensaje || 'Hubo un problema al crear tu cuenta. Por favor, verifica tus datos e intenta nuevamente.';
      
      // Mostrar modal de error
      const errorModal = new bootstrap.Modal(document.getElementById('registroErrorModal'));
      errorModal.show();
      
      // Limpiar formulario para permitir nuevo intento
      document.getElementById('formRegistro').reset();
      document.getElementById('registroMensajeError').classList.add('d-none');
    }
  } catch (err) {
    console.error('Error al registrar:', err);
    
    // En caso de error de conexión o servidor
    bootstrap.Modal.getInstance(document.getElementById('registerModal')).hide();
    
    const mensajeElemento = document.getElementById('registroErrorMensaje');
    mensajeElemento.textContent = 'Error de conexión. Por favor, verifica tu conexión a internet e intenta nuevamente.';
    
    const errorModal = new bootstrap.Modal(document.getElementById('registroErrorModal'));
    errorModal.show();
    
    // Limpiar formulario para permitir nuevo intento
    document.getElementById('formRegistro').reset();
    document.getElementById('registroMensajeError').classList.add('d-none');
  }
});

// Event listener para manejar el botón "Intentar nuevamente" del modal de error
document.addEventListener('DOMContentLoaded', function() {
  // Cuando se cierre el modal de error y se abra el de registro
  const registroErrorModal = document.getElementById('registroErrorModal');
  if (registroErrorModal) {
    registroErrorModal.addEventListener('hidden.bs.modal', function() {
      // Limpiar cualquier mensaje de error previo
      const errorAlert = document.getElementById('registroMensajeError');
      if (errorAlert) {
        errorAlert.classList.add('d-none');
      }
    });
  }
});

// Función para hacer auto-login después del registro exitoso (respaldo)
async function autoLoginAfterRegister(email, contrasena) {
  try {
    const res = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, contrasena })
    });

    const data = await res.json();

    if (res.ok) {
      localStorage.setItem('token', data.token);
      
      const userInfo = {
        usuario: data.usuario,
        tipoUsuario: data.tipoUsuario,
        rol: data.rol
      };
      sessionStorage.setItem('userInfo', JSON.stringify(userInfo));

      if (window.authSystem) {
        window.authSystem.token = data.token;
        window.authSystem.userInfo = window.authSystem.getUserInfo();
        window.authSystem.updateHeader();
      }

      const modal = new bootstrap.Modal(document.getElementById('registroExitosoModal'));
      modal.show();
    } else {
      const modal = new bootstrap.Modal(document.getElementById('autoLoginFailModal'));
      modal.show();
    }
  } catch (error) {
    console.error('Error en auto-login después del registro:', error);
    const modal = new bootstrap.Modal(document.getElementById('autoLoginFailModal'));
    modal.show();
  }
}

// Agregar validación en tiempo real para contraseñas
document.addEventListener('DOMContentLoaded', function() {
  const passwordRegistro = document.getElementById('registroPassword');
  const passwordConfirmar = document.getElementById('registroConfirmarPassword');
  
  if (passwordRegistro && passwordConfirmar) {
    const validarPasswords = () => {
      if (passwordRegistro.value && passwordConfirmar.value) {
        if (passwordRegistro.value !== passwordConfirmar.value) {
          passwordConfirmar.setCustomValidity('Las contraseñas no coinciden');
          passwordConfirmar.classList.add('is-invalid');
          passwordConfirmar.classList.remove('is-valid');
        } else {
          passwordConfirmar.setCustomValidity('');
          passwordConfirmar.classList.remove('is-invalid');
          passwordConfirmar.classList.add('is-valid');
        }
      } else {
        passwordConfirmar.setCustomValidity('');
        passwordConfirmar.classList.remove('is-invalid', 'is-valid');
      }
    };

    passwordRegistro.addEventListener('input', validarPasswords);
    passwordConfirmar.addEventListener('input', validarPasswords);
  }

  // Validación para el teléfono
  const telefonoInput = document.getElementById('registroTelefono');
  if (telefonoInput) {
    telefonoInput.addEventListener('input', function() {
      const valor = this.value.trim();
      if (valor && !/^[0-9]{7,15}$/.test(valor)) {
        this.setCustomValidity('Debe tener entre 7 y 15 dígitos numéricos');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
        if (valor) this.classList.add('is-valid');
      }
    });
  }

  // Validación para la dirección
  const direccionInput = document.getElementById('registroDireccion');
  if (direccionInput) {
    direccionInput.addEventListener('input', function() {
      const valor = this.value.trim();
      if (valor && (valor.length < 5 || valor.length > 100)) {
        this.setCustomValidity('Debe tener entre 5 y 100 caracteres');
        this.classList.add('is-invalid');
        this.classList.remove('is-valid');
      } else {
        this.setCustomValidity('');
        this.classList.remove('is-invalid');
        if (valor) this.classList.add('is-valid');
      }
    });
  }

  // Limpiar formulario cuando se abre el modal
  const registerModal = document.getElementById('registerModal');
  if (registerModal) {
    registerModal.addEventListener('show.bs.modal', function() {
      const form = document.getElementById('formRegistro');
      if (form) {
        form.reset();
        // Limpiar clases de validación
        const inputs = form.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          input.classList.remove('is-valid', 'is-invalid');
          input.setCustomValidity('');
        });
        // Ocultar mensajes de error
        const errorElement = document.getElementById('registroMensajeError');
        if (errorElement) errorElement.classList.add('d-none');
      }
    });
  }
});
