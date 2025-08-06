//Admin controller
const Admin = require('../models/cliente.model');
const ADMIN_ID = '68923b46f8474561cc49dda0';

exports.mostrarPerfil = async (req, res) => {
  try {
    const admin = await Admin.findById(ADMIN_ID);
    if (!admin) return res.status(404).send('Admin no encontrado');
    res.render('perfilAdmin', { admin });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error al cargar perfil');
  }
};

exports.actualizarPerfil = async (req, res) => {
  try {
    const { nombre, correo, telefono, direccion } = req.body;

    const admin = await Admin.findByIdAndUpdate(
      ADMIN_ID,
      { nombre, email: correo, telefono, direccion },
      { new: true }
    );

    if (!admin) return res.status(404).send('Admin no encontrado');

    res.redirect('/perfil/admin');
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).send('Error al actualizar el perfil');
  }
};

exports.cambiarContrasena = async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;

    if (!actual || !nueva || !confirmar) {
      return res.status(400).json({ mensaje: 'Completa todos los campos' });
    }

    if (nueva.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (nueva !== confirmar) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    const admin = await Admin.findById(ADMIN_ID);
    if (!admin) return res.status(404).json({ mensaje: 'Admin no encontrado' });

    if (admin.contrasena !== actual) {
      return res.status(400).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    await Admin.findByIdAndUpdate(ADMIN_ID, { contrasena: nueva });

    return res.status(200).json({ mensaje: 'Contraseña cambiada con éxito' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ mensaje: 'Hubo un error al cambiar la contraseña' });
  }
};

// Cliente controller
const Cliente = require('../models/cliente.model');
const CLIENT_ID = '68935bb088e39a741ad59f35';

exports.mostrarPerfilCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(CLIENT_ID);
    if (!cliente) return res.status(404).send('Cliente no encontrado');
    return res.render('perfilCliente', { cliente });
  } catch (err) {
    console.error(err);
    return res.status(500).send('Error al cargar perfil cliente');
  }
};

exports.actualizarPerfilCliente = async (req, res) => {
  try {
    const { nombre, correo, telefono, direccion } = req.body;

    const cliente = await Cliente.findByIdAndUpdate(
      CLIENT_ID,
      { nombre, email: correo, telefono, direccion },
      { new: true }
    );

    if (!cliente) return res.status(404).send('Cliente no encontrado');

    return res.redirect('/perfil/cliente');
  } catch (error) {
    console.error('Error al actualizar perfil cliente:', error);
    return res.status(500).send('Error al actualizar el perfil del cliente');
  }
};

exports.cambiarContrasenaCliente = async (req, res) => {
  try {
    const { actual, nueva, confirmar } = req.body;

    if (!actual || !nueva || !confirmar) {
      return res.status(400).json({ mensaje: 'Completa todos los campos' });
    }

    if (nueva.length < 6) {
      return res.status(400).json({ mensaje: 'La contraseña debe tener al menos 6 caracteres' });
    }

    if (nueva !== confirmar) {
      return res.status(400).json({ mensaje: 'Las contraseñas no coinciden' });
    }

    const cliente = await Cliente.findById(CLIENT_ID);
    if (!cliente) return res.status(404).json({ mensaje: 'Cliente no encontrado' });

    if (cliente.contrasena !== actual) {
      return res.status(400).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    await Cliente.findByIdAndUpdate(CLIENT_ID, { contrasena: nueva });

    return res.status(200).json({ mensaje: 'Contraseña cambiada con éxito' });
  } catch (error) {
    console.error('Error al cambiar contraseña cliente:', error);
    return res.status(500).json({ mensaje: 'Hubo un error al cambiar la contraseña' });
  }
};

