// document.addEventListener("DOMContentLoaded", function () {
//     let loginForm = document.querySelector("#loginModal form");
//     if (loginForm) {
//         let adminEmail = "admin@petmarket.com";
//         let adminPassword = "admin123";
//         loginForm.addEventListener("submit", function (event) {
//             event.preventDefault();
//             let email = document.querySelector("#email").value;
//             let password = document.querySelector("#password").value;
//             if (email === adminEmail && password === adminPassword) {
//                 window.location.href = "panel.html";
//                 console.log("logueado")
//                 localStorage.setItem("logueado", "true");
//             } else {
//                 alert("Correo o contraseña incorrectos. Intentalo de nuevo.");
//                 document.getElementById("email").value = ""
//                 document.getElementById("password").value = ""
//             }
//         });
//     }
// });


document.addEventListener("DOMContentLoaded", function () {
    let loginForm = document.querySelector("#loginModal form");
    if (loginForm) {
        let adminEmail = "admin@petmarket.com";
        let adminPassword = "admin123";
        
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault();

            let email = document.getElementById("email").value;
            let password = document.getElementById("password").value;

            if (email === adminEmail && password === adminPassword) {
                localStorage.setItem("logueado", "true");
                window.location.href = "panel";
            } else {
                alert("Correo o contraseña incorrectos. Intenta de nuevo.");
                document.getElementById("email").value = "";
                document.getElementById("password").value = "";
            }
        });
    }
});

function cerrarSesion() {
    localStorage.clear();
    window.location.href = "/";
}

let productoId = 1;
let rastreadorProducto = null;
let tablaProductosCuerpo = document.querySelector('#tablaProducto tbody');
let añadirProducto = document.getElementById('añadirProducto');
let guardarCambios = document.getElementById('guardarCambios');
let confirmarBorrado = document.getElementById('confirmarBorrado');

