const Producto = require('../models/productos.model');
const Cliente = require('../models/cliente.model');
const Empleado = require('../models/empleado.model');

exports.mostrarPanel = async (req, res) => {
    try {
        const cantidadProductos = await Producto.countDocuments();
        const cantidadClientes = await Cliente.countDocuments();
        const cantidadEmpleados = await Empleado.countDocuments();

        res.render('panel', { 
            cantidadProductos, 
            cantidadClientes, 
            cantidadEmpleados 
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al cargar el panel');
    }
};
