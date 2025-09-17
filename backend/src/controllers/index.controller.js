const Producto = require('../models/producto.model');

exports.mostrarInicio = async (req, res) => {
  try {
    // Obtener 3 productos aleatorios
    const productosDestacados = await Producto.aggregate([
      { $sample: { size: 3 } }
    ]);
    
    res.render('index', { productosDestacados });
  } catch (err) {
    console.error('Error al obtener productos destacados:', err);
    // En caso de error, renderizar sin productos
    res.render('index', { productosDestacados: [] });
  }
};

exports.mostrarCatalogo = (req, res) => {
  res.render('catalogo');
};

exports.nosotrosAdmin = (req, res) => {
  res.render('nosotrosAdmin');
};

exports.nosotrosClientes = (req, res) => {
  res.render('nosotrosCliente');
};

exports.nosotrosVisitantes = (req, res) => {
  res.render('nosotros');
};

exports.restriccion = (req, res) => {
  res.render('restriccion');
};

