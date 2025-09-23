
let clienteSeleccionado = null;
let productosFactura = [];
let todosLosProductos = [];

// Cargar productos al iniciar
document.addEventListener('DOMContentLoaded', function () {
    cargarProductos();
});

// Buscar cliente por email
document.getElementById('btnBuscarCliente').addEventListener('click', async function () {
    const email = document.getElementById('emailCliente').value;
    if (!email) {
        alert('Por favor ingrese un email');
        return;
    }

    try {
        const response = await fetch('/clientes/buscar-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok && data.cliente) {
            clienteSeleccionado = data.cliente;
            mostrarClienteSeleccionado(data.cliente);
            validarFormulario();
        } else {
            alert(data.mensaje || 'Cliente no encontrado');
            limpiarClienteSeleccionado();
        }
    } catch (error) {
        console.error('Error al buscar cliente:', error);
        alert('Error al buscar cliente');
    }
});

function mostrarClienteSeleccionado(cliente) {
    document.getElementById('infoCliente').innerHTML = `
                <strong>${cliente.nombre}</strong><br>
                <small>Email: ${cliente.email}</small><br>
                <small>Teléfono: ${cliente.telefono || 'No especificado'}</small>
            `;
    document.getElementById('clienteId').value = cliente._id;
    document.getElementById('clienteSeleccionado').style.display = 'block';
}

function limpiarClienteSeleccionado() {
    clienteSeleccionado = null;
    document.getElementById('clienteSeleccionado').style.display = 'none';
    document.getElementById('clienteId').value = '';
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
        productoDiv.className = 'producto-item p-2 border-bottom';
        productoDiv.innerHTML = `
                    <div class="d-flex justify-content-between align-items-center">
                        <div>
                            <strong>${producto.nombre}</strong><br>
                            <small>Stock: ${producto.stock} | Precio: $${producto.precio}</small>
                        </div>
                        <button type="button" class="btn btn-sm btn-outline-primary" onclick="agregarProducto('${producto._id}')">
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

    const productoExistente = productosFactura.find(p => p.id === productoId);
    if (productoExistente) {
        if (productoExistente.cantidad < producto.stock) {
            productoExistente.cantidad++;
        } else {
            alert('No hay suficiente stock');
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
        alert('No hay suficiente stock');
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
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('iva').textContent = `$${iva.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

function validarFormulario() {
    const btnCrear = document.getElementById('btnCrearFactura');
    const tieneCliente = clienteSeleccionado !== null;
    const tieneProductos = productosFactura.length > 0;

    btnCrear.disabled = !(tieneCliente && tieneProductos);
}

// Enviar formulario
document.getElementById('formCrearFactura').addEventListener('submit', async function (e) {
    e.preventDefault();

    if (!clienteSeleccionado || productosFactura.length === 0) {
        alert('Debe seleccionar un cliente y al menos un producto');
        return;
    }

    const datosFactura = {
        cliente: {
            id: clienteSeleccionado._id
        },
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
            alert('Factura creada exitosamente');
            window.location.href = '/panel';
        } else {
            alert(data.mensaje || 'Error al crear la factura');
        }
    } catch (error) {
        console.error('Error al crear factura:', error);
        alert('Error al crear factura');
    }
});
