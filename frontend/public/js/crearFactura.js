
let clienteSeleccionado = null;
let productosFactura = [];
let todosLosProductos = [];

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', function () {
    // Esperar un poco para asegurar que todos los elementos están disponibles
    setTimeout(() => {
        configurarTiposCliente();
        cargarProductos();
    }, 100);
});

// Configurar los radio buttons para tipos de cliente
function configurarTiposCliente() {
    const radios = document.querySelectorAll('input[name="tipoCliente"]');
    const seccionRegistrado = document.getElementById('seccionClienteRegistrado');
    const seccionManual = document.getElementById('seccionClienteManual');

    // Verificar que los elementos existen
    if (!seccionRegistrado || !seccionManual) {
        console.error('No se encontraron las secciones de cliente');
        return;
    }

    radios.forEach(radio => {
        radio.addEventListener('change', function() {
            limpiarClienteSeleccionado();
            
            if (this.value === 'registrado') {
                seccionRegistrado.style.display = 'block';
                seccionManual.style.display = 'none';
            } else if (this.value === 'manual') {
                seccionRegistrado.style.display = 'none';
                seccionManual.style.display = 'block';
                // Hacer focus en el campo de email manual
                setTimeout(() => {
                    const emailManualInput = document.getElementById('emailClienteManual');
                    if (emailManualInput) {
                        emailManualInput.focus();
                    }
                }, 100);
            } else { // no-especificado
                seccionRegistrado.style.display = 'none';
                seccionManual.style.display = 'none';
                // Configurar cliente como "No especificado"
                clienteSeleccionado = {
                    tipo: 'no-especificado',
                    email: 'no-especificado@petmarket.com',
                    nombre: 'Cliente No Especificado'
                };
                mostrarClienteNoEspecificado();
            }
            validarFormulario();
        });
    });

    // Event listener para email manual
    const emailManualInput = document.getElementById('emailClienteManual');
    if (emailManualInput) {
        emailManualInput.addEventListener('input', function() {
            const email = this.value.trim();
            if (email && email.includes('@')) {
                clienteSeleccionado = {
                    tipo: 'manual',
                    email: email,
                    nombre: 'Cliente Manual'
                };
                mostrarClienteManual(email);
            } else {
                // Solo limpiar si estamos en modo manual
                const tipoActual = document.querySelector('input[name="tipoCliente"]:checked')?.value;
                if (tipoActual === 'manual') {
                    clienteSeleccionado = null;
                    document.getElementById('clienteSeleccionado').style.display = 'none';
                }
            }
            validarFormulario();
        });
    }
}