if (añadirProducto && tablaProductosCuerpo) {
    añadirProducto.addEventListener('click', () => {
        let nombre = document.getElementById('nombre').value.trim();
        let categoria = document.getElementById('categoria').value;
        let precio = document.getElementById('precio').value.trim();
        let stock = document.getElementById('stock').value.trim();
        if (!nombre || !categoria || !precio || !stock) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        let fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${productoId++}</td>
            <td>${nombre}</td>
            <td>${categoria}</td>
            <td>$${parseFloat(precio).toFixed(2)}</td>
            <td>${stock}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm me-2 edit-button">Editar</button>
                <button class="btn btn-danger btn-sm me-2 delete-button">Eliminar</button>
            </td>`;
        tablaProductosCuerpo.appendChild(fila);
        document.getElementById('addProductForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addProductModal')).hide();
        fila.querySelector('.edit-button').addEventListener('click', () => openEditModal(fila));
        fila.querySelector('.delete-button').addEventListener('click', () => openDeleteModal(fila));
    });
    function openEditModal(fila) {
        rastreadorProducto = fila;
        let celda = fila.children;
        document.getElementById('editarNombre').value = celda[1].textContent;
        document.getElementById('editarCategoria').value = celda[2].textContent;
        document.getElementById('editarPrecio').value = celda[3].textContent.replace('$', '');
        document.getElementById('editarStock').value = celda[4].textContent;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('editProductModal')).show();
    }
    guardarCambios.addEventListener('click', () => {
        if (!rastreadorProducto) return;
        let nombre = document.getElementById('editarNombre').value.trim();
        let categoria = document.getElementById('editarCategoria').value;
        let precio = document.getElementById('editarPrecio').value.trim();
        let stock = document.getElementById('editarStock').value.trim();
        if (!nombre || !categoria || !precio || !stock) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        let celda = rastreadorProducto.children;
        celda[1].textContent = nombre;
        celda[2].textContent = categoria;
        celda[3].textContent = `$${parseFloat(precio).toFixed(2)}`;
        celda[4].textContent = stock;
        bootstrap.Modal.getInstance(document.getElementById('editProductModal')).hide();
    });

    function openDeleteModal(fila) {
        rastreadorProducto = fila;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteProductModal')).show();
    }
    confirmarBorrado.addEventListener('click', () => {
        if (rastreadorProducto) {
            rastreadorProducto.remove();
            rastreadorProducto = null;
        }
        bootstrap.Modal.getInstance(document.getElementById('deleteProductModal')).hide();
    });
}

let facturaId = 1;
let rastreadorFactura = null;
let tablaFacturasCuerpo = document.querySelector('#tablaFactura tbody');
let añadirFactura = document.getElementById('añadirFactura');
let tablaProductosFacturaCuerpo = document.querySelector('#tablaProductos tbody');
let agregarProductoFactura = document.getElementById('agregarProducto');
let productoInputFactura = document.getElementById('productoInput');

if (añadirFactura && tablaFacturasCuerpo) {
    añadirFactura.addEventListener('click', () => {
        let nombreCliente = document.getElementById('nombreCliente').value.trim();
        let productos = obtenerProductosDeTablaFactura();
        let precio = document.getElementById('precioFactura').value.trim();
        if (!nombreCliente || productos.length === 0 || !precio) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        if (rastreadorFactura) {
            let celdaFactura = rastreadorFactura.children;
            celdaFactura[1].textContent = nombreCliente;
            celdaFactura[2].textContent = productos.join(', ');
            celdaFactura[3].textContent = `$${parseFloat(precio).toFixed(2)}`;
            rastreadorFactura = null;
        } else {
            let filaFactura = document.createElement('tr');
            filaFactura.innerHTML = `
            <td>${facturaId++}</td>
            <td>${nombreCliente}</td>
            <td>${productos.join(', ')}</td>
            <td>$${parseFloat(precio).toFixed(2)}</td>
            <td class="text-center">
                <button class="btn btn-warning btn-sm me-2 edit-button-factura">Editar</button>
                <button class="btn btn-danger btn-sm delete-button-factura">Eliminar</button>
            </td>`;
            tablaFacturasCuerpo.appendChild(filaFactura);
            filaFactura.querySelector('.edit-button-factura').addEventListener('click', () => openEditModalFactura(filaFactura));
            filaFactura.querySelector('.delete-button-factura').addEventListener('click', () => openDeleteModalFactura(filaFactura));
        }
        document.getElementById('addInvoiceForm').reset();
        tablaProductosFacturaCuerpo.innerHTML = '';
        bootstrap.Modal.getInstance(document.getElementById('addInvoiceModal')).hide();
    });

    function obtenerProductosDeTablaFactura() {
        let productos = [];
        tablaProductosFacturaCuerpo.querySelectorAll('tr').forEach(fila => {
            let producto = fila.children[0].textContent.trim();
            productos.push(producto);
        });
        return productos;
    }
    function openEditModalFactura(fila) {
        rastreadorFactura = fila;
        let celdaFactura = fila.children;
        document.getElementById('nombreCliente').value = celdaFactura[1].textContent;
        document.getElementById('precioFactura').value = celdaFactura[3].textContent.replace('$', '');
        let productos = celdaFactura[2].textContent.split(', ');
        cargarProductosEnTablaFactura(productos);
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addInvoiceModal')).show();
    }
    function cargarProductosEnTablaFactura(productos) {
        tablaProductosFacturaCuerpo.innerHTML = '';
        productos.forEach(producto => {
            let fila = document.createElement('tr');
            fila.innerHTML = `
            <td>${producto}</td>
            <td class="text-end">
                <button type="button" class="btn btn-danger btn-sm eliminar-producto-factura">X</button>
            </td>`;
            tablaProductosFacturaCuerpo.appendChild(fila);
            fila.querySelector('.eliminar-producto-factura').addEventListener('click', () => {
                fila.remove();
            });
        });
    }

    function openDeleteModalFactura(filaFactura) {
        rastreadorFactura = filaFactura;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteInvoiceModal')).show();
    }
    document.getElementById('confirmarBorradoFactura').addEventListener('click', () => {
        if (rastreadorFactura) {
            rastreadorFactura.remove();
            rastreadorFactura = null;
        }
        bootstrap.Modal.getInstance(document.getElementById('deleteInvoiceModal')).hide();
    });

    agregarProductoFactura.addEventListener('click', () => {
        let producto = productoInputFactura.value.trim();
        if (!producto) {
            alert('Por favor, ingresa un producto.');
            return;
        }
        let filaFactura = document.createElement('tr');
        filaFactura.innerHTML = `
            <td>${producto}</td>
            <td class="text-end">
                <button type="button" class="btn btn-danger btn-sm eliminar-producto-factura">X</button>
            </td>`;
        tablaProductosFacturaCuerpo.appendChild(filaFactura);
        productoInputFactura.value = '';
        filaFactura.querySelector('.eliminar-producto-factura').addEventListener('click', () => {
            filaFactura.remove();
        });
    });
}

let empleadoId = 1;
let tablaEmpleadosCuerpo = document.querySelector('#tablaEmpleado tbody');
let añadirEmpleado = document.getElementById('añadirEmpleado');
let rastreadorEmpleado = null;

if (añadirEmpleado && tablaEmpleadosCuerpo) {
    añadirEmpleado.addEventListener('click', () => {
        let cedula = document.getElementById('cedulaEmpleado').value.trim();
        let nombre = document.getElementById('nombreEmpleado').value.trim();
        let cargo = document.getElementById('cargo').value.trim();
        let salario = document.getElementById('salario').value.trim();
        if (!cedula || !nombre || !cargo || !salario) {
            alert('Por favor, completa todos los campos.');
            return;
        }
        if (rastreadorEmpleado) {
            let celdaEmpleado = rastreadorEmpleado.children;
            celdaEmpleado[1].textContent = cedula;
            celdaEmpleado[2].textContent = nombre;
            celdaEmpleado[3].textContent = cargo;
            celdaEmpleado[4].textContent = `$${parseFloat(salario).toFixed(2)}`;
            rastreadorEmpleado = null;
        } else {
            let filaEmpleado = document.createElement('tr');
            filaEmpleado.innerHTML = `
                <td>${empleadoId++}</td>
                <td>${cedula}</td>
                <td>${nombre}</td>
                <td>${cargo}</td>
                <td>$${parseFloat(salario).toFixed(2)}</td>
                <td class="text-center">
                    <button class="btn btn-warning btn-sm me-2 edit-button">Editar</button>
                    <button class="btn btn-danger btn-sm delete-button">Eliminar</button>
                </td>`;
            tablaEmpleadosCuerpo.appendChild(filaEmpleado);
            filaEmpleado.querySelector('.edit-button').addEventListener('click', () => openEditModal(filaEmpleado));
            filaEmpleado.querySelector('.delete-button').addEventListener('click', () => openDeleteModal(filaEmpleado));
        }
        document.getElementById('addEmployeeForm').reset();
        bootstrap.Modal.getInstance(document.getElementById('addEmployeeModal')).hide();
    });

    function openEditModal(filaEmpleado) {
        rastreadorEmpleado = filaEmpleado;
        let celdaEmpleado = filaEmpleado.children;
        document.getElementById('cedulaEmpleado').value = celdaEmpleado[1].textContent;
        document.getElementById('nombreEmpleado').value = celdaEmpleado[2].textContent;
        document.getElementById('cargo').value = celdaEmpleado[3].textContent;
        document.getElementById('salario').value = celdaEmpleado[4].textContent.replace('$', '');
        bootstrap.Modal.getOrCreateInstance(document.getElementById('addEmployeeModal')).show();
    }
    function openDeleteModal(filaEmpleado) {
        rastreadorEmpleado = filaEmpleado;
        bootstrap.Modal.getOrCreateInstance(document.getElementById('deleteEmployeeModal')).show();
    }
    document.getElementById('confirmDeleteEmployee').addEventListener('click', () => {
        if (rastreadorEmpleado) {
            rastreadorEmpleado.remove();
            rastreadorEmpleado = null;
            bootstrap.Modal.getInstance(document.getElementById('deleteEmployeeModal')).hide();
        }
    });
}

document.addEventListener("DOMContentLoaded", () => {
    let agregarProductoAdmin = document.getElementById("addProductForm");
    let contenedorProductos = document.getElementById("productContainer");
    let buscarProducto = document.getElementById("productSearch");
    let sugerenciaProductos = document.getElementById("productSuggestions");
    let imagenVista = document.getElementById("productImagePreview");
    let nombreProductoInput = document.getElementById("productName");
    let precioProductoInput = document.getElementById("productPrice");
    let aplicarDescuento = document.getElementById("applyDiscount");
    let opcionesDescuento = document.getElementById("discountOptions");
    let modalEliminar = document.getElementById("deleteProductModal");
    let confirmarEliminar = document.getElementById("confirmDeleteProduct");
    let tarjetaAEliminar = null;
    let tarjetaAEditar = null;
    let posicionTarjetaEliminada = null;
    let productosAdmin = [
        { name: "Juguete para gato con catnip Bird-ee y Turtl-ee", image: "/assets/Imagenes/juguete_para_gato_catnip.webp", title: "Juguete para gato con catnip Bird-ee y Turtl-ee" },
        { name: "Comedero de acero para gato Loving Pets color morado", image: "/assets/Imagenes/comedero_de_acero_para_gato_loving_pets.webp", title: "Comedero de acero para gato Loving Pets color morado" },
        { name: "Hoodie para mascotas Wawaw color surtido, talla L", image: "/assets/Imagenes/hoodie_para_mascotas_wawaw.webp", title: "Hoodie para mascotas Wawaw color surtido, talla L" },
    ];
    if (confirmarEliminar) {
        confirmarEliminar.addEventListener("click", () => {
            if (tarjetaAEliminar) {
                tarjetaAEliminar.remove();
                tarjetaAEliminar = null;
                let modal = bootstrap.Modal.getInstance(document.getElementById("deleteProductModal"));
                if (modal) {
                    modal.hide();
                }
            }
        });

        let asignarEventosTarjetas = (tarjeta) => {
            let editButton = tarjeta.querySelector(".edit-button");
            let deleteButton = tarjeta.querySelector(".delete-button");
            editButton.addEventListener("click", () => {
                tarjetaAEditar = tarjeta;
                let titulo = tarjeta.querySelector(".card-title").textContent;
                let precioTexto = tarjeta.querySelector(".card-text").textContent;
                let imagen = tarjeta.querySelector(".card-img-top").src;
                nombreProductoInput.value = titulo;
                precioProductoInput.value = precioTexto.replace(/[^0-9.]/g, "").trim();
                imagenVista.src = imagen;
                imagenVista.classList.remove("d-none");
                let badge = tarjeta.querySelector(".badge");
                if (badge) {
                    aplicarDescuento.checked = true;
                    opcionesDescuento.classList.remove("d-none");
                    document.getElementById("discountPercentage").value = badge.textContent.replace(/[^0-9]/g, "");
                } else {
                    aplicarDescuento.checked = false;
                    opcionesDescuento.classList.add("d-none");
                }
                let modalEditar = bootstrap.Modal.getOrCreateInstance(document.getElementById("addProductModal"));
                modalEditar.show();
            });
            deleteButton.addEventListener("click", () => {
                tarjetaAEliminar = tarjeta;
                posicionTarjetaEliminada = Array.from(contenedorProductos.children).indexOf(tarjeta);
            });
        };
        let tarjetasIniciales = document.querySelectorAll("#productContainer .col-md-4");
        tarjetasIniciales.forEach((tarjeta) => asignarEventosTarjetas(tarjeta));
        confirmarEliminar.addEventListener("click", () => {
            if (tarjetaAEliminar) {
                tarjetaAEliminar.remove();
                tarjetaAEliminar = null;
                let modal = bootstrap.Modal.getInstance(modalEliminar);
                if (modal) {
                    modal.hide();
                }
            }
        });
        buscarProducto.addEventListener("input", () => {
            let query = buscarProducto.value.toLowerCase();
            sugerenciaProductos.innerHTML = "";
            if (query) {
                let matches = productosAdmin.filter(product =>
                    product.name.toLowerCase().includes(query)
                );
                if (matches.length > 0) {
                    sugerenciaProductos.classList.remove("d-none");
                    matches.forEach(product => {
                        let suggestionItem = document.createElement("li");
                        suggestionItem.className = "list-group-item list-group-item-action";
                        suggestionItem.textContent = product.name;
                        suggestionItem.dataset.image = product.image;
                        suggestionItem.addEventListener("click", () => {
                            buscarProducto.value = product.name;
                            imagenVista.src = product.image;
                            imagenVista.classList.remove("d-none");
                            sugerenciaProductos.classList.add("d-none");
                        });
                        sugerenciaProductos.appendChild(suggestionItem);
                    });
                } else {
                    sugerenciaProductos.classList.add("d-none");
                }
            } else {
                sugerenciaProductos.classList.add("d-none");
            }
        });
        aplicarDescuento.addEventListener("change", () => {
            opcionesDescuento.classList.toggle("d-none", !aplicarDescuento.checked);
        });
        document.querySelector('[data-bs-target="#addProductModal"]').addEventListener("click", () => {
            tarjetaAEditar = null;
            agregarProductoAdmin.reset();
            imagenVista.classList.add("d-none");
            opcionesDescuento.classList.add("d-none");
        });
        agregarProductoAdmin.addEventListener("submit", (event) => {
            event.preventDefault();
            let nombreProductoAdmin = nombreProductoInput.value;
            let imagenProductoAdmin = imagenVista.src;
            let precioProductoAdmin = parseFloat(precioProductoInput.value).toFixed(2);
            let descuentoAplicado = aplicarDescuento.checked;
            let porcentajeDescuento = descuentoAplicado
                ? parseInt(document.getElementById("discountPercentage").value)
                : 0;
            let precioConDescuento = descuentoAplicado
                ? (precioProductoAdmin * (1 - porcentajeDescuento / 100)).toFixed(2)
                : precioProductoAdmin;
            if (tarjetaAEditar) {
                tarjetaAEditar.querySelector(".card-title").textContent = nombreProductoAdmin;
                tarjetaAEditar.querySelector(".card-img-top").src = imagenProductoAdmin;
                tarjetaAEditar.querySelector(".card-text").innerHTML = descuentoAplicado
                    ? `<span class="text-muted text-decoration-line-through fw-bold">$${precioProductoAdmin} COP</span>
                   <span class="text-danger fw-bold ms-2">$${precioConDescuento} COP</span>`
                    : `<span class="text-dark fw-bold">$${precioProductoAdmin} COP</span>`;
                let badge = tarjetaAEditar.querySelector(".badge");
                if (descuentoAplicado) {
                    if (!badge) {
                        let newBadge = document.createElement("span");
                        newBadge.className = "badge bg-danger position-absolute top-0 start-0 m-2 px-3 py-2 rounded-pill shadow";
                        newBadge.textContent = `-${porcentajeDescuento}% OFF`;
                        tarjetaAEditar.querySelector(".card").prepend(newBadge);
                    } else {
                        badge.textContent = `-${porcentajeDescuento}% OFF`;
                    }
                } else if (badge) {
                    badge.remove();
                }
            } else {
                let card = document.createElement("div");
                card.className = "col-md-4 mt-4";
                card.innerHTML = `
                <div class="card position-relative">
                    ${descuentoAplicado
                        ? `<span class="badge bg-danger position-absolute top-0 start-0 m-2 px-3 py-2 rounded-pill shadow">
                                -${porcentajeDescuento}% OFF
                            </span>`
                        : ""
                    }
                    <img src="${imagenProductoAdmin}" class="card-img-top" 
                        alt="${nombreProductoAdmin}" title="${nombreProductoAdmin}" loading="lazy">
                    <div class="card-body text-center">
                        <h5 class="card-title">${nombreProductoAdmin}</h5>
                        <p class="card-text">
                            ${descuentoAplicado
                        ? `<span class="text-muted text-decoration-line-through fw-bold">$${precioProductoAdmin} COP</span>
                                       <span class="text-danger fw-bold ms-2">$${precioConDescuento} COP</span>`
                        : `<span class="text-dark fw-bold">$${precioProductoAdmin} COP</span>`
                    }
                        </p>
                        <div class="d-flex justify-content-center gap-2">
                            <button class="btn btn-warning btn-sm edit-button">Editar</button>
                            <button class="btn btn-danger btn-sm delete-button" data-bs-toggle="modal" data-bs-target="#deleteProductModal">Eliminar</button>
                        </div>
                        <a href="#" class="btn btn-primary mt-3">Comprar</a>
                    </div>
                </div>`;
                if (posicionTarjetaEliminada !== null) {
                    contenedorProductos.insertBefore(card, contenedorProductos.children[posicionTarjetaEliminada]);
                    posicionTarjetaEliminada = null;
                } else {
                    contenedorProductos.appendChild(card);
                }

                asignarEventosTarjetas(card);
            }
            agregarProductoAdmin.reset();
            imagenVista.classList.add("d-none");
            opcionesDescuento.classList.add("d-none");
            let modal = bootstrap.Modal.getOrCreateInstance(document.getElementById("addProductModal"));
            modal.hide();
        });
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // Solo ejecutar en carrito.html
    if (window.location.pathname.endsWith('carrito.html')) {
        function actualizarResumenYBadge() {
            let productos = document.querySelectorAll('.producto-carrito');
            let subtotal = 0;
            let total = 0;
            let descuento = 0;

            productos.forEach(prod => {
                let precios = prod.querySelectorAll('.ms-3.text-end span');
                if (precios.length === 2) {
                    let original = parseInt(precios[0].textContent.replace(/[^\d]/g, '')) || 0;
                    let rebajado = parseInt(precios[1].textContent.replace(/[^\d]/g, '')) || 0;
                    subtotal += original;
                    total += rebajado;
                    descuento += (original - rebajado);
                }
            });
            let resumenSubtotal = document.getElementById('resumen-subtotal');
            let resumenDescuento = document.getElementById('resumen-descuento');
            let resumenTotal = document.getElementById('resumen-total');
            if (resumenSubtotal) resumenSubtotal.textContent = subtotal > 0 ? `$${subtotal.toLocaleString('es-CO')}` : '$0';
            if (resumenDescuento) resumenDescuento.textContent = descuento > 0 ? `-$${descuento.toLocaleString('es-CO')}` : '$0';
            if (resumenTotal) resumenTotal.textContent = total > 0 ? `$${total.toLocaleString('es-CO')}` : '$0';
            let badge = document.querySelector('.btn-primary .badge');
            if (badge) {
                if (productos.length === 0) {
                    badge.style.display = 'none';
                } else {
                    badge.style.display = '';
                    badge.textContent = productos.length;
                    let hidden = document.createElement('span');
                    hidden.className = "visually-hidden";
                    hidden.textContent = "productos en el carrito";
                    badge.appendChild(hidden);
                }
            }
        }
        document.querySelectorAll('.d-flex.align-items-center.mb-4.p-3.rounded-3').forEach(div => {
            div.classList.add('producto-carrito');
        });
        document.querySelectorAll('.btn-eliminar-producto').forEach(btn => {
            btn.addEventListener('click', function () {
                let prod = this.closest('.producto-carrito');
                if (prod) prod.remove();
                actualizarResumenYBadge();
            });
        });
        actualizarResumenYBadge();
    }
});

document.getElementById('btn-pedidos').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('seccion-configuracion').classList.add('d-none');
    document.getElementById('seccion-pedidos').classList.remove('d-none');
});
document.getElementById('btn-configuracion').addEventListener('click', function (e) {
    e.preventDefault();
    document.getElementById('seccion-pedidos').classList.add('d-none');
    document.getElementById('seccion-configuracion').classList.remove('d-none');
});