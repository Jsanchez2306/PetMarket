const Cliente = require('../models/cliente.model');
const Empleado = require('../models/empleado.model');

// Mostrar perfil de administrador/empleado
exports.mostrarPerfil = async (req, res) => {
  try {
    // Obtener información del empleado/admin desde el token
    const admin = req.user || {};
    res.render('perfilAdmin', { admin });
  } catch (error) {
    console.error('Error mostrando perfil admin:', error);
    res.status(500).render('error', { message: 'Error al cargar el perfil' });
  }
};

// Actualizar perfil de administrador/empleado
exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, correo, telefono, direccion } = req.body;
    const userId = req.user.id;

    // Buscar empleado/admin
    const empleado = await Empleado.findById(userId);
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    // Actualizar datos
    empleado.nombre = nombre;
    empleado.email = correo;
    if (telefono) empleado.telefono = telefono;
    if (direccion) empleado.direccion = direccion;

    await empleado.save();

    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando perfil admin:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
  }
};

// Cambiar contraseña de administrador/empleado
exports.cambiarContrasena = async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;
    const userId = req.user.id;

    if (nueva !== confirmar) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    const empleado = await Empleado.findById(userId);
    if (!empleado) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (empleado.contrasena !== actual) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    empleado.contrasena = nueva;
    await empleado.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña admin:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
};

// Mostrar perfil de cliente
exports.mostrarPerfilCliente = async (req, res) => {
  try {
    // Obtener información del cliente desde el token
    const cliente = req.user || {};
    res.render('perfilCliente', { cliente });
  } catch (error) {
    console.error('Error mostrando perfil cliente:', error);
    res.status(500).render('error', { message: 'Error al cargar el perfil' });
  }
};

// Actualizar perfil de cliente
exports.actualizarPerfilCliente = async (req, res) => {
  try {
    const { nombre, correo, telefono, direccion } = req.body;
    const userId = req.user.id;

    // Buscar cliente
    const cliente = await Cliente.findById(userId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    // Actualizar datos
    cliente.nombre = nombre;
    cliente.email = correo;
    if (telefono) cliente.telefono = telefono;
    if (direccion) cliente.direccion = direccion;

    await cliente.save();

    res.json({ mensaje: 'Perfil actualizado correctamente' });
  } catch (error) {
    console.error('Error actualizando perfil cliente:', error);
    res.status(500).json({ mensaje: 'Error al actualizar el perfil' });
  }
};

// Cambiar contraseña de cliente
exports.cambiarContrasenaCliente = async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;
    const userId = req.user.id;

    if (nueva !== confirmar) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    const cliente = await Cliente.findById(userId);
    if (!cliente) {
      return res.status(404).json({ mensaje: 'Cliente no encontrado' });
    }

    if (cliente.contrasena !== actual) {
      return res.status(401).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    cliente.contrasena = nueva;
    await cliente.save();

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error cambiando contraseña cliente:', error);
    res.status(500).json({ mensaje: 'Error al cambiar la contraseña' });
  }
};