const Producto = require('../models/producto.model');

/**
 * Renderizar la página de inicio.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página principal con productos destacados
 * @author codenova
 */
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

/**
 * Renderizar la página de catálogo.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página de catálogo de productos
 * @author codenova
 */
exports.mostrarCatalogo = (req, res) => {
  res.render('catalogo');
};


/**
 * Renderizar la página de "Nosotros" para visitantes.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página informativa de la empresa
 * @author codenova
 */
exports.nosotrosVisitantes = (req, res) => {
  res.render('nosotros');
};

/**
 * Renderizar página de restricción de acceso.
 * @params req, res - solicitud y respuesta HTTP
 * @return Renderiza la página de restricción
 * @author codenova
 */
exports.restriccion = (req, res) => {
  res.render('restriccion');
};