// Buscar cliente por email
document.getElementById('btnBuscarCliente').addEventListener('click', async function () {
    const email = document.getElementById('emailCliente').value;
    if (!email) {
        showModal.warning('Por favor ingrese un email válido', 'El campo de email es obligatorio para buscar al cliente.');
        return;
    }

    try {
        const response = await fetch(`/clientes/api/buscar?email=${encodeURIComponent(email)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok && data) {
            clienteSeleccionado = data;
            mostrarClienteSeleccionado(data);
            validarFormulario();
        } else {
            showModal.error('Cliente no encontrado', data.mensaje || 'No se encontró ningún cliente con el email proporcionado.');
            limpiarClienteSeleccionado();
        }
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        showModal.error('Error de conexión', 'No se pudo conectar con el servidor. Por favor, verifica tu conexión a internet.');
    }
});

function mostrarClienteSeleccionado(cliente) {
    clienteSeleccionado = {
        tipo: 'registrado',
        _id: cliente._id,
        email: cliente.email,
        nombre: cliente.nombre,
        telefono: cliente.telefono
    };
    
    document.getElementById('infoCliente').innerHTML = `
                <strong>${cliente.nombre}</strong><br>
                <small>Email: ${cliente.email}</small><br>
                <small>Teléfono: ${cliente.telefono || 'No especificado'}</small>
            `;
    document.getElementById('clienteId').value = cliente._id;
    document.getElementById('clienteEmail').value = cliente.email;
    document.getElementById('clienteNombre').value = cliente.nombre;
    document.getElementById('clienteSeleccionado').style.display = 'block';
}

function mostrarClienteManual(email) {
    document.getElementById('infoCliente').innerHTML = `
                <strong>Cliente Manual</strong><br>
                <small>Email: ${email}</small><br>
                <small class="text-muted">Cliente no registrado en el sistema</small>
            `;
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteEmail').value = email;
    document.getElementById('clienteNombre').value = 'Cliente Manual';
    document.getElementById('clienteSeleccionado').style.display = 'block';
}

function mostrarClienteNoEspecificado() {
    document.getElementById('infoCliente').innerHTML = `
                <strong>Cliente No Especificado</strong><br>
                <small class="text-muted">Venta sin datos de cliente</small>
            `;
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteEmail').value = 'no-especificado@petmarket.com';
    document.getElementById('clienteNombre').value = 'Cliente No Especificado';
    document.getElementById('clienteSeleccionado').style.display = 'block';
}

function limpiarClienteSeleccionado() {
    clienteSeleccionado = null;
    document.getElementById('clienteSeleccionado').style.display = 'none';
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteEmail').value = '';
    document.getElementById('clienteNombre').value = '';
    // Solo limpiar el email manual si no está siendo usado actualmente
    const tipoActual = document.querySelector('input[name="tipoCliente"]:checked')?.value;
    if (tipoActual !== 'manual') {
        document.getElementById('emailClienteManual').value = '';
    }
    validarFormulario();
}

// Cargar productos
async function cargarProductos() {
    try {
        const response = await fetch('/productos/api');
        const productos = await response.json();
        todosLosProductos = productos;
        mostrarProductos(productos);
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

function mostrarProductos(productos) {
    const listaProductos = document.getElementById('listaProductos');
    listaProductos.innerHTML = '';

    productos.forEach(producto => {
        const productoDiv = document.createElement('div');
        const sinStock = producto.stock <= 0;
        
        productoDiv.className = `producto-item p-2 border-bottom ${sinStock ? 'bg-light text-muted' : ''}`;
        productoDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong class="${sinStock ? 'text-muted' : ''}">${producto.nombre}</strong><br>
                            <small class="${sinStock ? 'text-danger' : ''}">
                                Stock: ${producto.stock} | Precio: $${producto.precio}
                                ${sinStock ? ' - <strong>SIN STOCK</strong>' : ''}
                            </small>
                        </div>
                        <button type="button" 
                                class="btn btn-sm ${sinStock ? 'btn-secondary' : 'btn-outline-primary'}" 
                                onclick="agregarProducto('${producto._id}')"
                                ${sinStock ? 'disabled title="Sin stock disponible"' : ''}>
                            <i class="fas fa-plus"></i>
                        </button>
                    </div>
                `;
        listaProductos.appendChild(productoDiv);
    });
}

// Buscar productos
document.getElementById('buscarProducto').addEventListener('input', function () {
    const termino = this.value.toLowerCase();
    const productosFiltrados = todosLosProductos.filter(producto =>
        producto.nombre.toLowerCase().includes(termino)
    );
    mostrarProductos(productosFiltrados);
});

function agregarProducto(productoId) {
    const producto = todosLosProductos.find(p => p._id === productoId);
    if (!producto) return;

    // Verificar que hay stock disponible antes de agregar
    if (producto.stock <= 0) {
        showModal.warning('Sin stock disponible', `El producto "${producto.nombre}" no tiene stock disponible.`);
        return;
    }

    const productoExistente = productosFactura.find(p => p.id === productoId);
    if (productoExistente) {
        if (productoExistente.cantidad < producto.stock) {
            productoExistente.cantidad++;
        } else {
            showModal.warning('Stock insuficiente', `Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}".`);
            return;
        }
    } else {
        productosFactura.push({
            id: productoId,
            nombre: producto.nombre,
            precio: producto.precio,
            cantidad: 1,
            stock: producto.stock
        });
    }

    mostrarProductosSeleccionados();
    calcularTotales();
    validarFormulario();
}

function mostrarProductosSeleccionados() {
    const contenedor = document.getElementById('productosSeleccionados');

    if (productosFactura.length === 0) {
        contenedor.innerHTML = '<p class="text-muted">No hay productos seleccionados</p>';
        return;
    }

    contenedor.innerHTML = productosFactura.map(producto => `
                <div class="producto-seleccionado">
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${producto.nombre}</strong><br>
                            <small>Precio unitario: $${producto.precio}</small>
                        </div>
                        <div class="d-flex align-items-center">
                            <button type="button" class="btn btn-sm btn-outline-secondary me-2" onclick="cambiarCantidad('${producto.id}', -1)">
                                <i class="fas fa-minus"></i>
                            </button>
                            <span class="mx-2">${producto.cantidad}</span>
                            <button type="button" class="btn btn-sm btn-outline-secondary me-2" onclick="cambiarCantidad('${producto.id}', 1)">
                                <i class="fas fa-plus"></i>
                            </button>
                            <button type="button" class="btn btn-sm btn-outline-danger" onclick="eliminarProducto('${producto.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                    <div class="mt-2">
                        <strong>Subtotal: $${(producto.precio * producto.cantidad).toFixed(2)}</strong>
                    </div>
                </div>
            `).join('');
}

function cambiarCantidad(productoId, cambio) {
    const producto = productosFactura.find(p => p.id === productoId);
    if (!producto) return;

    const nuevaCantidad = producto.cantidad + cambio;

    if (nuevaCantidad <= 0) {
        eliminarProducto(productoId);
        return;
    }

    if (nuevaCantidad > producto.stock) {
        showModal.warning('Stock insuficiente', `Solo hay ${producto.stock} unidades disponibles de "${producto.nombre}".`);
        return;
    }

    producto.cantidad = nuevaCantidad;
    mostrarProductosSeleccionados();
    calcularTotales();
}

function eliminarProducto(productoId) {
    productosFactura = productosFactura.filter(p => p.id !== productoId);
    mostrarProductosSeleccionados();
    calcularTotales();
    validarFormulario();
}

function calcularTotales() {
    const subtotal = productosFactura.reduce((sum, producto) => sum + (producto.precio * producto.cantidad), 0);
    const total = subtotal; // Sin IVA

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function validarFormulario() {
    const btnCrear = document.getElementById('btnCrearFactura');
    const tipoCliente = document.querySelector('input[name="tipoCliente"]:checked').value;
    let tieneCliente = false;

    if (tipoCliente === 'registrado') {
        tieneCliente = clienteSeleccionado !== null && clienteSeleccionado.tipo === 'registrado';
    } else if (tipoCliente === 'manual') {
        const emailManual = document.getElementById('emailClienteManual').value.trim();
        tieneCliente = emailManual && emailManual.includes('@');
    } else if (tipoCliente === 'no-especificado') {
        tieneCliente = true; // Siempre válido para no especificado
    }

    const tieneProductos = productosFactura.length > 0;
    btnCrear.disabled = !(tieneCliente && tieneProductos);
}

// Enviar formulario
document.getElementById('formCrearFactura').addEventListener('submit', async function (e) {
    e.preventDefault();

    const tipoCliente = document.querySelector('input[name="tipoCliente"]:checked').value;
    
    if (productosFactura.length === 0) {
        showModal.warning('Datos incompletos', 'Debe agregar al menos un producto para crear la factura.');
        return;
    }

    // Preparar datos del cliente según el tipo
    let datosCliente = {};
    
    if (tipoCliente === 'registrado') {
        if (!clienteSeleccionado || clienteSeleccionado.tipo !== 'registrado') {
            showModal.warning('Cliente requerido', 'Debe buscar y seleccionar un cliente registrado.');
            return;
        }
        datosCliente = {
            tipo: 'registrado',
            id: clienteSeleccionado._id,
            email: clienteSeleccionado.email,
            nombre: clienteSeleccionado.nombre
        };
    } else if (tipoCliente === 'manual') {
        const emailManual = document.getElementById('emailClienteManual').value.trim();
        if (!emailManual || !emailManual.includes('@')) {
            showModal.warning('Email requerido', 'Debe ingresar un email válido para el cliente.');
            return;
        }
        datosCliente = {
            tipo: 'manual',
            email: emailManual,
            nombre: 'Cliente Manual'
        };
    } else { // no-especificado
        datosCliente = {
            tipo: 'no-especificado',
            email: 'no-especificado@petmarket.com',
            nombre: 'Cliente No Especificado'
        };
    }

    const datosFactura = {
        cliente: datosCliente,
        productos: productosFactura,
        metodoPago: document.getElementById('metodoPago').value,
        observaciones: document.getElementById('observaciones').value
    };

    try {
        const response = await fetch('/facturas/api', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datosFactura)
        });

        const data = await response.json();

        if (response.ok) {
            mostrarFacturaCreada(data.factura);
        } else {
            showModal.error('Error al crear la factura', data.mensaje || 'Ocurrió un problema al procesar la factura. Por favor, inténtalo nuevamente.');
        }
    } catch (error) {
        console.error('Error al crear factura:', error);
        showModal.error('Error de conexión', 'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo nuevamente.');
    }
});

