
let cantidadClientes = document.getElementById("cantidadClientes");
if (cantidadClientes) {
    async function cargarClientesDesdeDB() {
        try {
            const res = await fetch('/api/clientes');
            const clientes = await res.json();

            cantidadClientes.innerText = clientes.length;

            console.log("Clientes cargados desde la base de datos:", clientes);

        } catch (err) {
            console.error('Error al cargar clientes:', err);
        }
    }

    cargarClientesDesdeDB();
}



const tbody = document.getElementById('tablaUsuarios');

async function renderTabla() {
    try {
        const res = await fetch('/api/clientes');
        const clientes = await res.json();

        tbody.innerHTML = '';

        clientes.forEach((cliente, index) => {
            const fila = document.createElement("tr");
            fila.dataset.id = cliente._id; // Guarda el ID del cliente aquí

            fila.innerHTML = `
    <td>${index + 1}</td>
    <td><input type="text" class="form-control" value="${cliente.correo}" disabled></td>
    <td><input type="password" class="form-control" value="${cliente.contrasena}" disabled></td>
    <td><input type="text" class="form-control" value="${new Date(cliente.fechaRegistro).toLocaleDateString()}" disabled></td>
    <td class="text-center">
      <button class="btn btn-warning btn-sm me-1" onclick="editarCliente(this)">Editar</button>
      <button class="btn btn-danger btn-sm" onclick="eliminarCliente(this)">Eliminar</button>
    </td>
  `;

            tbody.appendChild(fila);
        });


    } catch (err) {
        console.error('Error al cargar clientes:', err);
    }
}

window.addEventListener('DOMContentLoaded', renderTabla);




function editarCliente(boton) {
    const fila = boton.closest("tr");
    const inputs = fila.querySelectorAll("input");

    if (boton.textContent === "Editar") {
        inputs.forEach(input => input.disabled = false);
        boton.textContent = "Guardar";
        boton.classList.remove("btn-warning");
        boton.classList.add("btn-success");
    } else {
        // Guardar los cambios
        const clienteId = fila.dataset.id;
        const correo = inputs[0].value;
        const contrasena = inputs[1].value;

        fetch(`/api/clientes/${clienteId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ correo, contrasena }),
        })
            .then(res => res.json())
            .then(data => {
                alert("Cliente actualizado.");
                inputs.forEach(input => input.disabled = true);
                boton.textContent = "Editar";
                boton.classList.remove("btn-success");
                boton.classList.add("btn-warning");
            })
            .catch(err => {
                console.error("Error al actualizar:", err);
                alert("Ocurrió un error.");
            });
    }
}



async function eliminarCliente(boton) {
    const fila = boton.closest("tr");
    const clienteId = fila.dataset.id;

    const confirmacion = confirm("¿Estás seguro de que deseas eliminar este cliente?");
    if (!confirmacion) return;

    try {
        const res = await fetch(`/api/clientes/${clienteId}`, {
            method: "DELETE",
        });

        if (res.ok) {
            alert("Cliente eliminado correctamente.");
            fila.remove(); // Elimina la fila de la tabla
        } else {
            alert("Error al eliminar cliente.");
        }
    } catch (error) {
        console.error("Error eliminando cliente:", error);
    }

    renderTabla();
}



document.getElementById("formRegistrarCliente").addEventListener("submit", async function (e) {
    e.preventDefault(); // Evita que recargue la página

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const passwordVerify = document.getElementById("passwordVerify").value;
    const condiciones = document.getElementById("condiciones").checked;

    if (password !== passwordVerify) {
        return alert("Las contraseñas no coinciden");
    }

    if (!condiciones) {
        return alert("Debe aceptar los términos y condiciones");
    }

    try {
        const res = await fetch("/registrarCliente", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });

        if (!res.ok) throw new Error("Error al registrar");

        const data = await res.json();

        alert("✅ Cliente registrado con éxito");

        // Limpia el formulario
        e.target.reset();
        // Cierra el modal
        const modalElement = document.getElementById('registerModal');
        const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
        modal.hide();

        renderTabla();
    } catch (error) {
        console.error(error);
        alert("❌ Ocurrió un error al registrar el cliente");
    }
});



renderTabla();


