// CONTROLADOR DE FACTURACION Y VENTAS

const Factura = require('../models/factura.model');

// Crear una nueva factura
exports.crearFactura = async (req, res) => {
    try {
        const factura = new Factura(req.body);
        await factura.save();

        res.status(201).json({
            mensaje: 'Factura creada correctamente',
            datos: factura
        });
    } catch (error) {
        res.status(400).json({
            mensaje: 'Error al crear la factura',
            error: error.message
        });
    }
};

// Listar todas las facturas
exports.listarFacturas = async (req, res) => {
    try {
        const facturas = await Factura.find();

        res.status(200).json({
            mensaje: 'Lista de facturas',
            total: facturas.length,
            datos: facturas
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al listar facturas',
            error: error.message
        });
    }
};

// Obtener una factura por ID
exports.obtenerFacturaPorId = async (req, res) => {
    try {
        const factura = await Factura.findById(req.params.id);

        if (!factura) {
            return res.status(404).json({
                mensaje: 'Factura no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Factura encontrada',
            datos: factura
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al obtener la factura',
            error: error.message
        });
    }
};

// Actualizar una factura
exports.actualizarFactura = async (req, res) => {
    try {
        const factura = await Factura.findByIdAndUpdate(req.params.id, req.body, { new: true });

        if (!factura) {
            return res.status(404).json({
                mensaje: 'Factura no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Factura actualizada correctamente',
            datos: factura
        });
    } catch (error) {
        res.status(400).json({
            mensaje: 'Error al actualizar la factura',
            error: error.message
        });
    }
};

// Eliminar una factura
exports.eliminarFactura = async (req, res) => {
    try {
        const factura = await Factura.findByIdAndDelete(req.params.id);

        if (!factura) {
            return res.status(404).json({
                mensaje: 'Factura no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Factura eliminada correctamente'
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al eliminar la factura',
            error: error.message
        });
    }
};
// Buscar facturas por correo del cliente
exports.buscarPorCorreo = async (req, res) => {
    try {
        const correo = req.params.correo;
        const facturas = await Factura.find({ "cliente.correo": correo });

        if (facturas.length === 0) {
            return res.status(404).json({
                mensaje: 'No se encontraron facturas con ese correo'
            });
        }

        res.status(200).json({
            mensaje: 'Facturas encontradas',
            total: facturas.length,
            datos: facturas
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al buscar facturas por correo',
            error: error.message
        });
    }
};


exports.eliminarFactura = async (req, res) => {
    try {
        console.log('ID recibido para eliminar:', req.params.id); // 👈 Agregado

        const factura = await Factura.findByIdAndDelete(req.params.id);

        if (!factura) {
            return res.status(404).json({
                mensaje: 'Factura no encontrada'
            });
        }

        res.status(200).json({
            mensaje: 'Factura eliminada correctamente'
        });
    } catch (error) {
        res.status(500).json({
            mensaje: 'Error al eliminar la factura',
            error: error.message
        });
    }
};