// Función para mostrar la factura creada con opciones adicionales
function mostrarFacturaCreada(factura) {
    const container = document.querySelector('.container');
    const fechaFormateada = new Date(factura.fecha).toLocaleDateString('es-CO');
    
    // Generar HTML de productos
    let productosHTML = '';
    factura.productos.forEach(item => {
        productosHTML += `
            <tr>
                <td>${item.nombre}</td>
                <td class="text-center">${item.cantidad}</td>
                <td class="text-end">$${item.precio.toLocaleString('es-CO')}</td>
                <td class="text-end">$${item.subtotal.toLocaleString('es-CO')}</td>
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="row">
            <div class="col-12">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2><i class="fas fa-check-circle text-success"></i> Factura Creada Exitosamente</h2>
                    <a href="/panel" class="btn btn-secondary">
                        <i class="fas fa-arrow-left"></i> Volver al Panel
                    </a>
                </div>
            </div>
        </div>

        <div class="row">
            <div class="col-12">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <div class="d-flex justify-content-between align-items-center">
                            <h4 class="mb-0"><i class="fas fa-file-invoice"></i> Factura #${factura._id.toString().slice(-8).toUpperCase()}</h4>
                            <div>
                                <button class="btn btn-light btn-sm me-2" onclick="enviarFacturaPorCorreo('${factura._id}')">
                                    <i class="fas fa-envelope"></i> Enviar por Correo
                                </button>
                                <button class="btn btn-light btn-sm" onclick="imprimirFactura('${factura._id}')">
                                    <i class="fas fa-print"></i> Imprimir
                                </button>
                            </div>
                        </div>
                    </div>
                    <div class="card-body">
                        <!-- Información de la factura -->
                        <div class="row mb-4">
                            <div class="col-md-4">
                                <h6 class="text-primary"><i class="fas fa-info-circle"></i> Información General</h6>
                                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                                <p><strong>Método de Pago:</strong> ${factura.metodoPago}</p>
                                <p><strong>Estado:</strong> <span class="badge bg-success">${factura.estado}</span></p>
                            </div>
                            <div class="col-md-4">
                                <h6 class="text-primary"><i class="fas fa-user"></i> Cliente</h6>
                                <p><strong>Nombre:</strong> ${factura.nombreCliente}</p>
                                <p><strong>Email:</strong> ${factura.emailCliente}</p>
                            </div>
                            <div class="col-md-4">
                                <h6 class="text-primary"><i class="fas fa-calculator"></i> Totales</h6>
                                <p><strong>Subtotal:</strong> $${factura.subtotal.toLocaleString('es-CO')}</p>
                                <p><strong>Total:</strong> <span class="text-success fw-bold">$${factura.total.toLocaleString('es-CO')}</span></p>
                            </div>
                        </div>

                        <!-- Productos -->
                        <h6 class="text-primary"><i class="fas fa-shopping-cart"></i> Productos</h6>
                        <div class="table-responsive">
                            <table class="table table-striped">
                                <thead class="table-dark">
                                    <tr>
                                        <th>Producto</th>
                                        <th class="text-center">Cantidad</th>
                                        <th class="text-end">Precio Unit.</th>
                                        <th class="text-end">Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${productosHTML}
                                </tbody>
                            </table>
                        </div>

                        ${factura.observaciones ? `
                            <div class="mt-3">
                                <h6 class="text-primary"><i class="fas fa-sticky-note"></i> Observaciones</h6>
                                <div class="alert alert-info">
                                    ${factura.observaciones}
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12 text-center">
                <div class="alert alert-success">
                    <i class="fas fa-info-circle"></i>
                    <strong>¡Factura creada exitosamente!</strong>
                    <br>Puedes enviar la factura al cliente por correo electrónico o imprimirla usando los botones de arriba.
                </div>
            </div>
        </div>
    `;
}

// Función para enviar factura por correo
async function enviarFacturaPorCorreo(facturaId) {
    const button = event.target;
    
    try {
        // Cambiar botón a estado de carga
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        button.disabled = true;

        const response = await fetch(`/facturas/api/${facturaId}/enviar-correo`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include'
        });

        const data = await response.json();

        if (response.ok) {
            // Cambiar botón a estado de éxito
            button.innerHTML = '<i class="fas fa-check"></i> Factura Enviada';
            button.className = 'btn btn-success btn-sm me-2';
            showModal.success('Factura enviada por correo', `La factura ha sido enviada exitosamente a ${data.email}`);
        } else {
            // Restaurar botón en caso de error
            button.innerHTML = '<i class="fas fa-envelope"></i> Enviar por Correo';
            button.disabled = false;
            showModal.error('Error al enviar factura', data.mensaje || 'No se pudo enviar la factura por correo electrónico.');
        }

    } catch (error) {
        console.error('Error al enviar factura:', error);
        // Restaurar botón en caso de error
        button.innerHTML = '<i class="fas fa-envelope"></i> Enviar por Correo';
        button.disabled = false;
        showModal.error('Error de conexión', 'No se pudo conectar con el servidor para enviar la factura por correo.');
    }
}

// Función para imprimir factura
async function imprimirFactura(facturaId) {
    try {
        const button = event.target;
        const originalText = button.innerHTML;
        
        // Cambiar botón a estado de carga
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparando...';
        button.disabled = true;

        // Abrir la factura en una nueva ventana para impresión
        const printWindow = window.open(`/facturas/api/${facturaId}/pdf`, '_blank');
        
        if (printWindow) {
            // Esperar a que cargue y luego activar impresión
            printWindow.onload = function() {
                setTimeout(() => {
                    printWindow.print();
                }, 1000);
            };
        } else {
            showModal.error('Error de impresión', 'No se pudo abrir la ventana de impresión. Verifica que no esté bloqueada por tu navegador.');
        }

    } catch (error) {
        console.error('Error al imprimir factura:', error);
        showModal.error('Error al imprimir', 'Ocurrió un problema al preparar la factura para impresión.');
    } finally {
        // Restaurar botón
        const button = event.target;
        button.innerHTML = '<i class="fas fa-print"></i> Imprimir';
        button.disabled = false;
    }
}
