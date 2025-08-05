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

    res.redirect('/perfilAdmin');
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

    admin.contrasena = nueva;
    await admin.save();

    return res.status(200).json({ mensaje: 'Contraseña cambiada con éxito' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    return res.status(500).json({ mensaje: 'Hubo un error al cambiar la contraseña' });
  }
};
