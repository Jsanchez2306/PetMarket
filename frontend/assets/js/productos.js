document.addEventListener("DOMContentLoaded", () => {
    // Array compartido de productos
    let productos = [
        {
            imagen: "assets/Imagenes/juguete_para_gato_catnip.webp",
            titulo: "Alimentos para tu mascota",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Comida"
        },
        {
            imagen: "assets/Imagenes/pedigree.webp",
            titulo: "Alimentos para tu mascota",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Comida"
        },
        {
            imagen: "assets/Imagenes/alimento_de_mascotas_delivey.webp",
            titulo: "Alimentos para tu mascota",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Comida"
        }
        ,
        {
            imagen: "assets/Imagenes/promocion_comida_pedigree.webp",
            titulo: "Alimentos para tu mascota",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Comida"
        },
        {
            imagen: "assets/Imagenes/pedigree.webp",
            titulo: "Alimentos para tu mascota",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Comida"
        },
        {
            imagen: "assets/Imagenes/hoodie_para_mascotas_wawaw.webp",
            titulo: "Alimentos para tu mascota",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Comida"
        }
    ];


    let juguetes = [
        {
            imagen: "assets/Imagenes/juguete1.png",
            titulo: "Collar Reflectante",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Juguetes"
        },
        {
            imagen: "assets/Imagenes/juguete2.png",
            titulo: "Collar Reflectante",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Juguetes"
        },
        {
            imagen: "assets/Imagenes/juguete3.png",
            titulo: "Collar Reflectante",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Juguetes"
        }
        ,
        {
            imagen: "assets/Imagenes/juguete4.png",
            titulo: "Collar Reflectante",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Juguetes"
        },
        {
            imagen: "assets/Imagenes/juguete5.png",
            titulo: "Collar Reflectante",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Juguetes"
        },
        {
            imagen: "assets/Imagenes/juguete6.png",
            titulo: "Collar Reflectante",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "Juguetes"
        }
    ];

    let accesorios = [
        {
            imagen: "assets/Imagenes/Bandanaroja.jpeg",
            titulo: "Rojo para tu gato",
            descripcion: "De lo mejor",
            precio: 15000,
            stock: 7,
            categoria: "accesorios"
        },
        {
            imagen: "assets/Imagenes/bañoloro.jpeg",
            titulo: "Baño",
            descripcion: "EL mejor baño pa ese pajaro",
            precio: 15000,
            stock: 7,
            categoria: "accesorios"
        },
        {
            imagen: "assets/Imagenes/busogucci1.jpeg",
            titulo: "Buso",
            descripcion: "Para que mantenga ese chandoso caliente",
            precio: 15000,
            stock: 7,
            categoria: "accesorios"
        }
        ,
        {
            imagen: "assets/Imagenes/camisagato.jpeg",
            titulo: "Camisa",
            descripcion: "Para tener ese gato bien presentado",
            precio: 15000,
            stock: 7,
            categoria: "accesorios"
        },
        {
            imagen: "assets/Imagenes/pedigree.webp",
            titulo: "Gafas",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "accesorios"
        },
        {
            imagen: "assets/Imagenes/hoodie_para_mascotas_wawaw.webp",
            titulo: "Que accesorio",
            descripcion: "Collar ajustable con tira reflectante para mayor seguridad nocturna.",
            precio: 15000,
            stock: 7,
            categoria: "accesorios"
        }
    ];

    let todosLosProductos = [...productos, ...juguetes, ...accesorios];


    console.log(todosLosProductos)


    let cantidadProductos = document.getElementById("cantidadProductos")
    if (cantidadProductos) {
        cantidadProductos.innerText = todosLosProductos.length;
    }



    // comida en venta

    const contenedor = document.getElementById("productosContainer");

    if (contenedor) {
        productos.forEach(producto => {
            const card = document.createElement("div");
            card.className = "col-md-4 mb-4";
            card.innerHTML = `
               <div class="card position-relative mt-3">
                            
                            <img src="${producto.imagen}" class="card-img-top"
                                alt="Juguete para gato con catnip Bird-ee y Turtl-ee"
                                title="Juguete para gato con catnip Bird-ee y Turtl-ee" loading="lazy">
                            <div class="card-body text-center">
                                <h5 class="card-title" title="">${producto.titulo}</h5>
                                <p class="card-text">
                                    <span class="text-muted text-decoration-line-through fw-bold">$12.071 COP</span>
                                    <span class="text-danger fw-bold ms-2">$${producto.precio}  COP</span>
                                </p>
                                <a href="comprarproducto.html" class="btn btn-primary">Comprar</a>
                            </div>
                        </div>
            `;
            contenedor.appendChild(card);
        });
    }

    // juguetes en venta

    const contenedorJuguetes = document.getElementById("juguetesContainer");

    if (contenedorJuguetes) {
        juguetes.forEach(juguete => {
            const card = document.createElement("div");
            card.className = "col-md-4 mb-4";
            card.innerHTML = `
                <div class="card position-relative">
                           
                            <img src="${juguete.imagen}" class="card-img-top"
                                alt="Juguete para gato con catnip Bird-ee y Turtl-ee"
                                title="Juguete para gato con catnip Bird-ee y Turtl-ee" loading="lazy">
                            <div class="card-body text-center">
                                <h5 class="card-title" title="">${juguete.titulo}</h5>
                                <p class="card-text">
                                    <span class="text-muted text-decoration-line-through fw-bold">$12.071 COP</span>
                                    <span class="text-danger fw-bold ms-2">$${juguete.precio}  COP</span>
                                </p>
                                <a href="comprarproducto.html" class="btn btn-primary">Comprar</a>
                            </div>
                        </div>
            `;
            contenedorJuguetes.appendChild(card);
        });
    }

    // accesorios en venta

    let contenedorAccesorios = document.getElementById("accesoriosContainer");

    if (contenedorAccesorios) {
        accesorios.forEach(accesorio => {
            const card = document.createElement("div");
            card.className = "col-md-4 mb-4";
            card.innerHTML = `
               <div class="card position-relative">
                            
                            <img src="${accesorio.imagen}" class="card-img-top"
                                alt="Juguete para gato con catnip Bird-ee y Turtl-ee"
                                title="Juguete para gato con catnip Bird-ee y Turtl-ee" loading="lazy">
                            <div class="card-body text-center">
                                <h5 class="card-title" title="">${accesorio.titulo}</h5>
                                <p class="card-text">
                                    <span class="text-muted text-decoration-line-through fw-bold">$12.071 COP</span>
                                    <span class="text-danger fw-bold ms-2">$${accesorio.precio}  COP</span>
                                </p>
                                <a href="comprarproducto.html" class="btn btn-primary">Comprar</a>
                            </div>
                        </div>
            `;
            contenedorAccesorios.appendChild(card);
        });
    }


    // administracion todos los productos
    const tablaProductos = document.getElementById("tablaProductos");

    if (tablaProductos) {
        function renderProductos() {
            tablaProductos.innerHTML = "";
            todosLosProductos.forEach((producto, index) => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${index + 1}</td>
                    <td><input class="form-control" value="${producto.titulo}" disabled></td>
                    <td><input class="form-control" value="${producto.descripcion}" disabled></td>
                    <td><input class="form-control" value="${producto.imagen}" disabled></td>
                    <td><input class="form-control" value="${producto.precio}" disabled></td>
                    <td style="max-width:10px"><input class="form-control" value="${producto.stock}" disabled></td>
                    <td><input class="form-control" value="${producto.categoria}" disabled></td>
                    <td class="text-center">
                        <button class="btn btn-warning btn-sm mt-2" onclick="editarProducto(${index})">Editar</button>
                        <button class="btn btn-danger btn-sm mt-2" onclick="eliminarProducto(${index})">Eliminar</button>
                    </td>
                `;
                tablaProductos.appendChild(row);
            });
        }

        window.editarProducto = function (index) {

            const producto = todosLosProductos[index]
            indexEditando = index;

            document.getElementById("edit-url").value = producto.imagen
            document.getElementById("edit-nombre").value = producto.titulo
            document.getElementById("edit-descripcion").value = producto.descripcion
            document.getElementById("edit-precio").value = producto.precio
            document.getElementById("edit-stock").value = producto.stock
            document.getElementById("edit-categoria").value = producto.categoria




            const modal = new bootstrap.Modal(document.getElementById("editProductModal"));
            modal.show();

        };


        document.getElementById("formEditarProducto").addEventListener("submit", function (e) {
            e.preventDefault();

            const titulo = document.getElementById("edit-nombre").value.trim();
            const descripcion = document.getElementById("edit-descripcion").value.trim();
            const imagen = document.getElementById("edit-url").value.trim();
            const precio = document.getElementById("edit-precio").value.trim();
            const stock = document.getElementById("edit-stock").value.trim();
            const categoria = document.getElementById("edit-categoria").value.trim();


            if (!titulo || !descripcion || !imagen || !precio || !stock || !categoria) {
                alert("Por favor completa todos los campos.");
                return;
            }


            todosLosProductos[indexEditando] = { imagen, titulo, descripcion, precio, stock, categoria };
            renderProductos()

            switch (todosLosProductos[indexEditando].categoria.toLocaleLowerCase()) {
                case "juguetes":
                    juguetes.push(todosLosProductos[indexEditando]);
                    break;
                case "comida":
                    productos.push(todosLosProductos[indexEditando]);
                    break;
                case "accesorios":
                    accesorios.push(todosLosProductos[indexEditando]);
                    break;
            }

            console.log(juguetes, productos, accesorios)

            const modal = bootstrap.Modal.getInstance(document.getElementById('editProductModal'));
            modal.hide();
            e.target.reset()

            alert("producto editado con exito")

        });


        window.eliminarProducto = function (index) {
            if (confirm("¿Eliminar este producto?")) {
                todosLosProductos.splice(index, 1);
                renderProductos();
            }
        };

        const form = document.getElementById("formProducto");
        if (form) {


            document.getElementById("añadirProducto").addEventListener("click", function () {
                const nombre = document.getElementById("nombre").value.trim();
                const descripcion = document.getElementById("descripcion").value.trim();
                const imagen = document.getElementById("url").value.trim();
                const precio = parseFloat(document.getElementById("precio").value);
                const stock = parseInt(document.getElementById("stock").value);
                const categoria = document.getElementById("categoria").value;

                if (!nombre || !descripcion || !imagen || isNaN(precio) || isNaN(stock) || !categoria) {
                    alert("Por favor, completa todos los campos correctamente.");
                    return;
                }

                const nuevoProducto = {
                    titulo: nombre,
                    descripcion: descripcion,
                    imagen: imagen,
                    precio: precio,
                    stock: stock,
                    categoria: categoria
                };


                todosLosProductos.push(nuevoProducto);
                renderProductos();


                switch (categoria.toLowerCase()) {
                    case "juguetes":
                        juguetes.push(nuevoProducto);
                        break;
                    case "comida":
                        productos.push(nuevoProducto);
                        break;
                    case "accesorios":
                        accesorios.push(nuevoProducto);
                        break;
                }

                console.log(juguetes, productos, accesorios)

                alert("Producto guardado exitosamente 😄");
                document.getElementById("formProducto").reset();
                console.log("Todos los productos:", todosLosProductos);
            });

        }

        renderProductos();
    }

});


