let empleados = [
  {
    nombre: "Laura",
    apellido: "Gómez",
    cedula: "12345678",
    correo: "laura@example.com",
    telefono: "3001234567",
    direccion: "Cra 10 #20-30",
    password: "laura123"
  },
  {
    nombre: "Carlos",
    apellido: "Ramírez",
    cedula: "87654321",
    correo: "carlos@example.com",
    telefono: "3017654321",
    direccion: "Cll 45 #56-78",
    password: "carlos456"
  }
];

let cantidadEmpleados=document.getElementById("cantidadEmpleados");
if (cantidadEmpleados) {
    cantidadEmpleados.innerText=empleados.length;
}

function mostrarEmpleados() {
  const tbodyE = document.getElementById("bodyEmpleados");

  tbodyE.innerHTML = "";
  empleados.forEach((empleado, index) => {
    tbodyE.innerHTML += `
        <tr>
          <td>${empleado.nombre}</td>
          <td>${empleado.apellido}</td>
          <td>${empleado.cedula}</td>
          <td>${empleado.correo}</td>
          <td>${empleado.telefono}</td>
          <td>${empleado.direccion}</td>
          <td>${empleado.password}</td>
          <td class="text-center">
            <button class="btn btn-warning btn-sm mt-2 " onclick="editarEmpleado(${index})">Editar</button>
            <button class="btn btn-danger btn-sm mt-2" onclick="eliminarEmpleado(${index})">Eliminar</button>
          </td>
        </tr>
      `;
  });
}

function eliminarEmpleado(index) {
  if (confirm("¿Estás seguro de eliminar este empleado?")) {
    empleados.splice(index, 1);
    mostrarEmpleados();
  }
}




function editarEmpleado(index) {
  const empleado = empleados[index];
  indexEditando = index;

  document.getElementById("edit-nombre").value = empleado.nombre;
  document.getElementById("edit-apellido").value = empleado.apellido;
  document.getElementById("edit-cedula").value = empleado.cedula;
  document.getElementById("edit-correo").value = empleado.correo;
  document.getElementById("edit-telefono").value = empleado.telefono;
  document.getElementById("edit-direccion").value = empleado.direccion;
  document.getElementById("edit-password").value = empleado.password;

  const modal = new bootstrap.Modal(document.getElementById("modalEditarEmpleado"));
  modal.show();
}



document.getElementById("form-editar-empleado").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("edit-nombre").value.trim();
  const apellido = document.getElementById("edit-apellido").value.trim();
  const cedula = document.getElementById("edit-cedula").value.trim();
  const correo = document.getElementById("edit-correo").value.trim();
  const telefono = document.getElementById("edit-telefono").value.trim();
  const direccion = document.getElementById("edit-direccion").value.trim();
  const password = document.getElementById("edit-password").value.trim();

  if (!nombre || !apellido || !cedula || !correo || !telefono || !direccion || !password) {
    alert("Por favor completa todos los campos.");
    return;
  }

  empleados[indexEditando] = { nombre, apellido, cedula, correo, telefono, direccion, password };
  mostrarEmpleados();

  const modal = bootstrap.Modal.getInstance(document.getElementById('modalEditarEmpleado'));
  modal.hide();
});


document.getElementById("form-agregar-empleado").addEventListener("submit", function (e) {
  e.preventDefault();

  const nombre = document.getElementById("nombre").value.trim();
  const apellido = document.getElementById("apellido").value.trim();
  const cedula = document.getElementById("cedula").value.trim();
  const correo = document.getElementById("correo").value.trim();
  const telefono = document.getElementById("telefono").value.trim();
  const direccion = document.getElementById("direccion").value.trim();
  const password = document.getElementById("password").value.trim();

  if (!nombre || !apellido || !cedula || !correo || !telefono || !direccion || !password) {
    alert("Por favor completa todos los campos.");
    return;
  }

  empleados.push({ nombre, apellido, cedula, correo, telefono, direccion, password });
  
  mostrarEmpleados();

  
  const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarEmpleado'));
  modal.hide();

  e.target.reset();
});


document.addEventListener("DOMContentLoaded", mostrarEmpleados);

console.log(empleados)






